import { setContext } from "@apollo/client/link/context";
import { SessionTokenProvider } from "./../../domain/sessiontokenprovider";

export const authMiddleware = (sessionTokenProvider: SessionTokenProvider) =>
  setContext(async (_, { headers }) => {
    const tokens = await sessionTokenProvider();
    return {
      ...headers,
      "X-Nabla-Authorization": `Bearer ${tokens.accessToken}`,
    };
  });
