import { Logger, SessionRepository } from "./../../domain/boundaries";
import { CoreContainer } from "./../../injection/CoreContainer";
import { conversationRepositoryImpl } from "./../data/conversationRepositoryImpl";
import { gqlConversationDataSourceImpl } from "./../data/GqlConversationDataSource";
import {
  MessageFileUploader,
  messageFileUploaderImpl,
} from "./../data/MessageFileUploader";
import { ConversationRepository } from "./../domain/boundaries";

export class MessagingContainer {
  logger: Logger;
  sessionRepository: SessionRepository;
  conversationRepository: ConversationRepository;
  messageFileUploader: MessageFileUploader;

  constructor(coreContainer: CoreContainer) {
    this.logger = coreContainer.logger;
    this.sessionRepository = coreContainer.sessionRepository;
    this.messageFileUploader = messageFileUploaderImpl(
      coreContainer.httpClient,
    );

    const gqlConversationDataSource = gqlConversationDataSourceImpl(
      coreContainer.apolloClient,
    );
    this.conversationRepository = conversationRepositoryImpl(
      gqlConversationDataSource,
      this.messageFileUploader,
    );
  }
}
