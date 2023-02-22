import { MissingInitializeError } from "./domain/errors";
import { CoreContainer } from "./injection/corecontainer";
import { Configuration } from "./configuration";
import { NetworkConfiguration } from "./networkConfiguration";

export class NablaClient {
  private coreContainer: CoreContainer;

  constructor(
    name: string,
    configuration: Configuration,
    networkConfiguration: NetworkConfiguration,
  ) {
    this.coreContainer = new CoreContainer(
      name,
      configuration,
      networkConfiguration,
    );
  }

  private static _defaultInstance: undefined | NablaClient;

  public static initialize({
    configuration,
    name = NablaClient.defaultClientName,
    networkConfiguration = DefaultNetworkConfiguration,
  }: InitializationParameters): NablaClient {
    const client = new NablaClient(name, configuration, networkConfiguration);

    if (name === NablaClient.defaultClientName) {
      if (this._defaultInstance) {
        this._defaultInstance.coreContainer.logger.error(
          "NablaClient.initialize() should only be called once for the default client name. " +
            "Ignoring this call and using the previously created shared instance.",
        );
      } else {
        this._defaultInstance = client;
      }
    }

    return client;
  }

  public static getInstance(): NablaClient {
    if (!NablaClient._defaultInstance) throw MissingInitializeError;

    return NablaClient._defaultInstance;
  }

  private static defaultClientName = "defaultNablaClientName";
}

export type InitializationParameters = {
  configuration: Configuration;
  name?: string;
  networkConfiguration?: NetworkConfiguration;
};

const DefaultNetworkConfiguration: NetworkConfiguration = {
  baseUrl: "https://api.nabla.com/",
};
