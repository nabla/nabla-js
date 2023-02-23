import { PatientRepository } from "./../../domain/boundaries";

export const inMemoryPatientRepository = (): PatientRepository => {
  let currentPatientId: string | undefined;

  return {
    getPatientId: () => currentPatientId,
    setPatientId: (id: string) => {
      currentPatientId = id;
    },
    clearPatientId: () => {
      currentPatientId = undefined;
    },
  };
};
