import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core";

import {
  PatientRepository,
  SessionLocalDataCleaner,
} from "./../../domain/boundaries";
import { TokenLocalDataSource } from "./../auth/TokenLocalDataSource";

export const sessionLocalDataCleanerImpl =
  (
    apolloClient: ApolloClient<NormalizedCacheObject>,
    patientRepository: PatientRepository,
    tokenLocalDataSource: TokenLocalDataSource,
  ): SessionLocalDataCleaner =>
  async () => {
    await apolloClient.clearStore();
    tokenLocalDataSource.clear();
    patientRepository.clearPatientId();
  };
