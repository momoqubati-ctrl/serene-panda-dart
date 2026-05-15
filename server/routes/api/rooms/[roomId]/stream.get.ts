import { createEventStream, defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import { listMessages, subscribeToRoom } from "../../../../services/chatStore";

export default defineEventHandler((event) => {
  const roomId = getRouterParam(event, "roomId");

  if (!roomId) {
    setResponseStatus(event, 400);
    return {
      success: false,
      message: "معرف الغرفة مطلوب",
    };
  }

  const eventStream = createEventStream(event);

  listMessages(roomId).forEach((message) => {
    eventStream.push(JSON.stringify({ type: "message", message }));
  });

  const unsubscribe = subscribeToRoom(roomId, (message) => {
    eventStream.push(JSON.stringify({ type: "message", message }));
  });

  const heartbeat = setInterval(() => {
    eventStream.push(JSON.stringify({ type: "ping", at: new Date().toISOString() }));
  }, 25000);

  eventStream.onClosed(() => {
    clearInterval(heartbeat);
    unsubscribe();
  });

  return eventStream.send();
});
