import { Logger } from "./../domain/boundaries";

export const consoleLogger: Logger = {
  debug: (message: string, error?: Error) => {
    console.debug(message, error);
  },

  error: (message: string, error?: Error) => {
    console.error(message, error);
  },

  info: (message: string, error?: Error) => {
    console.info(message, error);
  },

  warn: (message: string, error?: Error) => {
    console.warn(message, error);
  },
};
