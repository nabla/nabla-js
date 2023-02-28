import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core";

import {
  CreateConversationDocument,
  SendMessageInput,
} from "./../__generated__/graphql";
import { ServerError } from "./../../domain/errors";
import { Conversation } from "./../domain/entities";
import { mapGqlConversationFragmentToConversation } from "./mappers/conversationMappers";

export type GqlConversationDataSource = {
  createConversation: (
    initialMessage?: SendMessageInput,
    title?: string,
    providerIds?: GqlUuid[],
  ) => Promise<Conversation>;
};

export const gqlConversationDataSourceImpl = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
): GqlConversationDataSource => ({
  createConversation: async (
    initialMessage?: SendMessageInput,
    title?: string,
    providerIds?: GqlUuid[],
  ): Promise<Conversation> => {
    const mutation = await apolloClient.mutate({
      mutation: CreateConversationDocument,
      variables: {
        title,
        providerIds,
        initialMessage,
      },
    });

    const conversationData = mutation.data?.createConversation.conversation;
    if (!conversationData) {
      throw new ServerError("Missing data for createConversation call");
    }

    return mapGqlConversationFragmentToConversation(conversationData);
  },
});
