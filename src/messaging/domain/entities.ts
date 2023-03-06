import { UUID } from "uuidjs";

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

export type PaginatedList<T> = {
  items: T[];
  hasMore: boolean;
};
