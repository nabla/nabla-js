export class NablaError extends Error {}

export class ConfigurationError extends NablaError {}
export class MissingInitializeError extends ConfigurationError {}

export class AuthenticationError extends NablaError {}
export class CurrentUserAlreadySetError extends AuthenticationError {
  constructor(public existingPatientId: string, public newUserId: string) {
    super();
  }
}
export class UserIdNotSetError extends AuthenticationError {}
