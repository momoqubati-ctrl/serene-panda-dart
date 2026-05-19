/**
 * Socket Broker
 * يوزع أحداث WebSocket بين خوادم متعددة باستخدام Redis Pub/Sub بدون الحاجة لتثبيت حزم خارجية
 */
import { Server } from "socket.io";
import { createRedisClient } from "../services/redis";

let subClient: any = null;

export function initializeSocketBroker(io: Server): void {
  subClient = createRedisClient();

  // الاشتراك في قنوات الغرف العامة
  subClient.psubscribe("pubsub:room:*").catch((err: any) => {
    console.error("[SocketBroker] Redis psubscribe failed:", err);
  });

  subClient.on("pmessage", (pattern: string, channel: string, dataStr: string) => {
    try {
      const match = channel.match(/^pubsub:room:(.+)$/);
      if (!match) return;
      const roomId = match[1];

      const { event, payload, excludeSocketId } = JSON.parse(dataStr);

      let target = io.to(`room:${roomId}`);
      if (excludeSocketId) {
        target = target.except(excludeSocketId) as any;
      }

      target.emit(event, payload);
    } catch (err) {
      console.error("[SocketBroker] Error processing pubsub message:", err);
    }
  });

  console.log("[SocketBroker] Initialized Redis Pub/Sub subscriber broker");
}

export async function publishSocketEvent(roomId: string, event: string, payload: any, excludeSocketId?: string): Promise<void> {
  const channel = `pubsub:room:${roomId}`;
  const data = JSON.stringify({ event, payload, excludeSocketId });
  const redisModule = await import("../services/redis");
  await redisModule.redis.publish(channel, data);
}
