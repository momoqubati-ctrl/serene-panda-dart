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

/* ── Tab Config ─────────────────────────────────────────────── */
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

  // Simulate online count fluctuation
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
    <div className="flex flex-col h-screen bg-[#0a0a14] text-white rtl overflow-hidden font-sans">
      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="right"
          className="w-[320px] bg-[#12121f] border-r border-white/[0.06] p-0 flex flex-col rtl"
        >
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-[#1a1a2e]">
            <h2 className="font-black text-sm">{getSidebarTitle()}</h2>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="rounded-xl text-white/70 hover:text-white">
              <X size={20} />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">{renderSidebarContent()}</div>
        </SheetContent>
      </Sheet>

      {/* Top Bar */}
      <header className="h-14 bg-[#12121f] border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0 z-20 shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-xl text-white/70 hover:text-white bg-white/5"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white text-sm font-black">د</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black leading-none">دردشة دياد</h1>
              <p className="text-[9px] text-slate-500 font-bold mt-0.5">المجتمع العربي الأول</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/5 rounded-xl px-3 py-1.5 flex items-center gap-2 border border-white/[0.06]">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-300">
              {onlineCount.toLocaleString('ar-SA')} متصل
            </span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl text-white/50 hover:text-white bg-white/5" onClick={() => setActiveTab("notifications")}>
            <Bell size={18} />
          </Button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar (Right side for RTL) */}
        <div className="hidden lg:flex w-80 bg-[#12121f] border-l border-white/[0.06] flex-col shadow-2xl z-10">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-[#1a1a2e]">
            <h2 className="font-black text-sm">{getSidebarTitle()}</h2>
            <div className="flex items-center gap-1">
               <Badge variant="outline" className="text-[10px] border-white/10 text-slate-400">نشط</Badge>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">{renderSidebarContent()}</div>
        </div>

        {/* Main Content Area (Left side for RTL) */}
        <div className="flex-1 flex flex-col bg-[#1a1a2e] relative overflow-hidden">
          {activeRoom ? (
            <RoomPage room={activeRoom} onBack={() => setActiveRoom(null)} isEmbedded={true} />
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col gap-6 p-8 text-center">
              <div className="relative">
                <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <Home size={64} strokeWidth={1} className="text-primary/40" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
                  <MessageSquare size={24} className="text-white" />
                </div>
              </div>
              <div className="max-w-sm space-y-2">
                <h2 className="text-2xl font-black text-white">مرحباً بك في دياد</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  اختر غرفة من قائمة الغرف للبدء في الدردشة المباشرة، أو تصفح الحائط لمشاهدة آخر المنشورات.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                <Button onClick={() => setActiveTab("rooms")} className="bg-primary hover:bg-primary/90 font-bold rounded-xl h-11">
                  استعراض الغرف
                </Button>
                <Button onClick={() => setActiveTab("wall")} variant="outline" className="border-white/10 hover:bg-white/5 font-bold rounded-xl h-11">
                  الحائط العام
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden bg-[#12121f] border-t border-white/[0.06] flex justify-around items-center py-2 px-2 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
        {bottomNavTabs.map((tabId) => {
          const tab = TABS.find((t) => t.id === tabId);
          if (!tab) return null;
          const isActive = activeTab === tabId;
          const IconComponent = tab.icon;
          return (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-xl transition-all relative ${
                isActive ? "text-primary" : "text-white/40"
              }`}
            >
              <div
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isActive ? "bg-primary/15 scale-110 shadow-lg shadow-primary/10" : "hover:bg-white/5"
                }`}
              >
                <IconComponent size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className={`text-[9px] font-black whitespace-nowrap transition-all ${isActive ? "opacity-100" : "opacity-60"}`}>
                {tab.label}
              </span>
              {tab.badge && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black border-2 border-[#12121f] shadow-sm">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Dashboard;