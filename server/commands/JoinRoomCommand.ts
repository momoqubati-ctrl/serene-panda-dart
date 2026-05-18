import { eventBus } from "../core/events/EventBus";

export type JoinRoomCommand = {
  roomId: string;
  userId: string;
  username?: string;
  role?: string;
  socketId?: string;
};

export async function executeJoinRoomCommand(command: JoinRoomCommand): Promise<void> {
  if (!command.roomId?.trim()) throw new Error("roomId is required");
  await eventBus.publish({
    type: "room.joined",
    stream: "rooms",
    actor: { id: command.userId, username: command.username, role: command.role, socketId: command.socketId },
    target: { id: command.roomId, type: "room", roomId: command.roomId },
    payload: command,
    metadata: { roomId: command.roomId, source: "JoinRoomCommand", shardKey: command.roomId },
  });
}
