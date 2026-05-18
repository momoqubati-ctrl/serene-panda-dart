"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Send, Plus, X, Volume2, VolumeX, Crown, MicOff, ChevronLeft, Mic2, Loader2 } from "lucide-react";
import { getCountryFlagSrc, normalizeCountryCode } from "@/lib/countries";
import { getSocket } from "@/lib/socket";

type ChatMessage = {
  id: string;
  clientId?: string;
  user: string;
  role: "guest" | "member" | "admin" | "bot" | "system";
  text: string;
  avatar: string;
  countryCode?: string;
  avatarFrameUrl?: string;
  giftIconUrl?: string;
  messageBubbleStyle?: string;
  color: string;
  isOwner?: boolean;
  isSystem?: boolean;
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
};

type RoomMember = {
  id: string;
  username: string;
  role: string;
  avatar: string;
  countryCode: string;
  avatarFrameUrl?: string;
  giftIconUrl?: string;
};

const getStoredUser = () => {
  const fallback = {
    name: "زائر",
    role: "guest" as const,
    countryCode: "SA",
    avatar: "/pic.png",
    profileMsg: "( غير مسجل )",
    avatarFrameUrl: "",
    giftIconUrl: "",
    profileThemeId: "",
    messageBubbleStyle: "default",
  };

  try {
    const raw = localStorage.getItem("user");
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const role = parsed.role === "admin" ? ("admin" as const) : parsed.role === "guest" ? ("guest" as const) : ("member" as const);

    return {
      name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name : fallback.name,
      role,
      countryCode: normalizeCountryCode(parsed.countryCode),
      avatar: typeof parsed.avatar === "string" && parsed.avatar.trim() ? parsed.avatar : fallback.avatar,
      avatarFrameUrl: typeof parsed.avatarFrameUrl === "string" ? parsed.avatarFrameUrl : "",
      giftIconUrl:
        typeof parsed.giftIconUrl === "string" && parsed.giftIconUrl.trim()
          ? parsed.giftIconUrl
          : typeof parsed.giftIcon === "string"
            ? parsed.giftIcon
            : "",
      profileThemeId: typeof parsed.profileThemeId === "string" ? parsed.profileThemeId : "",
      messageBubbleStyle: typeof parsed.messageBubbleStyle === "string" ? parsed.messageBubbleStyle : "default",
      profileMsg:
        typeof parsed.profileMsg === "string" && parsed.profileMsg.trim()
          ? parsed.profileMsg
          : role === "guest"
            ? "( غير مسجل )"
            : "(عضو جديد)",
    };
  } catch {
    return fallback;
  }
};

