import { defineEventHandler } from "h3";
import { listRooms } from "../../services/chatStore";

export default defineEventHandler(async () => ({
  success: true,
  rooms: await listRooms(),
}));
