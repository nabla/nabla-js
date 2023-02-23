import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core";

import { SessionLocalDataCleaner } from "./../../domain/boundaries";
import { InMemoryPatientRepository } from "./InMemoryPatientRepository";

export class SessionLocalDataCleanerImpl implements SessionLocalDataCleaner {
  constructor(
    private apolloClient: ApolloClient<NormalizedCacheObject>,
    private patientRepository: InMemoryPatientRepository,
  ) {}

  async cleanLocalSessionData() {
    await this.apolloClient.clearStore();
    this.patientRepository.clearPatientId();
  }
}
