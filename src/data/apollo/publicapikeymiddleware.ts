import { ApolloLink } from "@apollo/client/core";

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
