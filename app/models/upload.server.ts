import type { UploadHandler } from "@remix-run/node";
import { unstable_createFileUploadHandler } from "@remix-run/node";

export const uploadImages = unstable_createFileUploadHandler({
  directory: `./public/uploads`,
  avoidFileConflicts: true,
  maxPartSize: 10 * 1024 * 1024,
});

var multipartParser = require("@web3-storage/multipart-parser");

export async function parseMultipartFormData(
  request: Request,
  uploadHandler: UploadHandler
) {
  let contentType = request.headers.get("Content-Type") || "";
  let [type, boundary] = contentType.split(/\s*;\s*boundary=/);
  if (!request.body || !boundary || type !== "multipart/form-data") {
    return request.formData();
  }
  let formData = new FormData();
  let parts = multipartParser.streamMultipart(request.body, boundary);

  for await (let { name, data, filename, contentType, done } of parts) {
    if (done) break;
    if (filename) {
      // only pass basename as the multipart/form-data spec recommends
      // https://datatracker.ietf.org/doc/html/rfc7578#section-4.2
      filename = filename.split(/[/\\]/).pop();
      const value = await uploadHandler({
        name,
        filename,
        contentType,
        data,
      });
      if (typeof value !== "undefined" && value !== null) {
        formData.append(name, value);
      }
    } else {
      if (data.next) {
        for await (let chunk of data) {
          formData.append(name, new TextDecoder().decode(chunk));
        }
      } else {
        formData.append(name, new TextDecoder().decode(data));
      }
    }
  }

  return formData;
}
