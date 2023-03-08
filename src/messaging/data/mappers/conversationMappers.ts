import {
  ConversationFragmentFragment,
  ProviderInConversationFragmentFragment,
} from "./../../__generated__/graphql";
import { removeUndefined } from "./../../../helpers/arrayHelpers";
import { Conversation, ProviderInConversation } from "./../../domain/entities";
import { mapGqlProvider, mapGqlUuidToUUID, mapISOStringToDate } from "./common";

export const typingTimeWindowMs = 20_000;

export const mapToConversation = (
  fragment: ConversationFragmentFragment,
): Conversation => ({
  id: mapGqlUuidToUUID(fragment.id),
  title: fragment.title ?? undefined,
  inboxPreviewTitle: fragment.inboxPreviewTitle,
  lastMessagePreview: fragment.lastMessagePreview ?? undefined,
  lastModified: mapISOStringToDate(fragment.updatedAt),
  patientUnreadMessageCount: fragment.unreadMessageCount,
  pictureUrl: fragment.pictureUrl?.url,
  providers: mapProvidersInConversations(
    fragment.providers.filter(removeUndefined),
  ),
  isLocked: fragment.isLocked,
});

const mapProvidersInConversations = (
  providers: ProviderInConversationFragmentFragment[],
): ProviderInConversation[] =>
  providers.map((providerInConversationGql) => {
    const providerFragment = providerInConversationGql.provider;

    const typingAt = providerInConversationGql.typingAt
      ? mapISOStringToDate(providerInConversationGql.typingAt)
      : undefined;

    return {
      provider: mapGqlProvider(providerFragment),
      typingAt,
      seenUntil: providerInConversationGql.seenUntil
        ? mapISOStringToDate(providerInConversationGql.seenUntil)
        : undefined,
      isTyping(): boolean {
        if (!typingAt) return false;

        return Date.now() - typingAt.getTime() < typingTimeWindowMs;
      },
    };
  });

export const findOldestTypingProviderTimestamp = (
  providers: ProviderInConversation[],
): number | undefined => {
  // Sort typing providers by timestamps
  const providerTypingAtTimestamps = providers
    .map((providerInConversation) => {
      if (!providerInConversation.isTyping()) return Number.MAX_SAFE_INTEGER;

      return (
        providerInConversation.typingAt?.getTime() ?? Number.MAX_SAFE_INTEGER
      );
    })
    .sort((a, b) => a - b);

  if (
    providerTypingAtTimestamps.length > 0 &&
    providerTypingAtTimestamps[0] !== Number.MAX_SAFE_INTEGER
  ) {
    return providerTypingAtTimestamps[0];
  }

  return undefined;
};
