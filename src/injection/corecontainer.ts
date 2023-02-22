import { Logger } from "./../domain/boundaries/logger";
import { Configuration } from "./../configuration";
import { NetworkConfiguration } from "./../networkConfiguration";
import { consoleLogger } from "./../data/consolelogger";
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client/core";
import { userHeadersMiddleware } from "./../data/apollo/userheadersmiddleware";
import { publicApiKeyMiddleware } from "./../data/apollo/publicapikeymiddleware";
import { authMiddleware } from "./../data/apollo/authmiddleware";

export class CoreContainer {
  logger: Logger;
  apolloClient: ApolloClient<NormalizedCacheObject>;

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
  }
}
