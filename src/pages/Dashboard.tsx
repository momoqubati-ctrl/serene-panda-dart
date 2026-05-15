"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Users,
  MessageSquare,
  Home,
  LayoutGrid,
  Settings,
  Bell,
  Mail,
  Bot,
  Image as LucideImage,
  X,
  ShieldCheck,
  Menu,
  ChevronLeft,
  Search,
  Plus,
  Mic2,
  Heart,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

/* ── Sub Components ─────────────────────────────────────────── */
import MemberList from "@/components/chat/MemberList";
import RoomList from "@/components/chat/RoomList";
import WallFeed from "@/components/chat/WallFeed";
import PrivateList from "@/components/chat/PrivateList";
import SettingsPanel from "@/components/chat/SettingsPanel";
import NotificationCenter from "@/components/chat/NotificationCenter";
import BotsList from "@/components/chat/BotsList";
import StoriesViewer from "@/components/chat/StoriesViewer";
import AdminCP from "@/components/admin/AdminCP";
import RoomPage from "@/components/chat/RoomPage";

const TABS = [
  { id: "members", icon: Users, label: "المتواجدين", badge: "1155" },
  { id: "private", icon: MessageSquare, label: "الخاصة", badge: "3" },
  { id: "rooms", icon: Home, label: "الغرف", badge: "6" },
  { id: "wall", icon: LayoutGrid, label: "الحائط", badge: "12" },
  { id: "stories", icon: LucideImage, label: "القصص", badge: "5" },
  { id: "bots", icon: Bot, label: "البوتات", badge: "" },
  { id: "mail", icon: Mail, label: "البريد", badge: "2" },
  { id: "settings", icon: Settings, label: "الإعدادات", badge: "" },
  { id: "admin", icon: ShieldCheck, label: "لوحة التحكم", badge: "" },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("members");
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(5847);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderSidebarContent = useCallback(() => {
    switch (activeTab) {
      case "members": return <MemberList />;
      case "rooms": return <RoomList onSelectRoom={(r: any) => { setActiveRoom(r); setSidebarOpen(false); }} />;
      case "private": return <PrivateList />;
      case "wall": return <WallFeed />;
      case "settings": return <SettingsPanel />;
      case "bots": return <BotsList />;
      case "notifications": return <NotificationCenter />;
      case "stories": return <StoriesViewer />;
      case "admin": return <AdminCP />;
      default: return <MemberList />;
    }
  }, [activeTab]);

  const getSidebarTitle = useCallback(() => {
    const tab = TABS.find((t) => t.id === activeTab);
    return tab ? tab.label : "";
  }, [activeTab]);

  const bottomNavTabs = ["members", "private", "rooms", "wall", "stories", "settings"];

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 rtl overflow-hidden font-sans">
      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="right" className="w-[320px] bg-white border-l border-slate-200 p-0 flex flex-col rtl">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-black text-sm text-slate-800">{getSidebarTitle()}</h2>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="rounded-xl">
              <X size={20} />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">{renderSidebarContent()}</div>
        </SheetContent>
      </Sheet>

      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden rounded-xl bg-slate-50" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white text-sm font-black">د</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black text-slate-800">دردشة دياد</h1>
              <p className="text-[9px] text-slate-400 font-bold">المجتمع العربي الأول</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-green-50 text-green-600 rounded-xl px-3 py-1.5 flex items-center gap-2 border border-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black">{onlineCount.toLocaleString('ar-SA')} متصل</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50 text-slate-500" onClick={() => setActiveTab("notifications")}>
            <Bell size={18} />
          </Button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-80 bg-white border-l border-slate-200 flex-col shadow-sm z-10">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-black text-sm text-slate-800">{getSidebarTitle()}</h2>
            <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-600 border-green-100">نشط الآن</Badge>
          </div>
          <div className="flex-1 overflow-hidden">{renderSidebarContent()}</div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-slate-100/50 relative overflow-hidden">
          {activeRoom ? (
            <RoomPage room={activeRoom} onBack={() => setActiveRoom(null)} isEmbedded={true} />
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col gap-6 p-8 text-center">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-100">
                <Home size={64} strokeWidth={1} className="text-primary/20" />
              </div>
              <div className="max-w-sm space-y-2">
                <h2 className="text-2xl font-black text-slate-800">مرحباً بك في دياد</h2>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  اختر غرفة من قائمة الغرف للبدء في الدردشة المباشرة، أو تصفح الحائط لمشاهدة آخر المنشورات.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                <Button onClick={() => setActiveTab("rooms")} className="font-bold rounded-xl h-11 shadow-lg shadow-primary/20">استعراض الغرف</Button>
                <Button onClick={() => setActiveTab("wall")} variant="outline" className="bg-white border-slate-200 font-bold rounded-xl h-11">الحائط العام</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="lg:hidden bg-white border-t border-slate-200 flex justify-around items-center py-2 px-2 z-30 shadow-lg">
        {bottomNavTabs.map((tabId) => {
          const tab = TABS.find((t) => t.id === tabId);
          if (!tab) return null;
          const isActive = activeTab === tabId;
          const IconComponent = tab.icon;
          return (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-xl transition-all ${isActive ? "text-primary" : "text-slate-400"}`}
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? "bg-primary/10 scale-110" : "hover:bg-slate-50"}`}>
                <IconComponent size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className="text-[9px] font-black">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Dashboard;