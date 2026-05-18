/**
 * Vite Plugin: Socket.io Integration
 * يربط Socket.io مع سيرفر Vite Dev عبر HTTP Server hook
 */
import type { Plugin } from "vite";
import { Server as SocketIOServer } from "socket.io";

export function viteSocketIO(): Plugin {
  let io: SocketIOServer | null = null;

  return {
    name: "vite-plugin-socket-io",
    configureServer(server) {
      if (!server.httpServer) return;

      io = new SocketIOServer(server.httpServer, {
        path: "/ws",
        serveClient: false,
        transports: ["websocket", "polling"],
        allowUpgrades: true,
        pingInterval: 20000,
        pingTimeout: 180000,
        maxHttpBufferSize: 1e6,
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
        perMessageDeflate: {
          threshold: 2000,
          zlibDeflateOptions: { chunkSize: 1024 * 16, level: 5 },
          zlibInflateOptions: { chunkSize: 1024 * 16 },
        },
      });

      // ========== Presence Manager (inline) ==========
      type OnlineUser = {
        id: string;
        socketId: string;
        username: string;
        role: string;
        avatar: string;
        countryCode: string;
        avatarFrameUrl: string;
        giftIconUrl: string;
        messageBubbleStyle: string;
        roomId: string;
        connectedAt: string;
      };

      const connectedUsers = new Map<string, OnlineUser>();
      const roomMembersMap = new Map<string, Set<string>>();

      function addUser(socketId: string, data: Omit<OnlineUser, "socketId">) {
        connectedUsers.set(socketId, { ...data, socketId });
      }

      function removeUser(socketId: string) {
        const user = connectedUsers.get(socketId);
        if (user) {
          connectedUsers.delete(socketId);
          if (user.roomId) {
            const members = roomMembersMap.get(user.roomId);
            if (members) {
              members.delete(socketId);
              if (members.size === 0) roomMembersMap.delete(user.roomId);
            }
          }
        }
        return user;
      }

      function joinUserToRoom(socketId: string, roomId: string) {
        const user = connectedUsers.get(socketId);
        if (!user) return;
        if (user.roomId && user.roomId !== roomId) {
          leaveUserFromRoom(socketId);
        }
        user.roomId = roomId;
        if (!roomMembersMap.has(roomId)) roomMembersMap.set(roomId, new Set());
        roomMembersMap.get(roomId)!.add(socketId);
      }

      function leaveUserFromRoom(socketId: string) {
        const user = connectedUsers.get(socketId);
        if (!user || !user.roomId) return undefined;
        const roomId = user.roomId;
        const members = roomMembersMap.get(roomId);
        if (members) {
          members.delete(socketId);
          if (members.size === 0) roomMembersMap.delete(roomId);
        }
        user.roomId = "";
        return roomId;
      }

      function getRoomUsers(roomId: string): OnlineUser[] {
        const memberIds = roomMembersMap.get(roomId);
        if (!memberIds) return [];
        const result: OnlineUser[] = [];
        for (const sid of memberIds) {
          const u = connectedUsers.get(sid);
          if (u) result.push(u);
        }
        return result;
      }

      function getRoomCount(roomId: string) {
        return roomMembersMap.get(roomId)?.size ?? 0;
      }

      // ========== Real DB Message Store via chatStore ==========
      let chatStore: any;
      import("./server/services/chatStore").then(m => { chatStore = m; });
      let powersService: any;
      import("./server/services/powersService").then(m => { powersService = m; });
      let filterService: any;
      import("./server/services/filterService").then(m => { filterService = m; });

      // ========== Typing throttle ==========
      const typingTimers = new Map<string, NodeJS.Timeout>();

      // ========== Socket.io Connection Handler ==========
      io.on("connection", (socket) => {
        const auth = socket.handshake.auth || {};
        const username = auth.username || "زائر";
        const role = auth.role || "guest";
        const userId = auth.userId || socket.id;

        const userData: Omit<OnlineUser, "socketId"> = {
          id: userId,
          username,
          role,
          avatar: auth.avatar || "/pic.png",
          countryCode: auth.countryCode || "SA",
          avatarFrameUrl: auth.avatarFrameUrl || "",
          giftIconUrl: auth.giftIconUrl || "",
          messageBubbleStyle: auth.messageBubbleStyle || "default",
          roomId: "",
          connectedAt: new Date().toISOString(),
        };

        addUser(socket.id, userData);
        
        // Join moderators alerts room if authorized
        if (role === 'admin' || role === 'owner') {
          socket.join("moderators_alerts");
        }

        io!.emit("online_count", { count: connectedUsers.size });

        socket.emit("connected", {
          socketId: socket.id,
          user: userData,
          serverTime: new Date().toISOString(),
        });

        // ===== Room Events =====
        socket.on("join_room", async (data: any, callback?: any) => {
          const roomId = String(data?.roomId || "").trim();
          if (!roomId) { callback?.({ success: false, message: "معرف الغرفة مطلوب" }); return; }

          const prev = connectedUsers.get(socket.id)?.roomId;
          if (prev && prev !== roomId) {
            socket.leave(`room:${prev}`);
            leaveUserFromRoom(socket.id);
            io!.to(`room:${prev}`).emit("user_left", { socketId: socket.id, username, roomId: prev, memberCount: getRoomCount(prev) });
          }

          socket.join(`room:${roomId}`);
          joinUserToRoom(socket.id, roomId);

          const members = getRoomUsers(roomId);
          
          try {
            const messages = await chatStore.listMessages(roomId);
            const rooms = await chatStore.listRooms();
            const room = rooms.find((r: any) => r.id === roomId);

            callback?.({
              success: true,
              roomId,
              messages,
              members: members.map(m => ({ id: m.id, username: m.username, role: m.role, avatar: m.avatar, countryCode: m.countryCode, avatarFrameUrl: m.avatarFrameUrl, giftIconUrl: m.giftIconUrl })),
              memberCount: members.length,
            });

            socket.to(`room:${roomId}`).emit("user_joined", {
              socketId: socket.id,
              user: { id: userId, username, role, avatar: userData.avatar, countryCode: userData.countryCode, avatarFrameUrl: userData.avatarFrameUrl, giftIconUrl: userData.giftIconUrl },
              memberCount: members.length,
            });

            if (room) {
              socket.emit("system_message", { type: "welcome", text: `مرحباً بك في ${room.name}`, roomId });
            }
          } catch (error) {
            console.error("Error joining room:", error);
            callback?.({ success: false, message: "تعذر الانضمام للغرفة" });
          }
        });

        socket.on("leave_room", (data: any) => {
          const roomId = String(data?.roomId || "").trim();
          if (!roomId) return;
          socket.leave(`room:${roomId}`);
          leaveUserFromRoom(socket.id);
          io!.to(`room:${roomId}`).emit("user_left", { socketId: socket.id, username, roomId, memberCount: getRoomCount(roomId) });
        });

        socket.on("room_message", async (data: any, callback?: any) => {
          const roomId = String(data?.roomId || "").trim();
          const text = String(data?.text || "").trim();
          if (!roomId) { callback?.({ success: false, message: "معرف الغرفة مطلوب" }); return; }
          if (!text) { callback?.({ success: false, message: "نص الرسالة مطلوب" }); return; }
          if (text.length > 1000) { callback?.({ success: false, message: "الرسالة طويلة جداً" }); return; }

          try {
            // --- تطبيق الفلترة ---
            let finalChatText = text;
            if (filterService) {
              const filterRes = await filterService.processText({
                text,
                source: roomId,
                user: { username, topic: username, ip: socket.handshake.address || "127.0.0.1" }
              });
              finalChatText = filterRes.filteredText;
            }

            const msg = await chatStore.addMessage({
              roomId,
              clientId: data.clientId,
              user: username,
              role,
              text: finalChatText,
              avatar: userData.avatar,
              countryCode: userData.countryCode,
              avatarFrameUrl: userData.avatarFrameUrl,
              giftIconUrl: userData.giftIconUrl,
              messageBubbleStyle: userData.messageBubbleStyle,
            });

            io!.to(`room:${roomId}`).emit("new_message", { roomId, message: msg });
            callback?.({ success: true, message: msg });
          } catch (error) {
            console.error("Error sending message:", error);
            callback?.({ success: false, message: "تعذر إرسال الرسالة" });
          }
        });

        socket.on("typing", (data: any) => {
          const roomId = String(data?.roomId || "").trim();
          if (!roomId) return;
          const key = `${socket.id}:${roomId}`;
          if (typingTimers.has(key)) return;
          typingTimers.set(key, setTimeout(() => typingTimers.delete(key), 900));
          socket.to(`room:${roomId}`).emit("user_typing", { socketId: socket.id, username, roomId });
        });

        socket.on("stop_typing", (data: any) => {
          const roomId = String(data?.roomId || "").trim();
          if (!roomId) return;
          socket.to(`room:${roomId}`).emit("user_stop_typing", { socketId: socket.id, username, roomId });
        });

        // ===== Moderation Events =====
        socket.on("moderation_action", async (data: any, callback?: any) => {
          if (!powersService) {
            callback?.({ success: false, message: "خدمة الصلاحيات غير متاحة" });
            return;
          }

          const action = data?.action; // "kick", "ban", "alert"
          const targetUserId = data?.targetUserId || data?.targetSocketId; // backward compatible
          
          let targetUser: OnlineUser | undefined;
          let targetSocketId: string | undefined;
          
          for (const [sid, u] of connectedUsers.entries()) {
            if (u.id === targetUserId || sid === targetUserId) {
              targetUser = u;
              targetSocketId = sid;
              break;
            }
          }
          
          if (!targetUser || !targetSocketId) {
            callback?.({ success: false, message: "المستخدم غير متصل" });
            return;
          }

          if (!powersService.canExecuteAction(role, targetUser.role, action)) {
            callback?.({ success: false, message: "لا تملك الصلاحية الكافية" });
            return;
          }

          const roomId = targetUser.roomId;
          
          if (action === "alert") {
            io!.to(targetSocketId).emit("system_alert", {
              title: "تنبيه إداري",
              message: data?.reason || "تم تنبيهك من قبل الإدارة",
              from: username
            });
          } else if (action === "kick" || action === "ban") {
             io!.to(targetSocketId).emit("system_alert", {
               title: action === "ban" ? "حظر" : "طرد",
               message: action === "ban" ? "لقد تم حظرك من الموقع" : "لقد تم طردك من الغرفة",
               from: username
             });
             
             // Disconnect user
             const targetSocket = io!.sockets.sockets.get(targetSocketId);
             if (targetSocket) {
               targetSocket.disconnect(true);
             }
          }

          await powersService.logModerationEvent({
            actorId: userId,
            targetUserId: targetUser.id,
            roomId,
            eventType: action,
            reason: data?.reason
          });

          callback?.({ success: true, message: `تم تنفيذ الإجراء ${action} بنجاح` });
          
          if (roomId) {
            io!.to(`room:${roomId}`).emit("system_message", { 
              type: "moderation", 
              text: `تم ${action === 'kick' ? 'طرد' : action === 'ban' ? 'حظر' : 'تنبيه'} ${targetUser.username}`, 
              roomId 
            });
          }
        });

        socket.on("get_rooms", async (callback?: any) => {
          try {
            const rooms = await chatStore.listRooms();
            const result = rooms.map((r: any) => ({ ...r, members: getRoomCount(r.id) }));
            callback?.({ success: true, rooms: result });
          } catch (error) {
             callback?.({ success: false, message: "تعذر جلب الغرف" });
          }
        });

        // ===== Presence Events =====
        socket.on("get_online_users", (callback?: any) => {
          const users = Array.from(connectedUsers.values()).map(u => ({
            id: u.id, username: u.username, role: u.role, avatar: u.avatar,
            countryCode: u.countryCode, avatarFrameUrl: u.avatarFrameUrl,
            giftIconUrl: u.giftIconUrl, roomId: u.roomId,
          }));
          callback?.({ success: true, users, count: users.length });
        });

        // ===== PM Events =====
        socket.on("pm_message", async (data: any, callback?: any) => {
          const toSocketId = String(data?.toSocketId || "").trim();
          const text = String(data?.text || "").trim();
          if (!toSocketId || !text) { callback?.({ success: false, message: "بيانات ناقصة" }); return; }
          
          // --- تطبيق الفلترة في الخاص ---
          let finalPmText = text;
          if (filterService) {
            const filterRes = await filterService.processText({
              text,
              source: "private",
              user: { username, topic: username, ip: socket.handshake.address || "127.0.0.1" },
              target: toSocketId
            });
            finalPmText = filterRes.filteredText;
          }

          const msg = { 
            id: crypto.randomUUID(), 
            clientId: data.clientId, 
            fromSocketId: socket.id, 
            toSocketId, 
            user: username, 
            role, 
            avatar: userData.avatar, 
            countryCode: userData.countryCode, 
            text: finalPmText.slice(0, 1000), 
            createdAt: new Date().toISOString() 
          };
          
          io!.to(toSocketId).emit("pm_message", msg);
          callback?.({ success: true, message: msg });
        });

        socket.on("pm_typing", (data: any) => {
          const to = String(data?.toSocketId || "").trim();
          if (to) io!.to(to).emit("pm_typing", { fromSocketId: socket.id, username });
        });

        // ===== Disconnect =====
        socket.on("disconnect", () => {
          const user = connectedUsers.get(socket.id);
          if (user?.roomId) {
            io!.to(`room:${user.roomId}`).emit("user_left", { socketId: socket.id, username, roomId: user.roomId, memberCount: Math.max(0, getRoomCount(user.roomId) - 1) });
          }
          for (const [key, timer] of typingTimers) {
            if (key.startsWith(`${socket.id}:`)) { clearTimeout(timer); typingTimers.delete(key); }
          }
          removeUser(socket.id);
          io!.emit("online_count", { count: connectedUsers.size });
        });
      });

      console.log("[Socket.io] ✅ WebSocket server attached on path /ws");
    },
  };
}