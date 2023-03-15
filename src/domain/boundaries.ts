import { AxiosError, AxiosResponse } from "axios";

export type Logger = {
  info(message: string, error?: any): void;
  debug(message: string, error?: any): void;
  warn(message: string, error?: any): void;
  error(message: string, error?: any): void;
};

export type PatientRepository = {
  setPatientId(id: string): void;
  getPatientId(): undefined | string;
  clearPatientId(): void;
};

export type SessionLocalDataCleaner = () => Promise<void>;

export type SessionRepository = {
  authenticatableOrThrow(): void;
  getFreshAccessToken(): Promise<string>;
  getCurrentAccessToken(): undefined | string;
};

export type HttpClient = {
  call<Data>({
    path,
    authenticated,
    headers,
    params,
    data,
  }: ApiCallOptions): Promise<APIResponse<Data>>;
};

export type ApiCallOptions = {
  path: string;
  authenticated: boolean;
  headers?: { [key: string]: string };
  params?: Record<string, string>;
  data?: any;
};

export type APIResponse<Data> = AxiosResponse<Data> & {
  requestId: string | null;
};

export type APIError = AxiosError & {
  requestId?: string | null;
  is401?: boolean;
  isCanceled?: boolean;
};
