import { UUID } from "uuidjs";

import { ProviderFragmentFragment } from "./../../__generated__/graphql";
import { InternalError } from "./../../../domain/errors";
import { Provider } from "./../../domain/entities";

export const mapGqlProvider = (
  providerFragment: ProviderFragmentFragment,
): Provider => ({
  id: mapGqlUuidToUUID(providerFragment.id),
  avatarUrl: providerFragment.avatarUrl?.url,
  prefix: providerFragment.prefix ?? undefined,
  firstName: providerFragment.firstName,
  lastName: providerFragment.lastName,
});

export const mapISOStringToDate = (gqlIsoString: ISOString): Date =>
  new Date(gqlIsoString);

export const mapGqlUuidToUUID = (gqlUuid: GqlUuid): UUID => {
  const uuid = UUID.parse(gqlUuid);
  if (!uuid) {
    throw new InternalError(`Unable to parse UUID from GQL: ${gqlUuid}`);
  }

  return uuid;
};
