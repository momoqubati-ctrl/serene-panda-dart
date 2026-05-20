"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, X, Wifi, WifiOff } from 'lucide-react';
import ProfileModal from './ProfileModal';
import { Input } from "@/components/ui/input";
import StoriesBar from './StoriesBar';
import { getCountryFlagSrc, normalizeCountryCode } from "@/lib/countries";
import { getSocket } from "@/lib/socket";

interface MemberListProps {
  isSearchOpen?: boolean;
  setIsSearchOpen?: (open: boolean) => void;
}

type OnlineMember = {
  id: string;
  socketId?: string;
  username: string;
  role: string;
  avatar: string;
  countryCode: string;
  avatarFrameUrl?: string;
  giftIconUrl?: string;
  roomId?: string;
  status?: string;
  idreg?: string;
  siteBadge?: string;
};

const getPresenceKey = (member: { id?: string; socketId?: string; username?: string; name?: string; role?: string }) => {
  const id = String(member.id || "").trim();
  if (id && id !== "0") return `id:${id}`;
  if (member.socketId) return `socket:${member.socketId}`;
  const name = String(member.username || member.name || "").trim().toLowerCase();
  if (name && member.role !== "guest") return `username:${name}`;
  return `guest:${name || "anonymous"}`;
};

// ===== Status Utilities =====
type PresenceStatus = "online" | "idle" | "busy" | "away";

const STATUS_CONFIG: Record<PresenceStatus, { color: string; pulseColor: string; label: string }> = {
  online: { color: "bg-green-500", pulseColor: "bg-green-400", label: "متصل" },
  idle:   { color: "bg-amber-400", pulseColor: "bg-amber-300", label: "بعيد مؤقتاً" },
  busy:   { color: "bg-orange-500", pulseColor: "bg-orange-400", label: "مشغول" },
  away:   { color: "bg-purple-500", pulseColor: "bg-purple-400", label: "غير متواجد" },
};

const getStatusConfig = (status?: string) => {
  if (status && status in STATUS_CONFIG) return STATUS_CONFIG[status as PresenceStatus];
  return STATUS_CONFIG.online;
};

const getMemberIdentity = (member: { id?: string; username?: string; name?: string; role?: string }) => {
  const id = String(member.id || "").trim();
  if (id && id !== "0") return `id:${id}`;

  const name = String(member.username || member.name || "").trim().toLowerCase();
  if (name && member.role !== "guest") return `username:${name}`;

  return `guest:${name}`;
};

const getCurrentMember = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    const name = typeof user.name === "string" && user.name.trim() ? user.name : "زائر";
    const role = user.role === "admin" ? "admin" : user.role === "guest" ? "guest" : "member";
    const profileMsg =
      typeof user.profileMsg === "string" && user.profileMsg.trim()
        ? user.profileMsg
        : role === "guest"
          ? "( غير مسجل )"
          : "(عضو جديد)";

    return {
      id: user.id || "0",
      idreg: typeof user.idreg === "string" && user.idreg.trim() ? user.idreg : role === "guest" ? "#300" : "#101",
      name,
      role,
      rank: role === "admin" ? 100 : 0,
      color: role === "admin" ? "text-red-600" : "text-foreground",
      bg: "bg-blue-50",
      status: "online" as string,
      room: "الغرفة العامة",
      country: normalizeCountryCode(user.countryCode),
      points: Number(user.evaluation) || 0,
      rep: Number(user.rep) || 0,
      coins: Number(user.coins) || 0,
      giftsReceivedCount: Number(user.giftsReceivedCount) || 0,
      avatar: typeof user.avatar === "string" && user.avatar.trim() ? user.avatar : "/pic.png",
      profileCover:
        typeof user.profileBannerUrl === "string" && user.profileBannerUrl.trim()
          ? user.profileBannerUrl
          : typeof user.profileCover === "string" && user.profileCover.trim()
            ? user.profileCover
            : "/pich.png",
      profileThemeId: typeof user.profileThemeId === "string" ? user.profileThemeId : "",
      avatarFrameUrl: typeof user.avatarFrameUrl === "string" ? user.avatarFrameUrl : "",
      giftIconUrl:
        typeof user.giftIconUrl === "string" && user.giftIconUrl.trim()
          ? user.giftIconUrl
          : typeof user.giftIcon === "string"
            ? user.giftIcon
            : "",
      profileIconUrl: typeof user.profileIconUrl === "string" ? user.profileIconUrl : "",
      nameGradient: typeof user.nameGradient === "string" ? user.nameGradient : "",
      nameEffectId: typeof user.nameEffectId === "string" ? user.nameEffectId : "",
      messageBubbleStyle: typeof user.messageBubbleStyle === "string" ? user.messageBubbleStyle : "default",
      profileAccentColor: typeof user.profileAccentColor === "string" ? user.profileAccentColor : "#2563EB",
      power: typeof user.power === "string" ? user.power : "",
      siteBadge: typeof user.siteBadge === "string" && user.siteBadge.trim() ? user.siteBadge : role === "admin" ? "مالك الموقع" : "",
      statusMsg: profileMsg,
      isLogin: typeof user.isLogin === "string" ? user.isLogin : role === "guest" ? "زائر" : "عضو",
    };
  } catch {
    return null;
  }
};

