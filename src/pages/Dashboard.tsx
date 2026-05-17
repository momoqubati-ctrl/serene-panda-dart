"use client";

import React, { useCallback, useMemo, useState } from "react";
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
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import MemberList from "@/components/chat/MemberList";
import RoomList from "@/components/chat/RoomList";
import WallFeed from "@/components/chat/WallFeed";
import PrivateList from "@/components/chat/PrivateList";
import SettingsPanel from "@/components/chat/SettingsPanel";
import NotificationCenter from "@/components/chat/NotificationCenter";
import BotsList from "@/components/chat/BotsList";
import StoriesViewer from "@/components/chat/StoriesViewer";
import AdminCP from "@/components/admin/AdminCP";
import AdminDashboard from "@/components/admin/AdminDashboard";
import RoomPage from "@/components/chat/RoomPage";

const TABS = [
  { id: "members", icon: Users, label: "المتواجدون", badge: "" },
  { id: "private", icon: MessageSquare, label: "الخاص", badge: "" },
  { id: "rooms", icon: Home, label: "الغرف", badge: "" },
  { id: "wall", icon: LayoutGrid, label: "الحائط", badge: "" },
  { id: "stories", icon: LucideImage, label: "القصص", badge: "" },
  { id: "bots", icon: Bot, label: "البوتات", badge: "" },
  { id: "mail", icon: Mail, label: "البريد", badge: "" },
  { id: "settings", icon: Settings, label: "الإعدادات", badge: "" },
  { id: "admin", icon: ShieldCheck, label: "لوحة التحكم", badge: "" },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("members");
  const [activeAdminSection, setActiveAdminSection] = useState("overview");
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const renderSidebarContent = useCallback(() => {
    switch (activeTab) {
      case "members":
        return <MemberList isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen} />;
      case "rooms":
        return <RoomList onSelectRoom={(room: any) => { setActiveRoom(room); setSidebarOpen(false); }} />;
      case "private":
        return <PrivateList />;
      case "wall":
        return <WallFeed />;
      case "settings":
        return <SettingsPanel />;
      case "bots":
        return <BotsList />;
      case "notifications":
        return <NotificationCenter />;
      case "stories":
        return <StoriesViewer />;
      case "admin":
        return <AdminCP activeSection={activeAdminSection} onChangeSection={setActiveAdminSection} />;
      default:
        return <MemberList isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen} />;
    }
  }, [activeTab, isSearchOpen, activeAdminSection]);

  const getSidebarTitle = useCallback(() => {
    const tab = TABS.find((item) => item.id === activeTab);
    return tab ? tab.label : "";
  }, [activeTab]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setSidebarOpen(true);
  };

  const bottomNavTabs = ["members", "private", "rooms", "wall", "stories", "settings"];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background font-sans text-foreground rtl">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen} modal={false}>
        <SheetContent side="right" className="bottom-16 top-0 flex h-[calc(100%-64px)] w-[320px] flex-col border-l border-border bg-card p-0 shadow-2xl rtl">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-black text-foreground">{getSidebarTitle()}</h2>
              {activeTab === "members" && (
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={`rounded-md p-1 transition-colors ${isSearchOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                  type="button"
                >
                  <Search size={14} />
                </button>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-7 w-7 rounded-lg">
              <X size={16} />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">{renderSidebarContent()}</div>
        </SheetContent>
      </Sheet>

      <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl bg-muted lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <span className="text-sm font-black text-primary-foreground">د</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black text-foreground">دردشة دياد</h1>
              <p className="text-[9px] font-bold text-muted-foreground">مجتمع عربي مباشر وسريع</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-green-600 dark:text-green-400">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-black">{currentUser?.name || "زائر"}</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl bg-muted text-muted-foreground" onClick={() => handleTabClick("notifications")}>
            <Bell size={18} />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="z-10 hidden w-80 flex-col border-l border-border bg-card shadow-sm lg:flex">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-black text-foreground">{getSidebarTitle()}</h2>
              {activeTab === "members" && (
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={`rounded-md p-1 transition-colors ${isSearchOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                  type="button"
                >
                  <Search size={14} />
                </button>
              )}
            </div>
            <Badge variant="secondary" className="h-4 border-green-500/20 bg-green-500/10 px-1 text-[9px] text-green-600 dark:text-green-400">
              مباشر
            </Badge>
          </div>

          <div className="flex-1 overflow-hidden">{renderSidebarContent()}</div>

          <div className="grid grid-cols-5 gap-1 border-t border-border bg-muted/50 p-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const IconComponent = tab.icon;
              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex flex-col items-center justify-center rounded-xl p-2 transition-all ${
                        isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-background hover:text-foreground"
                      }`}
                      type="button"
                    >
                      <IconComponent size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px] font-bold">
                    {tab.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        <div className="relative flex flex-1 flex-col overflow-hidden bg-muted/30">
          {activeTab === "admin" ? (
             <AdminDashboard section={activeAdminSection} />
          ) : activeRoom ? (
            <RoomPage room={activeRoom} onBack={() => setActiveRoom(null)} isEmbedded />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border border-border bg-card shadow-xl">
                <Home size={64} strokeWidth={1} className="text-primary/20" />
              </div>
              <div className="max-w-sm space-y-2">
                <h2 className="text-2xl font-black text-foreground">مرحباً بك في دياد</h2>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                  اختر غرفة من القائمة لبدء الدردشة المباشرة، أو افتح الحائط لمشاهدة آخر المنشورات.
                </p>
              </div>
              <div className="grid w-full max-w-xs grid-cols-2 gap-3">
                <Button onClick={() => handleTabClick("rooms")} className="h-11 rounded-xl font-bold shadow-lg shadow-primary/20">
                  استعراض الغرف
                </Button>
                <Button onClick={() => handleTabClick("wall")} variant="outline" className="h-11 rounded-xl border-border bg-card font-bold">
                  الحائط العام
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="z-30 flex h-16 items-center justify-around border-t border-border bg-card px-2 py-2 shadow-lg lg:hidden">
        {bottomNavTabs.map((tabId) => {
          const tab = TABS.find((item) => item.id === tabId);
          if (!tab) return null;
          const isActive = activeTab === tabId;
          const IconComponent = tab.icon;
          return (
            <button
              key={tabId}
              onClick={() => handleTabClick(tabId)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 transition-all ${isActive ? "text-primary" : "text-muted-foreground"}`}
              type="button"
            >
              <div className={`rounded-xl p-2 transition-all ${isActive ? "scale-110 bg-primary/10" : "hover:bg-muted"}`}>
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
