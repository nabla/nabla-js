import { UUID } from "uuidjs";

import { ConversationRepository } from "./../domain/boundaries";
import {
  AudioMessageInput,
  Conversation,
  DocumentMessageInput,
  ImageMessageInput,
  TextMessageInput,
  VideoMessageInput,
} from "./../domain/entities";
import { GqlConversationDataSource } from "./GqlConversationDataSource";
import { mapMessageInputToSendMessageInput } from "./mappers/messageMappers";
import { MessageFileUploader } from "./MessageFileUploader";

export const conversationRepositoryImpl = (
  gqlConversationDataSource: GqlConversationDataSource,
  messageFileUploader: MessageFileUploader,
): ConversationRepository => ({
  createConversation: async (
    messageInput?:
      | TextMessageInput
      | ImageMessageInput
      | VideoMessageInput
      | DocumentMessageInput
      | AudioMessageInput,
    title?: string,
    providerIds?: UUID[],
  ): Promise<Conversation> => {
    const gqlMessageInput = messageInput
      ? await mapMessageInputToSendMessageInput(
          messageFileUploader,
          messageInput,
        )
      : undefined;

    const providerIdsInput =
      providerIds?.map((uuid) => uuid.toString()) ?? undefined;

    return gqlConversationDataSource.createConversation(
      gqlMessageInput,
      title,
      providerIdsInput,
    );
  },
});
