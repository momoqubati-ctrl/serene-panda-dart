"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Send, Plus, X, Volume2, VolumeX, Crown, MicOff, ChevronLeft, Mic2, Loader2 } from "lucide-react";
import { getCountryFlagSrc, normalizeCountryCode } from "@/lib/countries";

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
  if (msg.messageBubbleStyle === "soft") return "border-blue-100 bg-blue-50 text-slate-800";
  if (msg.messageBubbleStyle === "dark") return "border-slate-800 bg-slate-900 text-white";
  return "border-slate-100 bg-white text-slate-700";
};

const RoomPage = ({ room, onBack, isEmbedded = false }: any) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [showMics, setShowMics] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestMessageAt = useRef<string>("");

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

    incoming.forEach((item) => {
      if (!latestMessageAt.current || Date.parse(item.createdAt) > Date.parse(latestMessageAt.current)) {
        latestMessageAt.current = item.createdAt;
      }
    });
  }, []);

  const loadMessages = useCallback(
    async (after?: string) => {
      try {
        const query = after ? `?after=${encodeURIComponent(after)}` : "";
        const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages${query}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "تعذر تحميل الرسائل");
        }

        mergeMessages(data.messages);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "تعذر تحميل الرسائل");
      } finally {
        setIsLoading(false);
      }
    },
    [mergeMessages, roomId],
  );

  useEffect(() => {
    latestMessageAt.current = "";
    setMessages([]);
    setIsLoading(true);
    loadMessages();
  }, [loadMessages, roomId]);

  useEffect(() => {
    const source = new EventSource(`/api/rooms/${encodeURIComponent(roomId)}/stream`);

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "message" && payload.message) {
          mergeMessages([payload.message]);
        }
      } catch {
        // Ignore malformed stream frames. The next valid frame will recover the UI.
      }
    };

    source.onerror = () => {
      source.close();
      window.setTimeout(() => {
        loadMessages(latestMessageAt.current);
      }, 1000);
    };

    return () => source.close();
  }, [loadMessages, mergeMessages, roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || isSending) return;

    const user = getStoredUser();
    const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
      color: user.role === "admin" ? "text-red-600" : "text-slate-700",
      isOwner: user.role === "admin",
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessage("");
    setIsSending(true);
    mergeMessages([pendingMessage]);

    try {
      const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          text,
          user: user.name,
          role: user.role,
          countryCode: user.countryCode,
          avatar: user.avatar,
          avatarFrameUrl: user.avatarFrameUrl,
          giftIconUrl: user.giftIconUrl,
          messageBubbleStyle: user.messageBubbleStyle,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشل إرسال الرسالة");
      }

      mergeMessages([data.message]);
    } catch (err) {
      setMessages((current) =>
        current.map((item) =>
          item.clientId === clientId
            ? { ...item, pending: false, failed: true, text: `${item.text} - فشل الإرسال` }
            : item,
        ),
      );
      setError(err instanceof Error ? err.message : "فشل إرسال الرسالة");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`flex h-full flex-col bg-white ltr ${!isEmbedded ? "fixed inset-0 z-[60]" : ""}`}>
      <header className="z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          {!isEmbedded && (
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
              <ChevronLeft size={24} />
            </Button>
          )}
          <div className="relative">
            <Avatar className="h-10 w-10 rounded-xl border border-slate-100 shadow-sm">
              <AvatarImage src={room.image} />
              <AvatarFallback>{room.name?.[0] ?? "غ"}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div dir="rtl">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black leading-tight text-slate-800">{room.name}</h3>
              <Crown size={12} className="text-yellow-500" />
            </div>
            <p className="text-[9px] font-bold text-slate-400">بواسطة: {room.owner}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className={`h-9 w-9 rounded-xl ${isMuted ? "bg-red-50 text-red-500" : "text-slate-400"}`}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowMics(!showMics)} className={`h-9 w-9 rounded-xl ${showMics ? "bg-primary/5 text-primary" : "text-slate-400"}`}>
            <Mic2 size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50">
            <X size={18} />
          </Button>
        </div>
      </header>

      {showMics && (
        <div className="grid grid-cols-5 gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50 p-2 no-scrollbar">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="relative">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${i === 1 ? "border-primary bg-white shadow-sm" : "border-slate-200 bg-slate-100"}`}>
                  {i === 1 ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://i.pravatar.cc/150?u=active-speaker" />
                      <AvatarFallback>م</AvatarFallback>
                    </Avatar>
                  ) : (
                    <MicOff size={14} className="text-slate-300" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 rounded-full border border-slate-200 bg-white px-1 text-[8px] font-black">
                  {i}
                </div>
              </div>
              <span className="w-12 truncate text-center text-[8px] font-bold text-slate-500">{i === 1 ? "متحدث" : "فارغ"}</span>
            </div>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-3">
        {isLoading && (
          <div className="flex h-24 items-center justify-center text-slate-400">
            <Loader2 className="animate-spin" size={20} />
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-2 text-center text-xs font-bold text-red-600" dir="rtl">
            {error}
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="rounded-lg border border-slate-100 bg-white p-3 text-center text-xs font-bold text-slate-500" dir="rtl">
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
                <span className="ms-auto text-[8px] font-bold text-slate-400">
                  {msg.pending ? "جار الإرسال" : msg.failed ? "فشل" : formatMessageTime(msg.createdAt)}
                </span>
              </div>
              <div className={`relative inline-block max-w-[90%] rounded-2xl rounded-tr-none border p-2.5 shadow-sm ${getMessageBubbleClass(msg)}`}>
                <p className="break-words text-xs font-bold leading-relaxed">{msg.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="z-10 border-t border-slate-200 bg-white p-3 shadow-lg">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-primary">
              <Plus size={20} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-pink-500">
              <Gift size={20} />
            </Button>
          </div>
          <div className="relative flex-1">
            <Input
              placeholder="اكتب رسالة..."
              className="h-10 rounded-xl border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-primary"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              dir="rtl"
              maxLength={1000}
            />
          </div>
          <Button type="submit" disabled={!message.trim() || isSending} className={`h-10 w-10 rounded-xl p-0 shadow-lg ${message.trim() ? "bg-primary shadow-primary/20" : "bg-slate-100 text-slate-400"}`}>
            {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RoomPage;
