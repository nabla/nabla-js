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

export const mapToSendMessageInput = async (
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
  content: await mapToSendMessageContentInput(input, fileUploader),
  replyToMessageId,
});

const mapToSendMessageContentInput = async (
  input:
    | TextMessageInput
    | ImageMessageInput
    | VideoMessageInput
    | DocumentMessageInput
    | AudioMessageInput,
  fileUploader: MessageFileUploader,
): Promise<SendMessageContentInput> => {
  if ("text" in input) return mapToTextSendMessageContentInput(input);

  switch (input.kind) {
    case "image":
      return mapToImageSendMessageContentInput(input, fileUploader);
    case "video":
      return mapToVideoSendMessageContentInput(input, fileUploader);
    case "document":
      return mapToDocumentSendMessageContentInput(input, fileUploader);
    case "audio":
      return mapToAudioSendMessageContentInput(input, fileUploader);
  }
};

const mapToTextSendMessageContentInput = (
  input: TextMessageInput,
): SendMessageContentInput => ({
  textInput: {
    text: input.text,
  },
});

const mapToImageSendMessageContentInput = async (
  input: ImageMessageInput,
  fileUploader: MessageFileUploader,
): Promise<SendMessageContentInput> => ({
  imageInput: {
    upload: {
      uuid: await fileUploader(input),
    },
  },
});

const mapToVideoSendMessageContentInput = async (
  input: VideoMessageInput,
  fileUploader: MessageFileUploader,
): Promise<SendMessageContentInput> => ({
  videoInput: {
    upload: {
      uuid: await fileUploader(input),
    },
  },
});

const mapToDocumentSendMessageContentInput = async (
  input: DocumentMessageInput,
  fileUploader: MessageFileUploader,
): Promise<SendMessageContentInput> => ({
  documentInput: {
    upload: {
      uuid: await fileUploader(input),
    },
  },
});

const mapToAudioSendMessageContentInput = async (
  input: AudioMessageInput,
  fileUploader: MessageFileUploader,
): Promise<SendMessageContentInput> => ({
  audioInput: {
    upload: {
      uuid: await fileUploader(input),
    },
  },
});
