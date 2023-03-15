import FormData from "form-data";

import { HttpClient } from "./../../domain/boundaries";

export type MessageFileUploader = (file: MessageFile) => Promise<GqlUuid>;

export const messageFileUploaderImpl =
  (httpClient: HttpClient): MessageFileUploader =>
  async (file: MessageFile) => {
    const formData = new FormData();
    formData.append("purpose", "MESSAGE");
    formData.append("file", file.file, {
      filename: file.file.name,
      contentType: file.mimetype,
    });

    const response = await httpClient.call({
      path: "v1/patient/upload",
      authenticated: true,
      data: formData,
    });

    return (response.data as string[])[0];
  };

export type MessageFile = {
  file: File;
  mimetype: string;
};
