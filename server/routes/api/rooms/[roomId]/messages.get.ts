import { defineEventHandler, getQuery, getRouterParam, setResponseStatus } from "h3";
import { listMessages } from "../../../../services/chatStore";

export default defineEventHandler((event) => {
  const roomId = getRouterParam(event, "roomId");
  const query = getQuery(event);
  const after = typeof query.after === "string" ? query.after : undefined;

  if (!roomId) {
    setResponseStatus(event, 400);
    return {
      success: false,
      message: "معرف الغرفة مطلوب",
    };
  }

  return {
    success: true,
    messages: listMessages(roomId, after),
  };
});
