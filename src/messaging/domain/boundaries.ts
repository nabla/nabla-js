import { UUID } from "uuidjs";

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
};
