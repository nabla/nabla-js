import { NablaClient } from "./../nablaclient";
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
}
