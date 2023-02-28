import { UUID } from "uuidjs";

import {
  SendMessageContentInput,
  SendMessageInput,
} from "./../../__generated__/graphql";
import {
  AudioMessageInput,
  DocumentMessageInput,
  ImageMessageInput,
  TextMessageInput,
  VideoMessageInput,
} from "./../../domain/entities";
import { MessageFileUploader } from "./../MessageFileUploader";

export const mapMessageInputToSendMessageInput = async (
  fileUploader: MessageFileUploader,
  input:
    | TextMessageInput
    | ImageMessageInput
    | VideoMessageInput
    | DocumentMessageInput
    | AudioMessageInput,
  replyToMessageId?: GqlUuid,
): Promise<SendMessageInput> => ({
  clientId: UUID.genV4().toString(),
  content: await mapMessageInputToSendMessageContentInput(input, fileUploader),
  replyToMessageId,
});

const mapMessageInputToSendMessageContentInput = async (
  input:
    | TextMessageInput
    | ImageMessageInput
    | VideoMessageInput
    | DocumentMessageInput
    | AudioMessageInput,
  fileUploader: MessageFileUploader,
): Promise<SendMessageContentInput> => {
  if ("text" in input) return mapTextInputToSendMessageInput(input);

  switch (input.kind) {
    case "image":
      return mapImageInputToSendMessageInput(input, fileUploader);
    case "video":
      return mapVideoInputToSendMessageInput(input, fileUploader);
    case "document":
      return mapDocumentInputToSendMessageInput(input, fileUploader);
    case "audio":
      return mapAudioInputToSendMessageInput(input, fileUploader);
  }
};

const mapTextInputToSendMessageInput = (
  input: TextMessageInput,
): SendMessageContentInput => ({
  textInput: {
    text: input.text,
  },
});

const mapImageInputToSendMessageInput = async (
  input: ImageMessageInput,
  fileUploader: MessageFileUploader,
): Promise<SendMessageContentInput> => ({
  imageInput: {
    upload: {
      uuid: await fileUploader(input),
    },
  },
});

const mapVideoInputToSendMessageInput = async (
  input: VideoMessageInput,
  fileUploader: MessageFileUploader,
): Promise<SendMessageContentInput> => ({
  videoInput: {
    upload: {
      uuid: await fileUploader(input),
    },
  },
});

const mapDocumentInputToSendMessageInput = async (
  input: DocumentMessageInput,
  fileUploader: MessageFileUploader,
): Promise<SendMessageContentInput> => ({
  documentInput: {
    upload: {
      uuid: await fileUploader(input),
    },
  },
});

const mapAudioInputToSendMessageInput = async (
  input: AudioMessageInput,
  fileUploader: MessageFileUploader,
): Promise<SendMessageContentInput> => ({
  audioInput: {
    upload: {
      uuid: await fileUploader(input),
    },
  },
});
