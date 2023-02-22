export type Logger = {
  info(message: string, error?: Error): void;
  debug(message: string, error?: Error): void;
  warn(message: string, error?: Error): void;
  error(message: string, error?: Error): void;
};
