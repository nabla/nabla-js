import axios, { AxiosError, AxiosProgressEvent } from "axios";

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

  call = <Data>({
    path,
    headers,
    params,
    data,
    onUploadProgress,
  }: ApiCallOptions): {
    promise: Promise<APIResponse<Data>>;
    cancel: () => void;
  } => {
    const source = axios.CancelToken.source();

    const promise = this.sessionRepository
      .getFreshAccessToken()
      .then((accessToken) =>
        axios
          .request<Data>({
            url: `${this.baseUrl}${path}`,
            withCredentials: true,
            method: data ? "POST" : "GET",
            data,
            params,
            cancelToken: source.token,
            headers: {
              "X-Nabla-Authorization": `Bearer ${accessToken}`,
              "X-Nabla-API-Key": this.publicApiKey,
              "Accept-Language": navigator.language,
              ...this.additionalHeaders,
              ...headers,
            },
            onUploadProgress: onUploadProgress
              ? (e: AxiosProgressEvent) =>
                  e.total &&
                  onUploadProgress(Math.round((e.loaded * 100) / e.total))
              : undefined,
          })
          .then((response) => {
            (response as APIResponse<Data>).requestId =
              response.headers["x-request-id"];
            return response as APIResponse<Data>;
          })
          .catch((e: AxiosError) => {
            if (e.response) {
              (e as APIError).requestId = e.response.headers["x-request-id"];
              (e as APIError).is401 = e.response.status === 401;
            }
            if (axios.isCancel(e)) (e as APIError).isCanceled = true;
            throw e;
          }),
      );

    return { promise, cancel: source.cancel };
  };
}
