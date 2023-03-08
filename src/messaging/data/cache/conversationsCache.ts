import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core";

import {
  ConversationFragmentFragment,
  ConversationsDocument,
  ConversationsEventsDocument,
} from "./../../__generated__/graphql";
import {
  SubscriptionHolder,
  subscriptionHolder,
} from "./../../../data/subscriptionHolder";
import { Logger } from "./../../../domain/boundaries";
import { distinctBy } from "./../../../helpers/arrayHelpers";

const defaultConversationsPageSize = 25;
export const defaultConversationsQueryOptions = {
  query: ConversationsDocument,
  variables: {
    pageInfo: {
      numberOfItems: defaultConversationsPageSize,
    },
  },
};

export const newConversationsSubscriptionHolder = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  logger: Logger,
): SubscriptionHolder =>
  subscriptionHolder(
    apolloClient,
    { query: ConversationsEventsDocument },
    logger,
    (data) => {
      if (data.conversations?.event.__typename === "ConversationCreatedEvent") {
        insertConversationsInCache(
          apolloClient,
          [data.conversations.event.conversation],
          undefined,
          undefined,
        );
      }
    },
  );

export const insertConversationsInCache = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  conversations: ConversationFragmentFragment[],
  hasMore: boolean | undefined,
  nextCursor: string | null | undefined,
) => {
  apolloClient.cache.updateQuery(defaultConversationsQueryOptions, (data) => {
    if (!data) return;

    const oldConversations = data.conversations.conversations;
    const newConversations = distinctBy(
      oldConversations.concat(conversations),
      (e) => e.id,
    );

    return {
      ...data,
      conversations: {
        hasMore: hasMore !== undefined ? hasMore : data.conversations.hasMore,
        nextCursor:
          nextCursor !== undefined ? nextCursor : data.conversations.nextCursor,
        conversations: newConversations,
      },
    };
  });
};