const IDLE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

const MemberList = ({ isSearchOpen = false, setIsSearchOpen }: MemberListProps) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineMember[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [myStatus, setMyStatus] = useState<PresenceStatus>("online");
  const myStatusRef = useRef<PresenceStatus>("online");
  const [userStatuses, setUserStatuses] = useState<Map<string, string>>(new Map());
  const [userCountries, setUserCountries] = useState<Map<string, string>>(new Map());

  const mergeOnlineUser = (incoming: OnlineMember) => {
    const identity = getPresenceKey(incoming);
    setOnlineUsers((prev) => {
      const next = prev.map((user) => getPresenceKey(user) === identity ? { ...user, ...incoming } : user);
      if (!next.some((user) => getPresenceKey(user) === identity)) {
        next.push(incoming);
      }
      return next;
    });
  };

  const removeOnlineUser = (target: { id?: string; socketId?: string; username?: string; name?: string; role?: string }) => {
    const identity = getPresenceKey(target);
    setOnlineUsers((prev) => prev.filter((user) => getPresenceKey(user) !== identity));
    setUserStatuses((prev) => {
      const next = new Map(prev);
      next.delete(identity);
      return next;
    });
    setUserCountries((prev) => {
      const next = new Map(prev);
      next.delete(identity);
      return next;
    });
  };

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualStatusRef = useRef<string | null>(null);

  const currentMember = useMemo(() => getCurrentMember(), []);

  // ===== Idle Detection for Current User =====
  useEffect(() => {
    // Load manual status from sessionStorage (persists only for the session)
    const storedManual = sessionStorage.getItem("manualStatus");
    if (storedManual === "busy" || storedManual === "away") {
      manualStatusRef.current = storedManual;
      setMyStatus(storedManual as PresenceStatus);
      myStatusRef.current = storedManual as PresenceStatus;
      // Emit to server
      const socket = getSocket();
      socket.emit("status_update", { status: storedManual });
      return; // Don't set up idle detection when manual status is active
    }

    const resetIdleTimer = () => {
      // If manual status is set, don't auto-change
      if (manualStatusRef.current) return;

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      // Set to online on activity
      setMyStatus((prev) => {
        if (prev !== "online" && !manualStatusRef.current) {
          const socket = getSocket();
          socket.emit("status_update", { status: "online" });
          myStatusRef.current = "online";
          return "online";
        }
        return prev;
      });

      // Set idle after 2 minutes
      idleTimerRef.current = setTimeout(() => {
        if (manualStatusRef.current) return;
        setMyStatus("idle");
        myStatusRef.current = "idle";
        const socket = getSocket();
        socket.emit("status_update", { status: "idle" });
      }, IDLE_TIMEOUT_MS);
    };

    const activityEvents = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetIdleTimer));

    // Start initial timer
    resetIdleTimer();

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // ===== WebSocket Online Users =====
  const fetchOnlineUsers = useCallback(() => {
    const socket = getSocket();
    socket.emit("get_online_users", (res: any) => {
      if (res?.success) {
        setOnlineUsers(res.users || []);
        setOnlineCount(res.count || 0);
        // Update statuses and countries from fetched data
        const newStatuses = new Map<string, string>();
        const newCountries = new Map<string, string>();
        for (const u of res.users || []) {
          const key = getPresenceKey(u);
          if (!key) continue;
          newStatuses.set(key, u.status || "online");
          newCountries.set(key, u.countryCode || "SA");
        }
        setUserStatuses(newStatuses);
        setUserCountries(newCountries);
      }
    });
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      fetchOnlineUsers();
      socket.emit("status_update", { status: manualStatusRef.current || myStatusRef.current });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onOnlineCount = (data: { count: number }) => {
      setOnlineCount(data.count);
      fetchOnlineUsers();
    };

    // Listen for real-time status updates from other users
    const onUserStatusUpdate = (data: any) => {
      if (!data?.userId && !data?.socketId) return;
      const identity = getPresenceKey({ id: data.userId, socketId: data.socketId, username: data.username, role: data.role });
      setUserStatuses((prev) => {
        const next = new Map(prev);
        next.set(identity, data.status || "online");
        return next;
      });
      mergeOnlineUser({
        id: data.userId || "0",
        socketId: data.socketId,
        username: data.username || "",
        role: data.role || "guest",
        avatar: data.avatar || "/pic.png",
        countryCode: data.countryCode || "SA",
        roomId: data.roomId || "",
        status: data.status || "online",
        idreg: data.idreg,
        siteBadge: data.siteBadge,
      });
    };

    const onUserCountryUpdate = (data: { userId: string; socketId?: string; username?: string; role?: string; countryCode: string }) => {
      if (!data?.userId && !data?.socketId) return;
      const identity = getPresenceKey({ id: data.userId, socketId: data.socketId, username: data.username, role: data.role });
      setUserCountries((prev) => {
        const next = new Map(prev);
        next.set(identity, data.countryCode);
        return next;
      });
      mergeOnlineUser({
        id: data.userId || "0",
        socketId: data.socketId,
        username: data.username || "",
        role: data.role || "guest",
        avatar: "/pic.png",
        countryCode: data.countryCode,
        roomId: data.roomId || "",
        status: "online",
      });
    };

    const onUserConnected = (data: any) => {
      if (data?.userId || data?.socketId || data?.username) {
        mergeOnlineUser({
          id: data.userId || "0",
          socketId: data.socketId,
          username: data.username || "زائر",
          role: data.role || "guest",
          avatar: data.avatar || "/pic.png",
          countryCode: data.countryCode || "SA",
          avatarFrameUrl: data.avatarFrameUrl || "",
          giftIconUrl: data.giftIconUrl || "",
          roomId: data.roomId || "",
          status: data.status || "online",
          idreg: data.idreg,
          siteBadge: data.siteBadge,
        });
        const identity = getPresenceKey({ id: data.userId, socketId: data.socketId, username: data.username, role: data.role });
        setUserStatuses((prev) => {
          const next = new Map(prev);
          next.set(identity, data.status || "online");
          return next;
        });
        if (typeof data.count === "number") {
          setOnlineCount(data.count);
        }
      } else {
        fetchOnlineUsers();
      }
    };

    const onUserDisconnected = (data: any) => {
      if (data?.userId || data?.socketId || data?.username) {
        removeOnlineUser({ id: data.userId, socketId: data.socketId, username: data.username, role: data.role });
        if (typeof data.count === "number") {
          setOnlineCount(data.count);
        }
      } else {
        fetchOnlineUsers();
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("online_count", onOnlineCount);
    socket.on("user_status_update", onUserStatusUpdate);
    socket.on("user_country_update", onUserCountryUpdate);
    socket.on("user_connected", onUserConnected);
    socket.on("user_disconnected", onUserDisconnected);
    socket.on("room_count_update", fetchOnlineUsers);

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    // تحديث دوري كل 10 ثوانٍ
    const interval = setInterval(fetchOnlineUsers, 10000);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("online_count", onOnlineCount);
      socket.off("user_status_update", onUserStatusUpdate);
      socket.off("user_country_update", onUserCountryUpdate);
      socket.off("user_connected", onUserConnected);
      socket.off("user_disconnected", onUserDisconnected);
      socket.off("room_count_update", fetchOnlineUsers);
      clearInterval(interval);
    };
  }, [fetchOnlineUsers]);

  // ===== Build members list =====
  const members = useMemo(() => {
    const membersList: any[] = [];
    const seen = new Set<string>();

    // المستخدم الحالي أولاً
    if (currentMember) {
      const resolvedCountry = userCountries.get(currentMember.id) || currentMember.country;
      membersList.push({ ...currentMember, status: myStatus, country: resolvedCountry });
      seen.add(getMemberIdentity(currentMember));
    }

    // المستخدمون المتصلون (بدون تكرار الحالي)
    for (const user of onlineUsers) {
      const memberIdentity = getMemberIdentity(user);
      if (seen.has(memberIdentity)) continue;
      seen.add(memberIdentity);

      const presenceIdentity = getPresenceKey(user);
      const resolvedStatus = userStatuses.get(presenceIdentity) || user.status || "online";
      const resolvedCountry = userCountries.get(presenceIdentity) || user.countryCode || "SA";

      membersList.push({
        id: user.id,
        name: user.username,
        role: user.role,
        rank: user.role === "admin" ? 100 : 0,
        color: user.role === "admin" ? "text-red-600" : "text-foreground",
        bg: "bg-muted",
        status: resolvedStatus,
        room: user.roomId || "",
        country: resolvedCountry,
        points: 0,
        rep: 0,
        avatar: user.avatar || "/pic.png",
        avatarFrameUrl: user.avatarFrameUrl || "",
        giftIconUrl: user.giftIconUrl || "",
        idreg: user.idreg,
        siteBadge: user.siteBadge || (user.role === "admin" ? "مالك الموقع" : ""),
        statusMsg: user.role === "guest" ? "( غير مسجل )" : "(عضو جديد)",
      });
    }

    return membersList;
  }, [currentMember, onlineUsers, myStatus, userStatuses]);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Stories Bar */}
      <StoriesBar />

      {/* Online Counter */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <Wifi size={12} className="text-green-500" />
          ) : (
            <WifiOff size={12} className="text-red-500" />
          )}
          <span className="text-[10px] font-bold text-muted-foreground">
            {isConnected ? `${onlineCount} متصل الآن` : "غير متصل بالسيرفر"}
          </span>
        </div>
        <Badge variant="secondary" className="h-4 px-1 text-[9px] font-black bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
          مباشر
        </Badge>
      </div>

      {/* Search Header */}
      {isSearchOpen && (
        <div className="p-3 bg-slate-800 flex items-center gap-2 animate-in slide-in-from-top duration-200 [direction:ltr]">
          <div className="flex-1 relative">
            <Input 
              placeholder="Search .." 
              className="h-9 bg-card/10 border-none text-white placeholder:text-white/50 pl-8 rounded-md text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <Search className="absolute left-2 top-2.5 text-white/50" size={14} />
          </div>
          <button 
            onClick={() => setIsSearchOpen?.(false)}
            className="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Members List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {members.filter(m => m.name.includes(searchQuery)).map((member, index) => {
          const statusCfg = getStatusConfig(member.status);
          return (
          <div 
            key={`${getMemberIdentity(member)}-${member.id || index}`} 
            onClick={() => setSelectedUser(member)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-all cursor-pointer border-b border-border/50 [direction:ltr]"
          >
            <div className="relative shrink-0">
              <div
                className="relative grid h-12 w-12 place-items-center rounded-full"
                style={member.avatarFrameUrl ? { backgroundImage: `url(${member.avatarFrameUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
              >
                <Avatar className="w-12 h-12 rounded-full border-2 border-background shadow-sm">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
              </div>
              {/* Status Dot with pulse animation */}
              <span
                className="absolute bottom-0 right-0 flex items-center justify-center w-4 h-4"
                title={statusCfg.label}
                aria-label={statusCfg.label}
              >
                {member.status === "online" && (
                  <span className={`absolute inline-flex h-full w-full rounded-full ${statusCfg.pulseColor} opacity-50 animate-ping`} />
                )}
                <span className={`relative inline-flex w-3.5 h-3.5 rounded-full border-2 border-background ${statusCfg.color} transition-colors duration-300`} />
              </span>
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`font-black text-xs truncate ${member.color === 'text-foreground' ? 'text-foreground' : member.color}`} style={{ direction: 'rtl' }}>{member.name}</span>
                  {member.siteBadge && (
                    <Badge className="h-3.5 text-[8px] px-1 bg-blue-600 text-white border-none rounded-sm font-black">
                      {member.siteBadge}
                    </Badge>
                  )}
                  {member.giftIconUrl && (
                    <img src={member.giftIconUrl} alt="gift" className="h-4 w-4 rounded object-cover" />
                  )}
                  {/* Status label badge */}
                  {member.status && member.status !== "online" && (
                    <Badge className={`h-3.5 text-[7px] px-1 border-none rounded-sm font-bold text-white ${statusCfg.color}`}>
                      {statusCfg.label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                   <img src={getCountryFlagSrc(member.country)} alt={member.country} className="h-3 w-4 rounded-sm object-cover" />
                   <span className="text-[9px] text-muted-foreground font-bold">{member.idreg || `#${index + 300}`}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground truncate font-medium" style={{ direction: 'rtl' }}>{member.statusMsg}</p>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-bold">
                  <span>@{member.name.replace(' ', '')}</span>
                </div>
              </div>
            </div>
          </div>
        );
        })}

        {members.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <WifiOff size={32} className="mb-2 opacity-50" />
            <p className="text-xs font-bold">لا يوجد متصلون حالياً</p>
          </div>
        )}
      </div>

      <ProfileModal 
        user={selectedUser} 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
      />
    </div>
  );
};

export default MemberList;
