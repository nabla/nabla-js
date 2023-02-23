import { ApolloLink } from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";

import { SessionRepository } from "./../domain/boundaries";

export const authMiddleware = (sessionRepository: SessionRepository) =>
  setContext(async (_, { headers }) => {
    const accessToken = await sessionRepository.getFreshAccessToken();
    return {
      ...headers,
      "X-Nabla-Authorization": `Bearer ${accessToken}`,
    };
  });

export const publicApiKeyMiddleware = (publicApiKey: string) =>
  new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        "X-Nabla-API-Key": publicApiKey,
      },
    }));

    return forward(operation);
  });

export const userHeadersMiddleware = (
  additionalHeaders?: Map<string, string>,
) =>
  new ApolloLink((operation, forward) => {
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

export const acceptLanguageMiddleware = () =>
  new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        "Accept-Language": navigator.language,
      },
    }));

    return forward(operation);
  });
