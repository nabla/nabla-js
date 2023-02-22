import { Logger } from "./domain/boundaries/logger";
import { SessionTokenProvider } from "./domain/sessiontokenprovider";

export type Configuration = {
  publicApiKey: string;
  sessionTokenProvider: SessionTokenProvider;
  logger?: Logger;
};
