import {
  ApolloClient,
  ApolloQueryResult,
  NormalizedCacheObject,
} from "@apollo/client/core";
import { UUID } from "uuidjs";

import {
  ConversationDocument,
  ConversationEventsDocument,
  ConversationQuery,
  CreateConversationDocument,
  SendMessageInput,
} from "./../__generated__/graphql";
import { Logger } from "./../../domain/boundaries";
import { InternalError, ServerError } from "./../../domain/errors";
import { Subscription, Watcher } from "./../../domain/response";
import {
  Conversation,
  ConversationItem,
  PaginatedList,
} from "./../domain/entities";
import {
  getDefaultConversationItemQueryOptions,
  insertConversationItemsInCache,
  newConversationItemsSubscriptionHolders,
} from "./cache/conversationItemsCache";
import {
  defaultConversationsQueryOptions,
  insertConversationsInCache,
  newConversationsSubscriptionHolder,
} from "./cache/conversationsCache";
import { mapToConversationItem } from "./mappers/conversationItemMappers";
import {
  findOldestTypingProviderTimestamp,
  mapToConversation,
  typingTimeWindowMs,
} from "./mappers/conversationMappers";

export type GqlConversationDataSource = {
  createConversation: (
    initialMessage?: SendMessageInput,
    title?: string,
    providerIds?: GqlUuid[],
  ) => Promise<Conversation>;

  watchConversations: () => Watcher<PaginatedList<Conversation>>;

  loadMoreConversationsInCache: () => Promise<void>;

  watchConversation: (id: UUID) => Watcher<Conversation>;

  watchConversationItems: (
    id: UUID,
  ) => Watcher<PaginatedList<ConversationItem>>;

  loadMoreItemsInConversationCache: (id: UUID) => Promise<void>;
};

