import {
  ConversationActivityFragmentFragment,
  MaybeProviderFragmentFragment,
  MessageAuthorFragmentFragment,
  MessageFragmentFragment,
} from "./../../__generated__/graphql";
import { removeUndefined } from "./../../../helpers/arrayHelpers";
import {
  mapGqlProvider,
  mapGqlUuidToUUID,
  mapISOStringToDate,
} from "./../../data/mappers/common";
import {
  BaseMessage,
  ConversationActivity,
  ConversationItem,
  DeletedProvider,
  ExistingProvider,
  Message,
  MessageAuthor,
  Size,
} from "./../../domain/entities";

export const mapToConversationItem = (
  data: (
    | ConversationActivityFragmentFragment
    | MessageFragmentFragment
    | null
  )[],
): ConversationItem[] =>
  data
    .map((item) => {
      if (!item) return undefined;

      switch (item.__typename) {
        case "ConversationActivity": {
          return mapToConversationActivity(item);
        }
        case "Message": {
          return mapToMessage(item);
        }
      }

      return undefined;
    })
    .filter(removeUndefined);

const mapToConversationActivity = (
  fragment: ConversationActivityFragmentFragment,
): ConversationActivity | undefined => {
  if (
    fragment.conversationActivityContent.__typename !==
    "ProviderJoinedConversation"
  ) {
    return undefined;
  }

  return {
    id: mapGqlUuidToUUID(fragment.id),
    createdAt: mapISOStringToDate(fragment.createdAt),
    activityTime: mapISOStringToDate(fragment.activityTime),
    content: {
      maybeProvider: mapToMaybeProvider(
        fragment.conversationActivityContent.provider,
      ),
      kind: "providerJoinConversation",
    },
    kind: "conversationActivity",
  };
};

const mapToMaybeProvider = (
  fragment: MaybeProviderFragmentFragment,
): ExistingProvider | DeletedProvider => {
  switch (fragment.__typename) {
    case "Provider":
      return {
        ...mapGqlProvider(fragment),
        kind: "existing",
      };
    case "DeletedProvider":
    case undefined:
      return {
        kind: "deleted",
      };
  }
};

const mapToMessage = (
  fragment: MessageFragmentFragment,
): Message | undefined => {
  switch (fragment.messageContent.__typename) {
    case "TextMessageContent":
      return {
        ...mapToBaseMessage(fragment),
        text: fragment.messageContent.text,
        kind: "textMessage",
      };
    case "DeletedMessageContent":
      return {
        ...mapToBaseMessage(fragment),
        kind: "deletedMessage",
      };
    case "ImageMessageContent":
      return {
        ...mapToBaseMessage(fragment),
        url: fragment.messageContent.imageFileUpload.url.url,
        mimetype: fragment.messageContent.imageFileUpload.mimeType,
        fileName: fragment.messageContent.imageFileUpload.fileName,
        size: mapToSize(fragment.messageContent.imageFileUpload),
        kind: "imageMessage",
      };
    case "VideoMessageContent":
      return {
        ...mapToBaseMessage(fragment),
        url: fragment.messageContent.videoFileUpload.url.url,
        mimetype: fragment.messageContent.videoFileUpload.mimeType,
        fileName: fragment.messageContent.videoFileUpload.fileName,
        size: mapToSize(fragment.messageContent.videoFileUpload),
        kind: "videoMessage",
      };
    case "DocumentMessageContent":
      return {
        ...mapToBaseMessage(fragment),
        url: fragment.messageContent.documentFileUpload.url.url,
        mimetype: fragment.messageContent.documentFileUpload.mimeType,
        fileName: fragment.messageContent.documentFileUpload.fileName,
        thumbnail: fragment.messageContent.documentFileUpload.thumbnail
          ? {
              size: mapToSize(
                fragment.messageContent.documentFileUpload.thumbnail,
              ),
              url: fragment.messageContent.documentFileUpload.thumbnail.url.url,
              mimetype:
                fragment.messageContent.documentFileUpload.thumbnail.mimeType,
            }
          : undefined,
        kind: "documentMessage",
      };
    case "AudioMessageContent":
      return {
        ...mapToBaseMessage(fragment),
        url: fragment.messageContent.audioFileUpload.url.url,
        mimetype: fragment.messageContent.audioFileUpload.mimeType,
        fileName: fragment.messageContent.audioFileUpload.fileName,
        durationMs:
          fragment.messageContent.audioFileUpload.durationMs ?? undefined,
        kind: "audioMessage",
      };
    case "LivekitRoomMessageContent":
      return {
        ...mapToBaseMessage(fragment),
        room: {
          id: mapGqlUuidToUUID(fragment.messageContent.livekitRoom.uuid),
          status:
            fragment.messageContent.livekitRoom.status.__typename ===
            "LivekitRoomOpenStatus"
              ? {
                  url: fragment.messageContent.livekitRoom.status.url,
                  token: fragment.messageContent.livekitRoom.status.token,
                  kind: "open",
                }
              : {
                  kind: "closed",
                },
        },
        kind: "videoCallRoom",
      };
  }
};

const mapToBaseMessage = (fragment: MessageFragmentFragment): BaseMessage => ({
  id: mapGqlUuidToUUID(fragment.id),
  createdAt: mapISOStringToDate(fragment.createdAt),
  sentAt: mapISOStringToDate(fragment.createdAt),
  author: mapToMessageAuthor(fragment.author),
  replyTo: fragment.replyTo ? mapToMessage(fragment.replyTo) : undefined,
});

const mapToSize = (fragment: {
  width?: number | null;
  height?: number | null;
}): Size | undefined => {
  if (!fragment.width || !fragment.height) return undefined;

  return {
    width: fragment.width,
    height: fragment.height,
  };
};

const mapToMessageAuthor = (
  fragment: MessageAuthorFragmentFragment,
): MessageAuthor => {
  switch (fragment.__typename) {
    case "Provider":
      return {
        provider: {
          ...mapGqlProvider(fragment),
        },
        kind: "provider",
      };
    case "Patient":
      return fragment.isMe
        ? {
            kind: "currentPatient",
          }
        : {
            id: mapGqlUuidToUUID(fragment.id),
            displayName: fragment.displayName,
            kind: "otherPatient",
          };
    case "System":
      return {
        name: fragment.name,
        avatarUrl: fragment.avatar?.url.url,
        kind: "system",
      };
    case "DeletedProvider":
      return {
        kind: "deletedProvider",
      };
    case undefined:
      return {
        kind: "unknown",
      };
  }
};
