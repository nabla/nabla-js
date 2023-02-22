import { ApolloLink } from "@apollo/client/core";

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
