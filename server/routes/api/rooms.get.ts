import { defineEventHandler } from "h3";
import { listRooms } from "../../services/chatStore";
import { getRoomMemberCount } from "../../socket/presenceManager";

export default defineEventHandler(async () => {
  const rooms = await listRooms();
  const roomsWithCounts = await Promise.all(
    rooms.map(async (room: any) => {
      const liveCount = await getRoomMemberCount(room.id);
      return {
        ...room,
        members: liveCount,
      };
    })
  );

  return {
    success: true,
    rooms: roomsWithCounts,
  };
});
