import { defineEventHandler, getRouterParam, sendStream, setHeader, setResponseStatus } from "h3";
import fs from "node:fs";
import { getUploadMimeType, resolveUploadFile } from "../../services/uploadStorage";

export default defineEventHandler((event) => {
  const filename = getRouterParam(event, "filename") || "";
  const filePath = resolveUploadFile(filename);

  if (!filePath) {
    setResponseStatus(event, 404);
    return "Not found";
  }

  setHeader(event, "Content-Type", getUploadMimeType(filename));
  setHeader(event, "Cache-Control", "public, max-age=31536000, immutable");
  return sendStream(event, fs.createReadStream(filePath));
});
