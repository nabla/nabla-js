import { UUID } from "uuidjs";

import { PaginatedContent, Watcher } from "./../domain/response";
import { NablaClient } from "./../NablaClient";
import {
  AudioMessageInput,
  Conversation,
  DocumentMessageInput,
  ImageMessageInput,
  TextMessageInput,
  VideoMessageInput,
} from "./domain/entities";
import { MessagingContainer } from "./injection/MessagingContainer";

export class NablaMessagingClient {
  // @ts-ignore
  private messagingContainer: MessagingContainer;

  constructor(nablaClient: NablaClient) {
    this.messagingContainer = new MessagingContainer(
      // This is because coreContainer isn't public to avoid exposing internal
      // injection stuff, so it's a little "trick" from SO:
      // https://stackoverflow.com/a/60340717/2508174

      // eslint-disable-next-line
      nablaClient["coreContainer"],
    );
  }

  createConversationWithMessage = async (
    messageInput:
      | TextMessageInput
      | ImageMessageInput
      | VideoMessageInput
      | DocumentMessageInput
      | AudioMessageInput,
    title?: string,
    providerIds?: UUID[],
  ): Promise<Conversation> => {
    this.messagingContainer.sessionRepository.authenticatableOrThrow();
    return this.messagingContainer.conversationRepository.createConversation(
      messageInput,
      title,
      providerIds,
    );
  };

  watchConversations = (): Watcher<PaginatedContent<Conversation[]>> => {
    this.messagingContainer.sessionRepository.authenticatableOrThrow();
    return this.messagingContainer.conversationRepository.watchConversations();
  };
}
