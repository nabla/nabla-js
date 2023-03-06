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
  ConversationsDocument,
  ConversationsEventsDocument,
  CreateConversationDocument,
  SendMessageInput,
} from "./../__generated__/graphql";
import { subscriptionHolder } from "./../../data/subscriptionHolder";
import { Logger } from "./../../domain/boundaries";
import { InternalError, ServerError } from "./../../domain/errors";
import { Subscription, Watcher } from "./../../domain/response";
import { Conversation, PaginatedList } from "./../domain/entities";
import {
  findOldestTypingProviderTimestamp,
  mapGqlConversationFragmentToConversation,
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
};

export const gqlConversationDataSourceImpl = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  logger: Logger,
): GqlConversationDataSource => {
  const defaultConversationsPageSize = 25;
  const defaultConversationsQueryOptions = {
    query: ConversationsDocument,
    variables: {
      pageInfo: {
        numberOfItems: defaultConversationsPageSize,
      },
    },
  };
  const conversationsSubscriptionHolder = subscriptionHolder(
    apolloClient,
    ConversationsEventsDocument,
    logger,
    (data) => {
      if (data.conversations?.event.__typename === "ConversationCreatedEvent") {
        const conversationFragment = data.conversations.event.conversation;

        apolloClient.cache.updateQuery(
          defaultConversationsQueryOptions,
          (cacheData) => {
            if (!cacheData) return;

            return {
              ...cacheData,
              conversations: {
                ...cacheData.conversations,
                conversations:
                  cacheData.conversations.conversations.concat(
                    conversationFragment,
                  ),
              },
            };
          },
        );
      }
    },
  );

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

      return mapGqlConversationFragmentToConversation(conversationData);
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
                  mapGqlConversationFragmentToConversation(
                    conversationFragment,
                  ),
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
        query: ConversationsDocument,
        variables: {
          pageInfo: {
            numberOfItems: defaultConversationsPageSize,
            cursor: nextCursor,
          },
        },
        fetchPolicy: "network-only",
      });

      apolloClient.cache.updateQuery(
        defaultConversationsQueryOptions,
        (data) => {
          if (!data) return;

          const oldConversations = data.conversations.conversations;
          const oldConversationsIds = oldConversations.map(
            (conversation) => conversation.id,
          );
          const newConversations =
            newDataResponse.data.conversations.conversations.filter(
              (conversation) => !oldConversationsIds.includes(conversation.id),
            );

          return {
            ...data,
            conversations: {
              ...data.conversations,
              hasMore: newDataResponse.data.conversations.hasMore,
              nextCursor: newDataResponse.data.conversations.nextCursor,
              conversations: oldConversations.concat(newConversations),
            },
          };
        },
      );
    },

    watchConversation: (id: UUID): Watcher<Conversation> => {
      let typingUpdateRefresher: number | undefined;
      const handleResponse = (
        response: ApolloQueryResult<ConversationQuery>,
        onNext: (conversation: Conversation) => void,
      ) => {
        const conversation = mapGqlConversationFragmentToConversation(
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
  };
};
