"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  username: string;
  role: string;
  avatar: string;
  countryCode: string;
  avatarFrameUrl?: string;
  giftIconUrl?: string;
  roomId?: string;
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
      status: "online",
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

const MemberList = ({ isSearchOpen = false, setIsSearchOpen }: MemberListProps) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineMember[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const currentMember = useMemo(() => getCurrentMember(), []);

  // ربط WebSocket لجلب المتصلين
  const fetchOnlineUsers = useCallback(() => {
    const socket = getSocket();
    socket.emit("get_online_users", (res: any) => {
      if (res?.success) {
        setOnlineUsers(res.users || []);
        setOnlineCount(res.count || 0);
      }
    });
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      fetchOnlineUsers();
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onOnlineCount = (data: { count: number }) => {
      setOnlineCount(data.count);
      // تحديث القائمة عند تغير العدد
      fetchOnlineUsers();
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("online_count", onOnlineCount);

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
      clearInterval(interval);
    };
  }, [fetchOnlineUsers]);

  // تحويل المتصلين لعناصر العرض
  const members = useMemo(() => {
    const membersList: any[] = [];

    // المستخدم الحالي أولاً
    if (currentMember) {
      membersList.push(currentMember);
    }

    // المستخدمون المتصلون (بدون تكرار الحالي)
    for (const user of onlineUsers) {
      if (currentMember && user.id === currentMember.id) continue;

      membersList.push({
        id: user.id,
        name: user.username,
        role: user.role,
        rank: user.role === "admin" ? 100 : 0,
        color: user.role === "admin" ? "text-red-600" : "text-foreground",
        bg: "bg-muted",
        status: "online",
        room: user.roomId || "",
        country: user.countryCode || "SA",
        points: 0,
        rep: 0,
        avatar: user.avatar || "/pic.png",
        avatarFrameUrl: user.avatarFrameUrl || "",
        giftIconUrl: user.giftIconUrl || "",
        siteBadge: user.role === "admin" ? "مالك الموقع" : "",
        statusMsg: user.role === "guest" ? "( غير مسجل )" : "(عضو جديد)",
      });
    }

    return membersList;
  }, [currentMember, onlineUsers]);

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
        {members.filter(m => m.name.includes(searchQuery)).map((member, index) => (
          <div 
            key={`${member.id}-${index}`} 
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
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background ${member.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
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
        ))}

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
