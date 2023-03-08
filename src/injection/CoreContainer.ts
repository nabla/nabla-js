import { URL } from "url";
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
  split,
} from "@apollo/client/core";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient, GRAPHQL_TRANSPORT_WS_PROTOCOL } from "graphql-ws";

import { TokenRemoteDataSource } from "../data/auth/TokenRemoteDataSource";
import {
  acceptLanguageMiddleware,
  authMiddleware,
  publicApiKeyMiddleware,
  userHeadersMiddleware,
} from "./../data/apolloMiddlewares";
import { SessionRepositoryImpl } from "./../data/auth/SessionRepositoryImpl";
import { TokenLocalDataSource } from "./../data/auth/TokenLocalDataSource";
import { AxiosHttpClient } from "./../data/AxiosHttpClient";
import { consoleLogger } from "./../data/consoleLogger";
import { inMemoryPatientRepository } from "./../data/patient/inMemoryPatientRepository";
import { sessionLocalDataCleanerImpl } from "./../data/patient/sessionLocalDataCleanerImpl";
import {
  HttpClient,
  Logger,
  PatientRepository,
  SessionLocalDataCleaner,
  SessionRepository,
} from "./../domain/boundaries";
import { InternalError } from "./../domain/errors";
import { Configuration, NetworkConfiguration } from "./../NablaClient";

export class CoreContainer {
  logger: Logger;
  apolloClient: ApolloClient<NormalizedCacheObject>;
  patientRepository: PatientRepository;
  sessionLocalDataCleaner: SessionLocalDataCleaner;
  sessionRepository: SessionRepository;
  httpClient: HttpClient;

  constructor(
    // @ts-ignore
    private name: string,
    configuration: Configuration,
    networkConfiguration: NetworkConfiguration,
  ) {
    this.logger = configuration.logger ?? consoleLogger;

    this.patientRepository = inMemoryPatientRepository();

    const tokenLocalDataSource = new TokenLocalDataSource();
    const tokenRemoteDataSource = new TokenRemoteDataSource(() =>
      Promise.resolve(this.httpClient),
    );

    const sessionRepository = new SessionRepositoryImpl(
      tokenLocalDataSource,
      tokenRemoteDataSource,
      configuration.sessionTokenProvider,
      this.patientRepository,
      this.logger,
    );
    this.sessionRepository = sessionRepository;

    this.httpClient = new AxiosHttpClient(
      networkConfiguration.baseUrl,
      configuration.publicApiKey,
      this.sessionRepository,
      networkConfiguration.additionalHeaders,
    );

    this.apolloClient = new ApolloClient({
      link: userHeadersMiddleware(networkConfiguration.additionalHeaders)
        .concat(publicApiKeyMiddleware(configuration.publicApiKey))
        .concat(acceptLanguageMiddleware())
        .concat(authMiddleware(this.sessionRepository))
        .concat(
          split(
            ({ query }) => {
              const definition = getMainDefinition(query);
              return (
                definition.kind === "OperationDefinition" &&
                definition.operation === "subscription"
              );
            },
            new GraphQLWsLink(
              createClient({
                url: `${networkConfiguration.baseUrl.replace(
                  /^http/u,
                  "ws",
                )}v1/patient/graphql/sdk/authenticated`,
                lazy: true,
                webSocketImpl: class extends WebSocket {
                  constructor(address: string | URL) {
                    const token = sessionRepository.getCurrentAccessToken();
                    if (!token) {
                      throw new InternalError(
                        "Missing token for websocket connection",
                      );
                    }

                    super(address, [
                      GRAPHQL_TRANSPORT_WS_PROTOCOL,
                      `jwt-${token}`,
                    ]);
                  }
                },
                retryAttempts: Number.MAX_SAFE_INTEGER,
                retryWait: async (retries) =>
                  new Promise((resolve) => {
                    setTimeout(resolve, Math.min(10_000, 100 + retries * 1000));
                  }),
                shouldRetry: () => true,
              }),
            ),
            new HttpLink({
              uri: `${networkConfiguration.baseUrl}v1/patient/graphql/sdk/authenticated`,
            }),
          ),
        ),
      cache: new InMemoryCache({
        dataIdFromObject: (obj: { __typename?: string; id?: string }) =>
          obj.id && obj.__typename ? `${obj.__typename}:${obj.id}` : undefined,
        possibleTypes: {
          MessageAuthor: ["Provider", "Patient", "System", "DeletedProvider"],
          MessageContent: [
            "TextMessageContent",
            "ImageMessageContent",
            "VideoMessageContent",
            "DocumentMessageContent",
            "AudioMessageContent",
            "LivekitRoomMessageContent",
            "DeletedMessageContent",
          ],
          MaybeProvider: ["Provider", "DeletedProvider"],
          ConversationActivityContent: [
            "ProviderJoinedConversation",
            "ConversationClosed",
            "ConversationReopened",
          ],
          ConversationsEvent: [
            "ConversationCreatedEvent",
            "ConversationUpdatedEvent",
            "ConversationDeletedEvent",
          ],
          ConversationEvent: [
            "MessageCreatedEvent",
            "MessageUpdatedEvent",
            "TypingEvent",
            "ConversationActivityCreated",
          ],
        },
      }),
    });

    this.sessionLocalDataCleaner = sessionLocalDataCleanerImpl(
      this.apolloClient,
      this.patientRepository,
      tokenLocalDataSource,
    );
  }
}