const formatMessageTime = (value: string) =>
  new Intl.DateTimeFormat("ar", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const getMessageBubbleClass = (msg: ChatMessage) => {
  if (msg.isSystem) return "border-teal-100 bg-teal-50 text-teal-700";
  if (msg.failed) return "border-red-100 bg-red-50 text-red-700";
  if (msg.messageBubbleStyle === "soft") return "border-blue-100 bg-blue-50 text-foreground";
  if (msg.messageBubbleStyle === "dark") return "border-slate-800 bg-slate-900 text-white";
  return "border-border bg-card text-foreground";
};

const ChatInputArea = React.memo(({ roomId, onSendMessage }: { roomId: string, onSendMessage: (text: string) => void }) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setMessage(""); // Clear instantly for better UX

    try {
      // Calling the parent which handles optimistic UI and socket emit
      await onSendMessage(text);
    } finally {
      setIsSending(false);

      const socket = getSocket();
      socket.emit("stop_typing", { roomId });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    const socket = getSocket();
    if (!typingTimerRef.current) {
      socket.emit("typing", { roomId });
      typingTimerRef.current = setTimeout(() => {
        typingTimerRef.current = null;
      }, 1000);
    }
  };

  return (
    <div className="z-10 border-t border-border bg-card p-3 shadow-lg">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-muted hover:text-primary">
            <Plus size={20} />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-muted hover:text-pink-500">
            <Gift size={20} />
          </Button>
        </div>
        <div className="relative flex-1">
          <Input
            placeholder="اكتب رسالة..."
            className="h-10 rounded-xl border-border bg-muted text-xs font-bold text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
            value={message}
            onChange={handleInputChange}
            dir="rtl"
            maxLength={1000}
          />
        </div>
        <Button type="submit" disabled={!message.trim() || isSending} className={`h-10 w-10 rounded-xl p-0 shadow-lg ${message.trim() ? "bg-primary shadow-primary/20" : "bg-slate-100 text-muted-foreground"}`}>
          {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        </Button>
      </form>
    </div>
  );
});

const RoomPage = ({ room, onBack, isEmbedded = false }: any) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [showMics, setShowMics] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const roomId = useMemo(() => String(room?.id ?? "general"), [room?.id]);

  const mergeMessages = useCallback((incoming: ChatMessage[]) => {
    setMessages((current) => {
      const byKey = new Map<string, ChatMessage>();

      current.forEach((item) => {
        byKey.set(item.clientId || item.id, item);
      });

      incoming.forEach((item) => {
        byKey.set(item.clientId || item.id, item);
      });

      return Array.from(byKey.values()).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    });
  }, []);

  // ربط Socket.io
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      // الانضمام للغرفة
      socket.emit("join_room", { roomId }, (res: any) => {
        if (res?.success) {
          if (res.messages) {
            mergeMessages(res.messages);
          }
          if (res.members) {
            setMembers(res.members);
          }
          setMemberCount(res.memberCount || 0);
          setError("");
        } else {
          setError(res?.message || "تعذر الانضمام للغرفة");
        }
        setIsLoading(false);
      });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onNewMessage = (data: { roomId: string; message: ChatMessage }) => {
      if (data.roomId === roomId) {
        mergeMessages([data.message]);
      }
    };

    const onUserJoined = (data: { user: RoomMember; memberCount: number }) => {
      setMembers((prev) => {
        if (prev.some((m) => m.id === data.user.id)) return prev;
        return [...prev, data.user];
      });
      setMemberCount(data.memberCount);
    };

    const onUserLeft = (data: { socketId: string; memberCount: number }) => {
      setMemberCount(data.memberCount);
    };

    const onUserTyping = (data: { username: string }) => {
      setTypingUsers((prev) => {
        if (prev.includes(data.username)) return prev;
        return [...prev, data.username];
      });
      // إزالة بعد 2 ثانية
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== data.username));
      }, 2000);
    };

    const onSystemMessage = (data: { text: string; roomId: string }) => {
      if (data.roomId === roomId) {
        mergeMessages([
          {
            id: `sys-${Date.now()}`,
            user: "النظام",
            role: "system",
            text: data.text,
            avatar: "/pic.png",
            countryCode: "SA",
            color: "text-teal-600",
            isSystem: true,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new_message", onNewMessage);
    socket.on("user_joined", onUserJoined);
    socket.on("user_left", onUserLeft);
    socket.on("user_typing", onUserTyping);
    socket.on("system_message", onSystemMessage);

    // إذا كان متصل بالفعل، انضم للغرفة مباشرة
    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_message", onNewMessage);
      socket.off("user_joined", onUserJoined);
      socket.off("user_left", onUserLeft);
      socket.off("user_typing", onUserTyping);
      socket.off("system_message", onSystemMessage);
      socket.emit("leave_room", { roomId });
    };
  }, [roomId, mergeMessages]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string) => {
    const user = getStoredUser();
    const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Optimistic UI
    const pendingMessage: ChatMessage = {
      id: clientId,
      clientId,
      user: user.name,
      role: user.role,
      text,
      avatar: user.avatar,
      countryCode: user.countryCode,
      avatarFrameUrl: user.avatarFrameUrl,
      giftIconUrl: user.giftIconUrl,
      messageBubbleStyle: user.messageBubbleStyle,
      color: user.role === "admin" ? "text-red-600" : "text-foreground",
      isOwner: user.role === "admin",
      createdAt: new Date().toISOString(),
      pending: true,
    };

    mergeMessages([pendingMessage]);

    return new Promise<void>((resolve) => {
      const socket = getSocket();
      let settled = false;

      const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        setMessages((current) =>
          current.map((item) =>
            item.clientId === clientId
              ? { ...item, pending: false, failed: true, text: `${item.text} - لم يصل رد السيرفر` }
              : item,
          ),
        );
        setError("تعذر إرسال الرسالة. تحقق من اتصال السيرفر.");
        resolve();
      }, 8000);

      socket.emit("room_message", { roomId, text, clientId }, (res: any) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);

        if (res?.success && res.message) {
          mergeMessages([res.message]);
        } else {
          setMessages((current) =>
            current.map((item) =>
              item.clientId === clientId
                ? { ...item, pending: false, failed: true, text: `${item.text} - فشل الإرسال` }
                : item,
            ),
          );
          setError(res?.message || "فشل إرسال الرسالة");
        }
        resolve();
      });
    });
  }, [roomId, mergeMessages]);

  return (
    <div className={`flex h-full flex-col bg-card ltr ${!isEmbedded ? "fixed inset-0 z-[60]" : ""}`}>
      <header className="z-10 flex items-center justify-between border-b border-border bg-card px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          {!isEmbedded && (
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
              <ChevronLeft size={24} />
            </Button>
          )}
          <div className="relative">
            <Avatar className="h-10 w-10 rounded-xl border border-border shadow-sm">
              <AvatarImage src={room.image} />
              <AvatarFallback>{room.name?.[0] ?? "غ"}</AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          </div>
          <div dir="rtl">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black leading-tight text-foreground">{room.name}</h3>
              <Crown size={12} className="text-yellow-500" />
            </div>
            <p className="text-[9px] font-bold text-muted-foreground">
              {memberCount > 0 ? `${memberCount} متصل` : "بواسطة: " + room.owner}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className={`mx-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${isConnected ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
            <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            {isConnected ? "متصل" : "غير متصل"}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className={`h-9 w-9 rounded-xl ${isMuted ? "bg-red-50 text-red-500" : "text-muted-foreground"}`}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowMics(!showMics)} className={`h-9 w-9 rounded-xl ${showMics ? "bg-primary/5 text-primary" : "text-muted-foreground"}`}>
            <Mic2 size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50">
            <X size={18} />
          </Button>
        </div>
      </header>

      {showMics && (
        <div className="grid grid-cols-5 gap-2 overflow-x-auto border-b border-border bg-muted p-2 no-scrollbar">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="relative">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${i === 1 ? "border-primary bg-card shadow-sm" : "border-border bg-slate-100"}`}>
                  {i === 1 ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://i.pravatar.cc/150?u=active-speaker" />
                      <AvatarFallback>م</AvatarFallback>
                    </Avatar>
                  ) : (
                    <MicOff size={14} className="text-slate-300" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 rounded-full border border-border bg-card px-1 text-[8px] font-black">
                  {i}
                </div>
              </div>
              <span className="w-12 truncate text-center text-[8px] font-bold text-muted-foreground">{i === 1 ? "متحدث" : "فارغ"}</span>
            </div>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/50 p-3">
        {isLoading && (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-2 text-center text-xs font-bold text-red-600" dir="rtl">
            {error}
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-3 text-center text-xs font-bold text-muted-foreground" dir="rtl">
            لا توجد رسائل بعد
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.clientId || msg.id} className={`flex gap-3 group ${msg.pending ? "opacity-70" : ""}`}>
            <div className="relative shrink-0">
              <div
                className="rounded-xl bg-cover bg-center p-0.5"
                style={msg.avatarFrameUrl ? { backgroundImage: `url(${msg.avatarFrameUrl})` } : undefined}
              >
                <Avatar className="h-9 w-9 rounded-xl border border-white shadow-sm">
                  <AvatarImage src={msg.avatar} />
                  <AvatarFallback>{msg.user[0]}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="min-w-0 flex-1" dir="rtl">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h4 className={`text-[11px] font-black ${msg.color}`}>{msg.user}</h4>
                <img src={getCountryFlagSrc(msg.countryCode)} alt={msg.countryCode} className="h-3 w-4 rounded-sm object-cover" />
                {msg.giftIconUrl && <img src={msg.giftIconUrl} alt="gift" className="h-4 w-4 rounded object-cover" />}
                {msg.isOwner && <Badge className="h-3.5 rounded-sm border-none bg-blue-600 px-1 text-[8px] font-black text-white">مالك الموقع</Badge>}
                <span className="ms-auto text-[8px] font-bold text-muted-foreground">
                  {msg.pending ? "جار الإرسال" : msg.failed ? "فشل" : formatMessageTime(msg.createdAt)}
                </span>
              </div>
              <div className={`relative inline-block max-w-[90%] rounded-2xl rounded-tr-none border p-2.5 shadow-sm ${getMessageBubbleClass(msg)}`}>
                <p className="break-words text-xs font-bold leading-relaxed">{msg.text}</p>
              </div>
            </div>
          </div>
        ))}

        {/* مؤشر الكتابة */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2 text-[10px] font-bold text-muted-foreground" dir="rtl">
            <div className="flex gap-0.5">
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
            </div>
            <span>{typingUsers.join("، ")} يكتب...</span>
          </div>
        )}
      </div>

      <ChatInputArea roomId={roomId} onSendMessage={handleSendMessage} />
    </div>
  );
};

export default RoomPage;
