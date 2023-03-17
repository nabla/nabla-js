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
  call({
    path,
    authenticated,
    headers,
    data,
  }: ApiCallOptions): Promise<APIResponse>;
};

export type ApiCallOptions = {
  path: string;
  contentType?: string;
  authenticated: boolean;
  headers?: { [key: string]: string };
  data?: any;
};

export type APIResponse = Response & {
  requestId: string | null;
};

export class APIError extends Error {
  constructor(
    public code: number,
    message: string,
    public requestId?: string | null,
  ) {
    super(message);
  }
}
