import AwaitLock from "await-lock";

import {
  Logger,
  PatientRepository,
  SessionRepository,
} from "./../../domain/boundaries";
import { UserIdNotSetError } from "./../../domain/errors";
import {
  AuthTokens,
  SessionTokenProvider,
} from "./../../domain/sessiontokenprovider";
import { TokenLocalDataSource } from "./TokenLocalDataSource";
import { TokenRemoteDataSource } from "./TokenRemoteDataSource";

export class SessionRepositoryImpl implements SessionRepository {
  private tokenAccessLock = new AwaitLock();

  constructor(
    private tokenLocalDataSource: TokenLocalDataSource,
    private tokenRemoteDataSource: TokenRemoteDataSource,
    private sessionTokenProvider: SessionTokenProvider,
    private patientRepository: PatientRepository,
    private logger: Logger,
  ) {}

  async getFreshAccessToken(): Promise<string> {
    await this.tokenAccessLock.acquireAsync();

    try {
      this.logger.debug("get fresh access token");

      const authTokens =
        this.tokenLocalDataSource.getAuthTokens() ??
        (await this.renewAuthTokens());

      const isAccessTokenValid = this.isTokenValid(authTokens.accessToken);

      if (isAccessTokenValid) {
        this.logger.debug("using still valid access token");
        return authTokens.accessToken;
      }

      const isRefreshTokenValid = this.isTokenValid(authTokens.refreshToken);

      if (isRefreshTokenValid) {
        this.logger.debug("using still valid refresh token to refresh tokens");

        const newAuthTokens = await this.refreshSessionAuthTokens(
          authTokens.refreshToken,
        );
        return newAuthTokens.accessToken;
      }

      this.logger.debug(
        "both access or refresh tokens are expired, fallback to refreshing session",
      );
      const newTokens = await this.renewAuthTokens();
      return newTokens.accessToken;
    } finally {
      this.tokenAccessLock.release();
    }
  }

  private renewAuthTokens = async (): Promise<AuthTokens> => {
    const patientId = this.patientRepository.getPatientId();
    if (!patientId) throw new UserIdNotSetError();

    const newAuthTokens = await this.sessionTokenProvider();
    this.tokenLocalDataSource.setAuthTokens(newAuthTokens);
    return newAuthTokens;
  };

  private refreshSessionAuthTokens = async (
    refreshToken: string,
  ): Promise<AuthTokens> => {
    try {
      const newAuthTokens = await this.tokenRemoteDataSource.refresh(
        refreshToken,
      );

      this.tokenLocalDataSource.setAuthTokens(newAuthTokens);
      this.logger.debug("tokens refreshed, using refreshed access token");

      return newAuthTokens;
    } catch (e) {
      this.logger.debug("fail refresh tokens, fallback to renew session", e);
      return this.renewAuthTokens();
    }
  };

  private isTokenValid = (token: string): boolean => {
    const tokenExpiration = this.parseTokenPayload(token)?.exp;
    return tokenExpiration === undefined
      ? false
      : tokenExpiration - Date.now() / 1000 > 1;
  };

  private parseTokenPayload = (token: string): { exp: number } | undefined => {
    try {
      return JSON.parse(atob(token.split(".")[1])!);
    } catch (e) {
      this.logger.error("Error parsing JWT token", e);
      return undefined;
    }
  };
}
