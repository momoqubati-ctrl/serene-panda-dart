import { defineEventHandler } from "nitro";
import { listWallPosts } from "../../../services/wallService";

export default defineEventHandler(async () => {
  try {
    const posts = await listWallPosts();
    return { success: true, posts };
  } catch (error) {
    return { success: false, message: "تعذر جلب المنشورات" };
  }
});