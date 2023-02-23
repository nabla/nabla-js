import { Logger } from "./../domain/boundaries";

export const consoleLogger: Logger = {
  debug: (message: string, error?: any) => {
    if (error) {
      console.debug(message, error);
    } else {
      console.debug(message);
    }
  },

  error: (message: string, error?: any) => {
    if (error) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  },

  info: (message: string, error?: any) => {
    if (error) {
      console.info(message, error);
    } else {
      console.info(message);
    }
  },

  warn: (message: string, error?: any) => {
    if (error) {
      console.warn(message, error);
    } else {
      console.warn(message);
    }
  },
};
