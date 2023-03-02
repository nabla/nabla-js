import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core";
import { TypedDocumentNode } from "@graphql-typed-document-node/core";

import { Logger } from "./../domain/boundaries";
import { Subscription } from "./../domain/response";

export const subscriptionHolder = <T>(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  subscriptionQuery: TypedDocumentNode<T, any>,
  logger: Logger,
  sideEffects?: (data: T) => void,
) => {
  let currentSubscription: Subscription | undefined;
  let subscribersCount = 0;

  return {
    subscribe: (): Subscription => {
      subscribersCount++;

      if (currentSubscription) return currentSubscription;

      currentSubscription = apolloClient
        .subscribe({
          query: subscriptionQuery,
          errorPolicy: "ignore",
        })
        .subscribe(
          (data) => {
            data.errors?.forEach((error) => {
              logger.error(
                "Error received in ConversationsEventsSubscription",
                error,
              );
            });

            if (sideEffects && data.data) sideEffects(data.data);
          },
          (error) => {
            // TODO resub auto?
            logger.error(
              "Terminating error received in ConversationsEventsSubscription",
              error,
            );
          },
        );

      return {
        unsubscribe() {
          subscribersCount--;

          if (subscribersCount <= 0) {
            currentSubscription?.unsubscribe();
            currentSubscription = undefined;
          }
        },
      };
    },
  };
};
