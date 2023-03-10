import { UUID } from "uuidjs";

import {
  PaginatedContent,
  Subscription,
  Watcher,
} from "./../../domain/response";
import { ConversationRepository } from "./../domain/boundaries";
import {
  Conversation,
  ConversationItem,
  MessageInput,
} from "./../domain/entities";
import { GqlConversationDataSource } from "./GqlConversationDataSource";
import {
  mapToSendMessageContentInput,
  mapToSendMessageInput,
} from "./mappers/messageInputMappers";
import { MessageFileUploader } from "./MessageFileUploader";

export const conversationRepositoryImpl = (
  gqlConversationDataSource: GqlConversationDataSource,
  messageFileUploader: MessageFileUploader,
): ConversationRepository => ({
  createConversation: async (
    messageInput?: MessageInput,
    title?: string,
    providerIds?: UUID[],
  ): Promise<Conversation> => {
    const gqlMessageInput = messageInput
      ? await mapToSendMessageInput(messageFileUploader, messageInput)
      : undefined;

    const providerIdsInput =
      providerIds?.map((uuid) => uuid.toString()) ?? undefined;

    return gqlConversationDataSource.createConversation(
      gqlMessageInput,
      title,
      providerIdsInput,
    );
  },

  watchConversations: (): Watcher<PaginatedContent<Conversation[]>> => ({
    subscribe(
      onNext: (value: PaginatedContent<Conversation[]>) => void,
      onError: (error: any) => void,
    ): Subscription {
      return gqlConversationDataSource
        .watchConversations()
        .subscribe((response) => {
          onNext({
            content: response.items.sort(
              (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
            ),
            loadMore: response.hasMore
              ? gqlConversationDataSource.loadMoreConversationsInCache
              : undefined,
          });
        }, onError);
    },
  }),

  watchConversation: (id: UUID): Watcher<Conversation> =>
    gqlConversationDataSource.watchConversation(id),

  watchConversationItems: (
    id: UUID,
  ): Watcher<PaginatedContent<ConversationItem[]>> => ({
    subscribe(
      onNext: (value: PaginatedContent<ConversationItem[]>) => void,
      onError: (error: any) => void,
    ): Subscription {
      return gqlConversationDataSource
        .watchConversationItems(id)
        .subscribe((response) => {
          onNext({
            content: response.items.sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
            ),
            loadMore: response.hasMore
              ? () =>
                  gqlConversationDataSource.loadMoreItemsInConversationCache(id)
              : undefined,
          });
        }, onError);
    },
  }),

  sendMessage: async (
    input: MessageInput,
    conversationId: UUID,
    replyTo?: UUID,
  ): Promise<UUID> => {
    const gqlMessageInput = await mapToSendMessageContentInput(
      input,
      messageFileUploader,
    );
    return gqlConversationDataSource.sendMessage(
      gqlMessageInput,
      conversationId,
      replyTo,
    );
  },

  deleteMessage: (messageId: UUID): Promise<void> =>
    gqlConversationDataSource.deleteMessage(messageId),
});
