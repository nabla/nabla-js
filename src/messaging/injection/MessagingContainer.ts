import { Logger } from "./../../domain/boundaries";
import { CoreContainer } from "./../../injection/CoreContainer";

export class MessagingContainer {
  // @ts-ignore
  private logger: Logger;

  constructor(coreContainer: CoreContainer) {
    this.logger = coreContainer.logger;
  }
}
