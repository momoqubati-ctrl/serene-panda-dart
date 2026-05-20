import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function readSocketAuth(): Record<string, string> {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return {};

    const user = JSON.parse(raw);
    return {
      userId: user.id || "",
      username: user.name || "زائر",
      role: user.role || "guest",
      avatar: user.avatar || "/pic.png",
      countryCode: user.countryCode || "SA",
      giftIconUrl: user.giftIconUrl || "",
      messageBubbleStyle: user.messageBubbleStyle || "default",
      idreg: typeof user.idreg === "string" ? user.idreg : "",
      siteBadge: typeof user.siteBadge === "string" ? user.siteBadge : "",
    };
  } catch {
    return {};
  }
}

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io({
    path: "/ws",
    transports: ["websocket", "polling"],
    auth: readSocketAuth(),
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
