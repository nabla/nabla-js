export type DeviceIdDataSource = {
  getStoredDeviceId(userId: string): string | undefined;
  setDeviceId(deviceId: string, userId: string): void;
};

export const deviceIdDataSourceImpl = (): DeviceIdDataSource => {
  const keyForUserId = (userId: string): string => `nabla_device_id_${userId}`;

  return {
    getStoredDeviceId: (userId: string) =>
      localStorage.getItem(keyForUserId(userId)) ?? undefined,

    setDeviceId: (deviceId: string, userId: string) => {
      localStorage.setItem(keyForUserId(userId), deviceId);
    },
  };
};