export const gqlConversationDataSourceImpl = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  logger: Logger,
): GqlConversationDataSource => {
  const conversationsSubscriptionHolder = newConversationsSubscriptionHolder(
    apolloClient,
    logger,
  );
  const conversationItemsSubscriptionHolders =
    newConversationItemsSubscriptionHolders(apolloClient, logger);

  const subscribeToConversationEvents = (id: UUID): Subscription =>
    apolloClient
      .subscribe({
        query: ConversationEventsDocument,
        variables: {
          conversationId: id.toString(),
        },
      })
      .subscribe({}); // No-op as we don't have any side effects here

  return {
    createConversation: async (
      initialMessage?: SendMessageInput,
      title?: string,
      providerIds?: GqlUuid[],
    ): Promise<Conversation> => {
      const mutation = await apolloClient.mutate({
        mutation: CreateConversationDocument,
        variables: {
          title,
          providerIds,
          initialMessage,
        },
      });

      const conversationData = mutation.data?.createConversation.conversation;
      if (!conversationData) {
        throw new ServerError("Missing data for createConversation call");
      }

      return mapToConversation(conversationData);
    },

    watchConversations: (): Watcher<PaginatedList<Conversation>> => ({
      subscribe(
        onNext: (value: PaginatedList<Conversation>) => void,
        onError: (error: any) => void,
      ): Subscription {
        const apolloWatcherSubscription = apolloClient
          .watchQuery(defaultConversationsQueryOptions)
          .subscribe((response) => {
            onNext({
              items: response.data.conversations.conversations.map(
                (conversationFragment) =>
                  mapToConversation(conversationFragment),
              ),
              hasMore: response.data.conversations.hasMore,
            });
          }, onError);

        const apolloConversationsEventsSubscription =
          conversationsSubscriptionHolder.subscribe();

        return {
          unsubscribe() {
            apolloWatcherSubscription.unsubscribe();
            apolloConversationsEventsSubscription.unsubscribe();
          },
        };
      },
    }),

    loadMoreConversationsInCache: async (): Promise<void> => {
      const nextCursor = apolloClient.cache.readQuery(
        defaultConversationsQueryOptions,
      )?.conversations.nextCursor;
      if (!nextCursor) {
        throw new InternalError(
          "Unable to find cache for default conversations query",
        );
      }

      const newDataResponse = await apolloClient.query({
        ...defaultConversationsQueryOptions,
        variables: {
          ...defaultConversationsQueryOptions.variables,
          pageInfo: {
            ...defaultConversationsQueryOptions.variables.pageInfo,
            cursor: nextCursor,
          },
        },
        fetchPolicy: "network-only",
      });

      insertConversationsInCache(
        apolloClient,
        newDataResponse.data.conversations.conversations,
        newDataResponse.data.conversations.hasMore,
        newDataResponse.data.conversations.nextCursor,
      );
    },

    watchConversation: (id: UUID): Watcher<Conversation> => {
      let typingUpdateRefresher: number | undefined;
      const handleResponse = (
        response: ApolloQueryResult<ConversationQuery>,
        onNext: (conversation: Conversation) => void,
      ) => {
        const conversation = mapToConversation(
          response.data.conversation.conversation,
        );

        if (typingUpdateRefresher) clearTimeout(typingUpdateRefresher);

        const typingProviderStartTimestamp = findOldestTypingProviderTimestamp(
          conversation.providers,
        );

        if (typingProviderStartTimestamp) {
          const startedTypingSinceMs =
            Date.now() - typingProviderStartTimestamp;

          // Not sure why TS consider the return type of setTimeout to be Node.Timeout
          // While since we're in a browser it's an int.
          // @ts-ignore
          typingUpdateRefresher = setTimeout(() => {
            handleResponse(response, onNext);
          }, typingTimeWindowMs - startedTypingSinceMs);
        }

        onNext(conversation);
      };

      return {
        subscribe(
          onNext: (value: Conversation) => void,
          onError: (error: any) => void,
        ): Subscription {
          const apolloWatcherSubscription = apolloClient
            .watchQuery({
              query: ConversationDocument,
              variables: {
                id: id.toString(),
              },
            })
            .subscribe((response) => {
              handleResponse(response, onNext);
            }, onError);

          const eventsSubscription = subscribeToConversationEvents(id);

          return {
            unsubscribe() {
              apolloWatcherSubscription.unsubscribe();
              eventsSubscription.unsubscribe();
            },
          };
        },
      };
    },

    watchConversationItems: (
      id: UUID,
    ): Watcher<PaginatedList<ConversationItem>> => ({
      subscribe(
        onNext: (value: PaginatedList<ConversationItem>) => void,
        onError: (error: any) => void,
      ): Subscription {
        const apolloWatcherSubscription = apolloClient
          .watchQuery(getDefaultConversationItemQueryOptions(id))
          .subscribe((response) => {
            onNext({
              items: mapToConversationItem(
                response.data.conversation.conversation.items.data,
              ),
              hasMore: response.data.conversation.conversation.items.hasMore,
            });
          }, onError);

        const eventsSubscription = conversationItemsSubscriptionHolders
          .get(id)
          .subscribe();

        return {
          unsubscribe() {
            apolloWatcherSubscription.unsubscribe();
            eventsSubscription.unsubscribe();
          },
        };
      },
    }),

    loadMoreItemsInConversationCache: async (id: UUID): Promise<void> => {
      const query = getDefaultConversationItemQueryOptions(id);
      const nextCursor =
        apolloClient.cache.readQuery(query)?.conversation.conversation.items
          .nextCursor;
      if (!nextCursor) {
        throw new InternalError(
          `Tried to load more while no cache or no more pages for conversation: (${id.toString()})`,
        );
      }

      const newDataResponse = await apolloClient.query({
        ...query,
        variables: {
          ...query.variables,
          pageInfo: {
            ...query.variables.pageInfo,
            cursor: nextCursor,
          },
        },
        fetchPolicy: "network-only",
      });

      insertConversationItemsInCache(
        id,
        apolloClient,
        newDataResponse.data.conversation.conversation.items.data,
        newDataResponse.data.conversation.conversation.items.hasMore,
        newDataResponse.data.conversation.conversation.items.nextCursor,
      );
    },
  };
};
