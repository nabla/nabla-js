import { AuthTokens } from "./../../domain/sessiontokenprovider";

export class TokenLocalDataSource {
  private authTokens: undefined | AuthTokens;

  getAuthTokens = () => this.authTokens;

  setAuthTokens = (tokens: AuthTokens) => {
    this.authTokens = tokens;
  };

  clear = () => {
    this.authTokens = undefined;
  };
}
