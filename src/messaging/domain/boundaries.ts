import { UUID } from "uuidjs";

import { PaginatedContent, Watcher } from "./../../domain/response";
import {
  AudioMessageInput,
  Conversation,
  DocumentMessageInput,
  ImageMessageInput,
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
};
