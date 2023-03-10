import { UUID } from "uuidjs";

import { PaginatedContent, Watcher } from "./../../domain/response";
import {
  AudioMessageInput,
  Conversation,
  ConversationItem,
  DocumentMessageInput,
  ImageMessageInput,
  MessageInput,
  TextMessageInput,
  VideoMessageInput,
} from "./entities";

export type ConversationRepository = {
  createConversation(
    messageInput?:
      | TextMessageInput
      | ImageMessageInput
      | VideoMessageInput
      | DocumentMessageInput
      | AudioMessageInput,
    title?: string,
    providerIds?: UUID[],
  ): Promise<Conversation>;

  watchConversations(): Watcher<PaginatedContent<Conversation[]>>;

  watchConversation(id: UUID): Watcher<Conversation>;

  watchConversationItems(
    id: UUID,
  ): Watcher<PaginatedContent<ConversationItem[]>>;

  sendMessage(
    input: MessageInput,
    conversationId: UUID,
    replyTo?: UUID,
  ): Promise<UUID>;

  deleteMessage(messageId: UUID): Promise<void>;
};
