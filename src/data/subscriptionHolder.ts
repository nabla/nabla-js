import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core";
import { OperationVariables } from "@apollo/client/core/types";
import { SubscriptionOptions } from "@apollo/client/core/watchQueryOptions";

import { Logger } from "./../domain/boundaries";
import { Subscription } from "./../domain/response";

export type SubscriptionHolder = {
  subscribe: () => Subscription;
};

export const subscriptionHolder = <
  T = any,
  TVariables extends OperationVariables = OperationVariables,
>(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  subscriptionOptions: SubscriptionOptions<TVariables, T>,
  logger: Logger,
  sideEffects?: (data: T) => void,
): SubscriptionHolder => {
  let currentSubscription: Subscription | undefined;
  let subscribersCount = 0;

  return {
    subscribe: (): Subscription => {
      subscribersCount++;

      if (currentSubscription) return currentSubscription;

      currentSubscription = apolloClient
        .subscribe({
          ...subscriptionOptions,
          errorPolicy: "ignore",
        })
        .subscribe(
          (data) => {
            data.errors?.forEach((error) => {
              logger.error("Error received in subscription", error);
            });

            if (sideEffects && data.data) sideEffects(data.data);
          },
          (error) => {
            // TODO resub auto?
            logger.error("Terminating error received in subscription", error);
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
