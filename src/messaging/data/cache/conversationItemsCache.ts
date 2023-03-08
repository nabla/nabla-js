import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core";
import { UUID } from "uuidjs";

import {
  ConversationActivityFragmentFragment,
  ConversationEventsDocument,
  ConversationItemsDocument,
  MessageFragmentFragment,
} from "./../../__generated__/graphql";
import {
  subscriptionHolder,
  SubscriptionHolder,
} from "./../../../data/subscriptionHolder";
import { Logger } from "./../../../domain/boundaries";
import { distinctBy, removeNull } from "./../../../helpers/arrayHelpers";

const defaultConversationItemsPageSize = 20;
export const getDefaultConversationItemQueryOptions = (id: UUID) => ({
  query: ConversationItemsDocument,
  variables: {
    id: id.toString(),
    pageInfo: {
      numberOfItems: defaultConversationItemsPageSize,
    },
  },
});

export const newConversationItemsSubscriptionHolders = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  logger: Logger,
) => {
  const conversationItemsSubscriptionHolders: Map<UUID, SubscriptionHolder> =
    new Map();

  return {
    get: (id: UUID): SubscriptionHolder => {
      const existing = conversationItemsSubscriptionHolders.get(id);
      if (existing) return existing;

      const subscription = subscriptionHolder(
        apolloClient,
        {
          query: ConversationEventsDocument,
          variables: { conversationId: id.toString() },
        },
        logger,
        (data) => {
          if (
            data.conversation?.event.__typename ===
            "ConversationActivityCreated"
          ) {
            insertConversationItemsInCache(
              id,
              apolloClient,
              [data.conversation.event.activity],
              undefined,
              undefined,
            );
          } else if (
            data.conversation?.event.__typename === "MessageCreatedEvent"
          ) {
            insertConversationItemsInCache(
              id,
              apolloClient,
              [data.conversation.event.message],
              undefined,
              undefined,
            );
          }
        },
      );
      conversationItemsSubscriptionHolders.set(id, subscription);

      return subscription;
    },
  };
};

export const insertConversationItemsInCache = (
  id: UUID,
  apolloClient: ApolloClient<NormalizedCacheObject>,
  items: (
    | MessageFragmentFragment
    | ConversationActivityFragmentFragment
    | null
  )[],
  hasMore: boolean | undefined,
  nextCursor: string | null | undefined,
) => {
  apolloClient.cache.updateQuery(
    getDefaultConversationItemQueryOptions(id),
    (cacheData) => {
      if (!cacheData) return;

      const oldItems = cacheData.conversation.conversation.items.data;
      const newConversationItems = distinctBy(
        oldItems.filter(removeNull).concat(items.filter(removeNull)),
        (e) => e.id,
      );

      return {
        ...cacheData,
        conversation: {
          ...cacheData.conversation,
          conversation: {
            ...cacheData.conversation.conversation,
            items: {
              hasMore:
                hasMore !== undefined
                  ? hasMore
                  : cacheData.conversation.conversation.items.hasMore,
              nextCursor:
                nextCursor !== undefined
                  ? nextCursor
                  : cacheData.conversation.conversation.items.nextCursor,
              data: newConversationItems,
            },
          },
        },
      };
    },
  );
};
