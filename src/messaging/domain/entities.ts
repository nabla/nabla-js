import { UUID } from "uuidjs";

export type MessageInput =
  | TextMessageInput
  | ImageMessageInput
  | VideoMessageInput
  | DocumentMessageInput
  | AudioMessageInput;

export type TextMessageInput = {
  text: string;
};

type MediaMessageInput = {
  file: File;
};

export type ImageMessageInput = MediaMessageInput & {
  mimetype:
    | "image/jpeg"
    | "image/png"
    | "image/heic"
    | "image/heif"
    | `image/${string}`;
  kind: "image";
};

export type VideoMessageInput = MediaMessageInput & {
  mimetype: "video/mp4" | "video/mov" | `video/${string}`;
  kind: "video";
};

export type DocumentMessageInput = MediaMessageInput & {
  mimetype: "application/pdf" | `text/${string}`;
  kind: "document";
};

export type AudioMessageInput = MediaMessageInput & {
  mimetype: "audio/mpeg" | `audio/${string}`;
  estimatedDurationMs: number;
  kind: "audio";
};

export type Conversation = {
  id: UUID;
  title?: string;
  inboxPreviewTitle: string;
  lastMessagePreview?: string;
  lastMessage?: Message;
  lastModified: Date;
  patientUnreadMessageCount: number;
  pictureUrl?: string;
  providers: ProviderInConversation[];
  isLocked: boolean;
};

export type ProviderInConversation = {
  provider: Provider;
  typingAt?: Date;
  seenUntil?: Date;

  isTyping(): boolean;
};

export type Provider = {
  id: UUID;
  avatarUrl?: string;
  prefix?: string;
  firstName: string;
  lastName: string;
};

export type ConversationItem = Message | ConversationActivity;

type BaseConversationItem = {
  createdAt: Date;
};

export type Message =
  | TextMessage
  | ImageMessage
  | VideoMessage
  | AudioMessage
  | DocumentMessage
  | DeletedMessage
  | VideoCallRoom;

export type BaseMessage = BaseConversationItem & {
  id: UUID;
  sentAt: Date;
  author: MessageAuthor;
  replyTo?: BaseMessage;
};

export type TextMessage = BaseMessage & {
  text: string;
  kind: "textMessage";
};

export type DeletedMessage = BaseMessage & {
  kind: "deletedMessage";
};

export type MediaMessage = BaseMessage & {
  url: string;
  mimetype: string;
  fileName: string;
};

export type ImageMessage = MediaMessage & {
  size?: Size;
  kind: "imageMessage";
};

export type VideoMessage = MediaMessage & {
  size?: Size;
  durationMs?: number;
  kind: "videoMessage";
};

export type DocumentMessage = MediaMessage & {
  thumbnail?: {
    size?: Size;
    url: string;
    mimetype: string;
  };
  kind: "documentMessage";
};

export type AudioMessage = MediaMessage & {
  durationMs?: number;
  kind: "audioMessage";
};

export type ConversationActivity = BaseConversationItem & {
  id: UUID;
  activityTime: Date;
  content: ProviderJoinedConversationActivityContent;
  kind: "conversationActivity";
};

export type ProviderJoinedConversationActivityContent = {
  maybeProvider: ExistingProvider | DeletedProvider;
  kind: "providerJoinConversation";
};

export type ExistingProvider = Provider & {
  kind: "existing";
};

export type DeletedProvider = {
  kind: "deleted";
};

export type VideoCallRoom = BaseMessage & {
  room: {
    id: UUID;
    status: VideoCallRoomStatusOpen | VideoCallRoomStatusClosed;
  };
  kind: "videoCallRoom";
};

export type VideoCallRoomStatusOpen = {
  token: string;
  url: string;
  kind: "open";
};

export type VideoCallRoomStatusClosed = {
  kind: "closed";
};

export type Size = {
  width: number;
  height: number;
};

export type MessageAuthor =
  | ProviderMessageAuthor
  | CurrentPatientMessageAuthor
  | OtherPatientMessageAuthor
  | SystemMessageAuthor
  | DeletedProviderMessageAuthor
  | UnknownMessageAuthor;

export type ProviderMessageAuthor = {
  provider: Provider;
  kind: "provider";
};

export type CurrentPatientMessageAuthor = {
  kind: "currentPatient";
};

export type OtherPatientMessageAuthor = {
  id: UUID;
  displayName: string;
  kind: "otherPatient";
};

export type SystemMessageAuthor = {
  name: string;
  avatarUrl?: string;
  kind: "system";
};

export type UnknownMessageAuthor = {
  kind: "unknown";
};

export type DeletedProviderMessageAuthor = {
  kind: "deletedProvider";
};

export type PaginatedList<T> = {
  items: T[];
  hasMore: boolean;
};
