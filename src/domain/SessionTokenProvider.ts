export type AuthTokens = {
  refreshToken: string;
  accessToken: string;
};

export type SessionTokenProvider = () => Promise<AuthTokens> | AuthTokens;
