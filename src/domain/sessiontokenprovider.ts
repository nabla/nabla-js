import { AuthTokens } from "./../domain/authtokens";

export type SessionTokenProvider = () => Promise<AuthTokens> | AuthTokens;
