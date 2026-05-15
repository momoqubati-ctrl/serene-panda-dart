import { defineEventHandler } from "h3";
import { listRooms } from "../../services/chatStore";

export default defineEventHandler(() => ({
  success: true,
  rooms: listRooms(),
}));
