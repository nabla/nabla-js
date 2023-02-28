import axios, { AxiosError } from "axios";

import {
  ApiCallOptions,
  APIError,
  APIResponse,
  HttpClient,
  SessionRepository,
} from "./../domain/boundaries";

export class AxiosHttpClient implements HttpClient {
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

  call = async <Data>({
    path,
    headers,
    params,
    data,
  }: ApiCallOptions): Promise<APIResponse<Data>> => {
    const accessToken = await this.sessionRepository.getFreshAccessToken();
    try {
      const response = (await axios.request<Data>({
        url: `${this.baseUrl}${path}`,
        withCredentials: true,
        method: data ? "POST" : "GET",
        data,
        params,
        headers: {
          "X-Nabla-Authorization": `Bearer ${accessToken}`,
          "X-Nabla-API-Key": this.publicApiKey,
          "Accept-Language": navigator.language,
          ...this.additionalHeaders,
          ...headers,
        },
      })) as APIResponse<Data>;

      response.requestId = response.headers["x-request-id"];

      return response;
    } catch (e) {
      if (e instanceof AxiosError && e.response) {
        (e as APIError).requestId = e.response.headers["x-request-id"];
        (e as APIError).is401 = e.response.status === 401;
      }

      throw e;
    }
  };
}
