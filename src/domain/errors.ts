export class NablaError extends Error {}

export class ConfigurationError extends NablaError {}
export class MissingInitializeError extends ConfigurationError {}
