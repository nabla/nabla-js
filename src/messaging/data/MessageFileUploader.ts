import FormData from "form-data";

import { HttpClient } from "./../../domain/boundaries";

export type MessageFileUploader = (file: MessageFile) => Promise<GqlUuid>;

export const messageFileUploaderImpl =
  (httpClient: HttpClient): MessageFileUploader =>
  async (file: MessageFile) => {
    const formData = new FormData();
    formData.append("purpose", "MESSAGE");
    formData.append("file", file.file, file.file.name);

    const response = await httpClient.call({
      path: "v1/patient/upload",
      authenticated: true,
      data: formData,
    });

    return ((await response.json()) as string[])[0];
  };

export type MessageFile = {
  file: File;
  mimetype: string;
};
