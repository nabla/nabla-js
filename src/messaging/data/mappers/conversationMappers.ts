import { UUID } from "uuidjs";

import {
  ConversationFragmentFragment,
  ProviderFragmentFragment,
  ProviderInConversationFragmentFragment,
} from "./../../__generated__/graphql";
import { InternalError } from "./../../../domain/errors";
import {
  Conversation,
  Provider,
  ProviderInConversation,
} from "./../../domain/entities";

export const mapGqlConversationFragmentToConversation = (
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

    return {
      provider: mapGqlProvider(providerFragment),
      typingAt: providerInConversationGql.typingAt
        ? mapISOStringToDate(providerInConversationGql.typingAt)
        : undefined,
      seenUntil: providerInConversationGql.seenUntil
        ? mapISOStringToDate(providerInConversationGql.seenUntil)
        : undefined,
    };
  });

const mapGqlProvider = (
  providerFragment: ProviderFragmentFragment,
): Provider => ({
  id: mapGqlUuidToUUID(providerFragment.id),
  avatarUrl: providerFragment.avatarUrl?.url,
  prefix: providerFragment.prefix ?? undefined,
  firstName: providerFragment.firstName,
  lastName: providerFragment.lastName,
});

const mapISOStringToDate = (gqlIsoString: ISOString): Date =>
  new Date(gqlIsoString);

const mapGqlUuidToUUID = (gqlUuid: GqlUuid): UUID => {
  const uuid = UUID.parse(gqlUuid);
  if (!uuid) {
    throw new InternalError(`Unable to parse UUID from GQL: ${gqlUuid}`);
  }

  return uuid;
};

const removeUndefined = <S>(value: S | undefined): value is S =>
  value !== undefined;
