import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core";

import {
  DeviceOs,
  RegisterOrUpdateDeviceDocument,
  SdkModule,
} from "../../__generated__/graphql";
import { sdkVersionCode } from "../../__generated__/version";
import { DeviceRepository, Logger, ModuleType } from "../../domain/boundaries";
import { ServerError } from "../../domain/errors";
import { DeviceIdDataSource } from "./DeviceIdDataSource";

export const deviceRepositoryImpl = (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  deviceIdDataSource: DeviceIdDataSource,
  logger: Logger,
): DeviceRepository => ({
  async sendDeviceInfoAsync(
    activeModules: ModuleType[],
    userId: string,
  ): Promise<void> {
    try {
      const gqlModules = activeModules.map((module) => {
        let sdkModule: SdkModule;
        switch (module) {
          case "Messaging":
            sdkModule = SdkModule.Messaging;
            break;
        }

        return sdkModule;
      });

      const response = await apolloClient.mutate({
        mutation: RegisterOrUpdateDeviceDocument,
        variables: {
          device: {
            codeVersion: sdkVersionCode,
            deviceModel: navigator.userAgent,
            os: DeviceOs.Web,
            osVersion: null,
            sdkModules: gqlModules,
          },
          deviceId: deviceIdDataSource.getStoredDeviceId(userId),
        },
      });

      const deviceId = response.data?.registerOrUpdateDevice.deviceId;
      if (!deviceId) {
        // noinspection ExceptionCaughtLocallyJS
        throw new ServerError(
          "Missing deviceId in RegisterOrUpdateDevice mutation response",
        );
      }

      deviceIdDataSource.setDeviceId(deviceId, userId);
    } catch (e) {
      logger.warn(
        "Unable to identify device. This is not important and will be retried next time the app restarts.",
        e,
      );
    }
  },
});
