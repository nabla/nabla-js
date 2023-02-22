import { CoreContainer } from "../injection/corecontainer";

export class NablaMessagingClient {
  constructor(
    // @ts-ignore
    private coreContainer?: CoreContainer,
  ) {}
}
