import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { createWallPost } from "../../../services/wallService";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { authorId, text, mediaUrl } = body;

  if (!authorId || !text) {
    setResponseStatus(event, 400);
    return { success: false, message: "البيانات ناقصة" };
  }

  try {
    const post = await createWallPost(authorId, text, mediaUrl);
    return { success: true, post };
  } catch (error) {
    setResponseStatus(event, 500);
    return { success: false, message: "تعذر إضافة المنشور" };
  }
});
