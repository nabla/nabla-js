import { UUID } from "uuidjs";

import { PaginatedContent, Watcher } from "./../domain/response";
import { NablaClient } from "./../NablaClient";
import {
  Conversation,
  ConversationItem,
  MessageInput,
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
    messageInput: MessageInput,
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

  watchConversation = (id: UUID): Watcher<Conversation> => {
    this.messagingContainer.sessionRepository.authenticatableOrThrow();
    return this.messagingContainer.conversationRepository.watchConversation(id);
  };

  watchConversationItems = (
    id: UUID,
  ): Watcher<PaginatedContent<ConversationItem[]>> => {
    this.messagingContainer.sessionRepository.authenticatableOrThrow();
    return this.messagingContainer.conversationRepository.watchConversationItems(
      id,
    );
  };

  sendMessage = (
    input: MessageInput,
    conversationId: UUID,
    replyTo?: UUID,
  ): Promise<UUID> => {
    this.messagingContainer.sessionRepository.authenticatableOrThrow();
    return this.messagingContainer.conversationRepository.sendMessage(
      input,
      conversationId,
      replyTo,
    );
  };

  deleteMessage = (messageId: UUID): Promise<void> => {
    this.messagingContainer.sessionRepository.authenticatableOrThrow();
    return this.messagingContainer.conversationRepository.deleteMessage(
      messageId,
    );
  };

  markConversationAsRead = (conversationId: UUID): Promise<void> => {
    this.messagingContainer.sessionRepository.authenticatableOrThrow();
    return this.messagingContainer.conversationRepository.markConversationAsRead(
      conversationId,
    );
  };

  setTyping = (conversationId: UUID, isTyping: boolean): Promise<void> => {
    this.messagingContainer.sessionRepository.authenticatableOrThrow();
    return this.messagingContainer.conversationRepository.setTyping(
      conversationId,
      isTyping,
    );
  };
}
