export class NablaError extends Error {}

export class AuthenticationError extends NablaError {}
export class CurrentUserAlreadySetError extends AuthenticationError {
  constructor(public existingPatientId: string, public newUserId: string) {
    super();
  }
}
export class UserIdNotSetError extends AuthenticationError {}

export class ServerError extends NablaError {
  constructor(public message: string) {
    super();
  }
}

export class InternalError extends NablaError {
  constructor(public message: string) {
    super();
  }
}
