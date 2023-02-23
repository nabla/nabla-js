import { ApolloLink } from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";

import { SessionTokenProvider } from "./../domain/sessiontokenprovider";

export const authMiddleware = (sessionTokenProvider: SessionTokenProvider) =>
  setContext(async (_, { headers }) => {
    const tokens = await sessionTokenProvider();
    return {
      ...headers,
      "X-Nabla-Authorization": `Bearer ${tokens.accessToken}`,
    };
  });

export const publicApiKeyMiddleware = (publicApiKey: string) => {
  return new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        "X-Nabla-API-Key": publicApiKey,
      },
    }));

    return forward(operation);
  });
};

export const userHeadersMiddleware = (
  additionalHeaders?: Map<string, string>,
) => {
  return new ApolloLink((operation, forward) => {
    if (additionalHeaders) {
      operation.setContext(({ headers = {} }) => ({
        headers: {
          ...headers,
          ...additionalHeaders,
        },
      }));
    }

    return forward(operation);
  });
};
