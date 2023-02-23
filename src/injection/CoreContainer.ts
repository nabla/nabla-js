import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client/core";

import {
  authMiddleware,
  publicApiKeyMiddleware,
  userHeadersMiddleware,
} from "./../data/apolloMiddlewares";
import { consoleLogger } from "./../data/consoleLogger";
import { InMemoryPatientRepository } from "./../data/patient/InMemoryPatientRepository";
import { SessionLocalDataCleanerImpl } from "./../data/patient/SessionLocalDataCleanerImpl";
import {
  Logger,
  PatientRepository,
  SessionLocalDataCleaner,
} from "./../domain/boundaries";
import { Configuration, NetworkConfiguration } from "./../nablaclient";

export class CoreContainer {
  logger: Logger;
  apolloClient: ApolloClient<NormalizedCacheObject>;
  patientRepository: PatientRepository;
  sessionLocalDataCleaner: SessionLocalDataCleaner;

  constructor(
    // @ts-ignore
    private name: string,
    configuration: Configuration,
    networkConfiguration: NetworkConfiguration,
  ) {
    this.logger = configuration.logger ?? consoleLogger;

    this.apolloClient = new ApolloClient({
      link: userHeadersMiddleware(networkConfiguration.additionalHeaders)
        .concat(publicApiKeyMiddleware(configuration.publicApiKey))
        .concat(authMiddleware(configuration.sessionTokenProvider))
        .concat(
          new HttpLink({
            uri: `${networkConfiguration.baseUrl}v3/patient/graphql/sdk/authenticated`,
          }),
        ),
      cache: new InMemoryCache(),
    });

    const inMemoryPatientRepository = new InMemoryPatientRepository();
    this.patientRepository = inMemoryPatientRepository;

    this.sessionLocalDataCleaner = new SessionLocalDataCleanerImpl(
      this.apolloClient,
      inMemoryPatientRepository,
    );
  }
}
