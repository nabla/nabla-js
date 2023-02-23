import { PatientRepository } from "./../../domain/boundaries";

export class InMemoryPatientRepository implements PatientRepository {
  private currentPatientId: string | undefined;

  getPatientId(): string | undefined {
    return this.currentPatientId;
  }

  setPatientId(id: string): void {
    this.currentPatientId = id;
  }

  clearPatientId() {
    this.currentPatientId = undefined;
  }
}
