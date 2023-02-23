import { HttpClient } from "./../../domain/boundaries";
import { AuthTokens } from "./../../domain/sessiontokenprovider";

export class TokenRemoteDataSource {
  // Lazy here otherwise we have circular dependencies
  constructor(private httpClientPromise: () => Promise<HttpClient>) {}

  refresh = async (refreshToken: string): Promise<AuthTokens> => {
    const httpClient = await this.httpClientPromise();

    const { promise } = httpClient.call<RefreshTokenResponseData>({
      path: "v1/patient/jwt/refresh",
      data: { refresh_token: refreshToken },
    });

    const newTokens = await promise;
    return {
      accessToken: newTokens.data.access_token,
      refreshToken: newTokens.data.refresh_token,
    };
  };
}

type RefreshTokenResponseData = {
  refresh_token: string;
  access_token: string;
};
