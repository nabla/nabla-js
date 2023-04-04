import { Logger } from "./domain/boundaries";
import { CurrentUserAlreadySetError } from "./domain/errors";
import { SessionTokenProvider } from "./domain/SessionTokenProvider";
import { CoreContainer } from "./injection/CoreContainer";

export class NablaClient {
  // This variable is referenced by its name by sub-clients
  // Do not rename it without renaming the references
  private coreContainer: CoreContainer;

  constructor({
    configuration,
    name = NablaClient.defaultClientName,
    networkConfiguration = DefaultNetworkConfiguration,
  }: InitializationParameters) {
    this.coreContainer = new CoreContainer(
      name,
      configuration,
      networkConfiguration,
    );
  }

  public setCurrentUserOrThrow = (patientId: string) => {
    const existingPatientId =
      this.coreContainer.patientRepository.getPatientId();
    if (existingPatientId !== undefined && existingPatientId !== patientId) {
      throw new CurrentUserAlreadySetError(existingPatientId, patientId);
    }
    this.coreContainer.patientRepository.setPatientId(patientId);

    if (existingPatientId !== patientId) {
      this.coreContainer.deviceRepository.sendDeviceInfoAsync(
        ["Messaging"],
        patientId,
      );
    }
  };

  public clearCurrentUser = async () => {
    await this.coreContainer.sessionLocalDataCleaner();
  };

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
