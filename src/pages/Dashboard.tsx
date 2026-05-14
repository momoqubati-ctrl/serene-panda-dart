"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Users,
  MessageSquare,
  Home,
  LayoutGrid,
  Settings,
  Bell,
  Search,
  Gift,
  Mail,
  Bot,
  Image,
  Film,
  Music,
  Mic,
  Send,
  Smile,
  Plus,
  X,
  ChevronRight,
  MoreVertical,
  ShieldCheck,
  Crown,
  Loader2,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/* ── Sub Components ─────────────────────────────────────────── */
import MemberList from "@/components/chat/MemberList";
import RoomList from "@/components/chat/RoomList";
import WallFeed from "@/components/chat/WallFeed";
import PrivateList from "@/components/chat/PrivateList";
import SettingsPanel from "@/components/chat/SettingsPanel";
import NotificationCenter from "@/components/chat/NotificationCenter";
import BotsList from "@/components/chat/BotsList";
import StoriesViewer from "@/components/chat/StoriesViewer";
import RoomPage from "@/components/chat/RoomPage";
import ProfileModal from "@/components/chat/ProfileModal";
import AdminCP from "@/components/admin/AdminCP";

/* ── Tab Config ─────────────────────────────────────────────── */
const TABS = [
  { id: "members", icon: Users, label: "المتواجدين", badge: "1155" },
  { id: "private", icon: MessageSquare, label: "الخاصة", badge: "3" },
  { id: "rooms", icon: Home, label: "الغرف", badge: "6" },
  { id: "wall", icon: LayoutGrid, label: "الحائط", badge: "12" },
  { id: "stories", icon: Image, label: "القصص", badge: "5" },
  { id: "bots", icon: Bot, label: "البوتات", badge: "" },
  { id: "mail", icon: Mail, label: "البريد", badge: "2" },
  { id: "settings", icon: Settings, label: "الإعدادات", badge: "" },
  { id: "admin", icon: ShieldCheck, label: "لوحة التحكم", badge: "" },
] as const;

/* ── Main Component ─────────────────────────────────────────── */
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("members");
  const [activeRoom, setActiveRoom] = useState<any>({
    id: 1,
    name: "الغرفة العامة",
    members: 1245,
    owner: "مستر سهم",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop",
    locked: false,
    description: "أهلاً بكم في الغرفة العامة للجميع",
  });
  const [showRoom, setShowRoom] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const renderSidebarContent = useCallback(() => {
    switch (activeTab) {
      case "members": return <MemberList />;
      case "rooms": return <RoomList onSelectRoom={(r) => { setActiveRoom(r); setShowRoom(true); setSidebarOpen(false); }} />;
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

  /* Mobile bottom nav items (only main tabs) */
  const bottomNavTabs = ["members", "private", "rooms", "wall", "stories", "settings"];

  return (
    <div className="flex flex-col h-screen bg-[#0a0a14] text-white rtl overflow-hidden font-sans">
      {/* ── Mobile Sidebar Sheet ── */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-[300px] bg-[#12121f] border-l border-white/[0.06] p-0 flex flex-col rtl"
        >
          {/* Sheet Header */}
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="font-bold text-base">{getSidebarTitle()}</h2>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="rounded-xl text-white/70 hover:text-white">
              <X size={20} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">{renderSidebarContent()}</div>
        </SheetContent>
      </Sheet>

      {/* ── Top Bar ── */}
      <header className="h-14 bg-[#12121f] border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-xl text-white/70 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-black">د</span>
            </div>
            <span className="text-sm font-bold hidden sm:inline">دردشة دياد</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex rounded-xl text-white/70 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="bg-white/5 rounded-xl px-3 py-1 flex items-center gap-2 border border-white/[0.06]">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-300 hidden sm:inline">
              50,241 متصل
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Room View (Center) */}
        <div className="flex-1 flex flex-col bg-[#1a1a2e] relative">
          {showRoom && activeRoom ? (
            <RoomPage room={activeRoom} onBack={() => setShowRoom(false)} isEmbedded={true} />
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-slate-500">
              <Home size={64} strokeWidth={1} className="opacity-30" />
              <p className="text-xl font-bold text-slate-400">اختر غرفة للبدء</p>
              <p className="text-sm text-slate-600 text-center max-w-xs">
                استعرض الغرف المتاحة من القائمة الجانبية أو ابدأ محادثة خاصة مع أحد الأعضاء
              </p>
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 bg-[#12121f] border-r border-white/[0.06] flex flex-col shadow-2xl z-20">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="font-bold text-base">{getSidebarTitle()}</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="rounded-xl text-white/50 hover:text-white" onClick={() => setActiveTab("notifications")}>
                <Bell size={18} />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">{renderSidebarContent()}</div>
        </div>
      </div>

      {/* ── Bottom Navigation (Mobile) ── */}
      {isMobile && (
        <nav className="bg-[#12121f] border-t border-white/[0.06] flex justify-around items-center py-1.5 px-2 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.3)]">
          {bottomNavTabs.map((tabId) => {
            const tab = TABS.find((t) => t.id === tabId);
            if (!tab) return null;
            const isActive = activeTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all relative ${
                  isActive ? "text-primary" : "text-white/40"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? "bg-primary/10" : ""
                  }`}
                >
                  {tab.icon({ size: 20, strokeWidth: isActive ? 2.5 : 1.8 })}
                </div>
                <span className="text-[9px] font-bold whitespace-nowrap">{tab.label}</span>
                {tab.badge && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] px-1 rounded-full font-bold border border-[#12121f]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export default Dashboard;