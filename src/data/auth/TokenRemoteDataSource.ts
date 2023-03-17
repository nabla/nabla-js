import { HttpClient } from "./../../domain/boundaries";
import { AuthTokens } from "./../../domain/SessionTokenProvider";

export class TokenRemoteDataSource {
  // Lazy here otherwise we have circular dependencies
  constructor(private httpClientPromise: () => Promise<HttpClient>) {}

  refresh = async (refreshToken: string): Promise<AuthTokens> => {
    const httpClient = await this.httpClientPromise();

    const response = await httpClient.call({
      path: "v1/patient/jwt/refresh",
      contentType: "application/json",
      authenticated: false,
      data: JSON.stringify({ refresh_token: refreshToken }),
    });

    const responseJson = await response.json();

    return {
      accessToken: responseJson.access_token,
      refreshToken: responseJson.refresh_token,
    };
  };
}
