import { Logger } from "./domain/boundaries";
import {
  CurrentUserAlreadySetError,
  MissingInitializeError,
} from "./domain/errors";
import { SessionTokenProvider } from "./domain/sessiontokenprovider";
import { CoreContainer } from "./injection/CoreContainer";

export class NablaClient {
  // This variable is referenced by its name by sub-clients
  // Do not rename it without renaming the references
  private coreContainer: CoreContainer;

  private constructor(
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

  public setCurrentUserOrThrow = (patientId: string) => {
    const existingPatientId =
      this.coreContainer.patientRepository.getPatientId();
    if (existingPatientId !== undefined && existingPatientId !== patientId) {
      throw new CurrentUserAlreadySetError(existingPatientId, patientId);
    }
    this.coreContainer.patientRepository.setPatientId(patientId);
  };

  public clearCurrentUser = async () => {
    await this.coreContainer.sessionLocalDataCleaner.cleanLocalSessionData();
  };

  public static getInstance(): NablaClient {
    if (!NablaClient._defaultInstance) throw MissingInitializeError;

    return NablaClient._defaultInstance;
  }

  private static defaultClientName = "defaultNablaClientName";
}

export type Configuration = {
  publicApiKey: string;
  sessionTokenProvider: SessionTokenProvider;
  logger?: Logger;
};

export type NetworkConfiguration = {
  baseUrl: string;
  additionalHeaders?: Map<string, string>;
};

export type InitializationParameters = {
  configuration: Configuration;
  name?: string;
  networkConfiguration?: NetworkConfiguration;
};

const DefaultNetworkConfiguration: NetworkConfiguration = {
  baseUrl: "https://api.nabla.com/",
};
