export type AuthTokens = {
  refreshToken: string;
  accessToken: string;
};

export type SessionTokenProvider = (
  userId: string,
) => Promise<AuthTokens> | AuthTokens;
