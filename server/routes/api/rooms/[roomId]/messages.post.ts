import { defineEventHandler, getRouterParam, readBody, setResponseStatus } from "h3";
import { addMessage } from "../../../../services/chatStore";

export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, "roomId");
  const body = await readBody(event);

  if (!roomId) {
    setResponseStatus(event, 400);
    return {
      success: false,
      message: "معرف الغرفة مطلوب",
    };
  }

  if (typeof body?.text !== "string" || !body.text.trim()) {
    setResponseStatus(event, 400);
    return {
      success: false,
      message: "نص الرسالة مطلوب",
    };
  }

  if (body.text.trim().length > 1000) {
    setResponseStatus(event, 413);
    return {
      success: false,
      message: "الرسالة طويلة جداً",
    };
  }

  const message = addMessage({
    roomId,
    clientId: typeof body.clientId === "string" ? body.clientId : undefined,
    user: typeof body.user === "string" ? body.user : undefined,
    role: body.role === "admin" || body.role === "member" || body.role === "guest" ? body.role : "guest",
    countryCode: typeof body.countryCode === "string" ? body.countryCode : undefined,
    avatar: typeof body.avatar === "string" ? body.avatar : undefined,
    avatarFrameUrl: typeof body.avatarFrameUrl === "string" ? body.avatarFrameUrl : undefined,
    giftIconUrl: typeof body.giftIconUrl === "string" ? body.giftIconUrl : undefined,
    messageBubbleStyle: typeof body.messageBubbleStyle === "string" ? body.messageBubbleStyle : undefined,
    text: body.text,
  });

  return {
    success: true,
    message,
  };
});
