import {
  ApiCallOptions,
  APIError,
  APIResponse,
  HttpClient,
  SessionRepository,
} from "./../domain/boundaries";

export class FetchHttpClient implements HttpClient {
  private readonly additionalHeaders: { [key: string]: string } = {};

  constructor(
    private baseUrl: string,
    private publicApiKey: string,
    private sessionRepository: SessionRepository,
    additionalHeaders: Map<string, string> | undefined,
  ) {
    if (additionalHeaders) {
      for (const [key, value] of additionalHeaders) {
        this.additionalHeaders = {
          ...this.additionalHeaders,
          [key]: value,
        };
      }
    }
  }

  call = async ({
    path,
    contentType,
    authenticated,
    headers,
    data,
  }: ApiCallOptions): Promise<APIResponse> => {
    let requestHeaders: { [key: string]: string } = {
      "X-Nabla-API-Key": this.publicApiKey,
      "Accept-Language": navigator.language,
      ...this.additionalHeaders,
      ...headers,
    };

    if (contentType) {
      requestHeaders = {
        ...requestHeaders,
        "Content-Type": contentType,
      };
    }

    if (authenticated) {
      const accessToken = await this.sessionRepository.getFreshAccessToken();
      requestHeaders = {
        ...requestHeaders,
        "X-Nabla-Authorization": `Bearer ${accessToken}`,
      };
    }

    const response = (await fetch(`${this.baseUrl}${path}`, {
      method: data ? "POST" : "GET",
      body: data,
      headers: requestHeaders,
    })) as APIResponse;

    if (!response.ok) {
      throw new APIError(
        response.status,
        await response.text(),
        response.headers.get("x-request-id"),
      );
    }

    response.requestId = response.headers.get("x-request-id");
    return response;
  };
}
