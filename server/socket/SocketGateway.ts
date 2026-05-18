import type { Server, Socket } from "socket.io";
import { redis } from "../services/redis";
import { metrics } from "../observability/Metrics";
import { joinUserChannels } from "./SocketChannels";

export type SocketGatewayOptions = {
  shardId?: string;
};

export function configureSocketGateway(io: Server, options: SocketGatewayOptions = {}): void {
  io.engine.on("connection_error", (error) => {
    void metrics.increment("socket.connection_error", 1, { code: error.code });
  });
}

export function registerSocketConnection(socket: Socket, options: SocketGatewayOptions = {}): void {
  joinUserChannels(socket);
  void redis.hset(`socket:state:${socket.id}`, {
    userId: socket.data.user?.id ?? "",
    role: socket.data.user?.role ?? "guest",
    shardId: options.shardId ?? process.env.SOCKET_SHARD_ID ?? "local",
    connectedAt: new Date().toISOString(),
  }).catch(() => undefined);
  void redis.expire(`socket:state:${socket.id}`, 3600).catch(() => undefined);
  void metrics.increment("socket.connected", 1, { shard: options.shardId ?? "local" });

  socket.on("disconnect", () => {
    void redis.del(`socket:state:${socket.id}`).catch(() => undefined);
    void metrics.increment("socket.disconnected", 1, { shard: options.shardId ?? "local" });
  });
}
