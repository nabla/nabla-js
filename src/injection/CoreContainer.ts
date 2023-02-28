import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client/core";

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
    this.sessionRepository = new SessionRepositoryImpl(
      tokenLocalDataSource,
      tokenRemoteDataSource,
      configuration.sessionTokenProvider,
      this.patientRepository,
      this.logger,
    );

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
          new HttpLink({
            uri: `${networkConfiguration.baseUrl}v1/patient/graphql/sdk/authenticated`,
          }),
        ),
      cache: new InMemoryCache(),
    });

    this.sessionLocalDataCleaner = sessionLocalDataCleanerImpl(
      this.apolloClient,
      this.patientRepository,
      tokenLocalDataSource,
    );
  }
}
