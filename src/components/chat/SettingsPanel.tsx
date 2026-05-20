"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { getSocket } from "@/lib/socket";
import { 
  User, 
  Palette, 
  ShieldCheck, 
  Coins, 
  LogOut, 
  ChevronLeft, 
  Bell, 
  Lock, 
  Eye,
  Smartphone,
  Moon,
  Sun,
  Circle
} from 'lucide-react';

type PresenceStatus = "online" | "busy" | "away";

const MANUAL_STATUSES: { id: PresenceStatus; label: string; color: string; dotColor: string; description: string }[] = [
  { id: "online", label: "تلقائي", color: "bg-green-500/10 text-green-600 border-green-500/30", dotColor: "bg-green-500", description: "الحالة التلقائية حسب نشاطك" },
  { id: "busy",   label: "مشغول", color: "bg-orange-500/10 text-orange-600 border-orange-500/30", dotColor: "bg-orange-500", description: "يظهر للجميع أنك مشغول" },
  { id: "away",   label: "غير متواجد", color: "bg-purple-500/10 text-purple-600 border-purple-500/30", dotColor: "bg-purple-500", description: "يظهر للجميع أنك غير متواجد" },
];

const SettingsPanel = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Load current manual status from sessionStorage
  const [activeStatus, setActiveStatus] = useState<PresenceStatus>(() => {
    const stored = sessionStorage.getItem("manualStatus");
    if (stored === "busy" || stored === "away") return stored;
    return "online";
  });

  const currentUser = React.useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user) return null;
      return {
        name: typeof user.name === "string" && user.name.trim() ? user.name : "زائر",
        avatar: typeof user.avatar === "string" && user.avatar.trim() ? user.avatar : "/pic.png",
        banner:
          typeof user.profileBannerUrl === "string" && user.profileBannerUrl.trim()
            ? user.profileBannerUrl
            : typeof user.profileCover === "string" && user.profileCover.trim()
              ? user.profileCover
              : "/pich.png",
        profileMsg: typeof user.profileMsg === "string" && user.profileMsg.trim() ? user.profileMsg : "( غير مسجل )",
        profileThemeId: typeof user.profileThemeId === "string" && user.profileThemeId.trim() ? user.profileThemeId : "افتراضي",
        giftIconUrl: typeof user.giftIconUrl === "string" && user.giftIconUrl.trim() ? user.giftIconUrl : "",
        coins: Number(user.coins) || 0,
        evaluation: Number(user.evaluation) || 0,
      };
    } catch {
      return null;
    }
  }, []);

  const handleStatusChange = (status: PresenceStatus) => {
    setActiveStatus(status);
    const socket = getSocket();

    if (status === "online") {
      // Clear manual status → revert to automatic idle detection
      sessionStorage.removeItem("manualStatus");
      socket.emit("status_update", { status: "online" });
    } else {
      // Set manual status (busy or away) → persists for the session
      sessionStorage.setItem("manualStatus", status);
      socket.emit("status_update", { status });
    }
  };

  const handleLogout = () => {
    // Clear manual status on logout so next login starts as "online"
    sessionStorage.removeItem("manualStatus");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  return (
    <div className="p-4 space-y-4 pb-24 overflow-y-auto h-full">
      {/* Profile Summary */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-blue-600 text-white">
        <CardContent
          className="bg-cover bg-center p-6"
          style={currentUser?.banner ? { backgroundImage: `linear-gradient(90deg, rgba(37,99,235,.82), rgba(29,78,216,.82)), url(${currentUser.banner})` } : undefined}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-white/20">
                <AvatarImage src={currentUser?.avatar || "/pic.png"} />
                <AvatarFallback>{currentUser?.name?.[0] || "ز"}</AvatarFallback>
              </Avatar>
              {/* Status dot on avatar */}
              <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white/40 ${
                activeStatus === "busy" ? "bg-orange-500" : activeStatus === "away" ? "bg-purple-500" : "bg-green-500"
              } transition-colors duration-300`} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{currentUser?.name || "زائر"}</h3>
              <p className="text-white/80 text-sm">{currentUser?.profileMsg || "( غير مسجل )"} • {currentUser?.evaluation || 0} نقطة</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="bg-card/20 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <Coins size={12} />
                  <span>{currentUser?.coins || 0} كوين</span>
                </div>
                <div className="bg-card/20 px-3 py-1 rounded-full text-[10px] font-bold">
                  {currentUser?.profileThemeId || "افتراضي"}
                </div>
                {currentUser?.giftIconUrl && <img src={currentUser.giftIconUrl} alt="gift" className="h-6 w-6 rounded object-cover" />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Presence Status Selector ===== */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-muted-foreground px-2 uppercase tracking-wider">حالة الاتصال</h4>
        <div className="grid grid-cols-3 gap-2">
          {MANUAL_STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleStatusChange(s.id)}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 ${
                activeStatus === s.id
                  ? `${s.color} border-current shadow-sm scale-[1.02]`
                  : "bg-card dark:bg-card/5 border-transparent hover:bg-muted dark:hover:bg-card/10 text-muted-foreground"
              }`}
            >
              <span className={`w-4 h-4 rounded-full ${s.dotColor} ${
                activeStatus === s.id ? "ring-2 ring-offset-1 ring-offset-background" : ""
              } transition-all duration-200`}
                style={activeStatus === s.id ? { ringColor: s.dotColor } : undefined}
              />
              <span className="text-xs font-bold">{s.label}</span>
              {activeStatus === s.id && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-current rounded-full flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none" className="text-white">
                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground px-2 text-center font-medium" style={{ direction: 'rtl' }}>
          {activeStatus === "online" 
            ? "الحالة تلقائية: أخضر عند النشاط، أصفر بعد دقيقتين من عدم التفاعل"
            : activeStatus === "busy" 
              ? "حالتك: مشغول — ستبقى حتى تغيّرها أو تسجل الخروج"
              : "حالتك: غير متواجد — ستبقى حتى تغيّرها أو تسجل الخروج"
          }
        </p>
      </div>

      {/* Theme Toggle */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-muted-foreground px-2 uppercase tracking-wider">المظهر</h4>
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center justify-between p-4 bg-card dark:bg-card/5 rounded-2xl shadow-sm hover:bg-muted dark:hover:bg-card/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted dark:bg-card/5 rounded-xl group-hover:bg-card dark:group-hover:bg-card/10 transition-colors">
              {theme === "dark" ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-blue-500" />}
            </div>
            <span className="font-bold text-sm text-foreground dark:text-slate-200">
              {theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground">{theme === "dark" ? "Light" : "Dark"}</span>
            <ChevronLeft size={18} className="text-slate-300" />
          </div>
        </button>
      </div>

      {/* Settings Groups */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-muted-foreground px-2 uppercase tracking-wider">الحساب والخصوصية</h4>
        <SettingsItem icon={<User size={20} className="text-blue-500" />} label="تعديل الملف الشخصي" />
        <SettingsItem icon={<Palette size={20} className="text-purple-500" />} label="الألوان والثيمات" />
        <SettingsItem icon={<ShieldCheck size={20} className="text-green-500" />} label="إعدادات الخصوصية" />
        <SettingsItem icon={<Bell size={20} className="text-amber-500" />} label="التنبيهات والإشعارات" />
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-muted-foreground px-2 uppercase tracking-wider">الخدمات والعملات</h4>
        <SettingsItem icon={<Coins size={20} className="text-yellow-500" />} label="متجر الكوين والهدايا" />
        <SettingsItem icon={<Smartphone size={20} className="text-indigo-500" />} label="طلب شحن رصيد" />
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-muted-foreground px-2 uppercase tracking-wider">أخرى</h4>
        <SettingsItem icon={<Lock size={20} className="text-muted-foreground" />} label="تغيير كلمة المرور" />
        <SettingsItem icon={<LogOut size={20} className="text-red-500" />} label="تسجيل الخروج" danger onClick={handleLogout} />
      </div>

      <div className="text-center pt-4">
        <p className="text-[10px] text-muted-foreground font-medium">إصدار التطبيق 1.0.0</p>
      </div>
    </div>
  );
};

const SettingsItem = ({ icon, label, danger, onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 bg-card dark:bg-card/5 rounded-2xl shadow-sm hover:bg-muted dark:hover:bg-card/10 transition-colors group"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 bg-muted dark:bg-card/5 rounded-xl group-hover:bg-card dark:group-hover:bg-card/10 transition-colors">
        {icon}
      </div>
      <span className={`font-bold text-sm ${danger ? 'text-red-500' : 'text-foreground dark:text-slate-200'}`}>{label}</span>
    </div>
    <ChevronLeft size={18} className="text-slate-300" />
  </button>
);

export default SettingsPanel;
