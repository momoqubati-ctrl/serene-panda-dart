"use client";

import React, { useState } from "react";
import {
  Users, MessageSquare, Home, LayoutGrid, Settings, Bell, Bot, 
  Image as LucideImage, X, ShieldCheck, Menu, Search, Activity, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import MemberList from "@/components/chat/MemberList";
import RoomList from "@/components/chat/RoomList";
import WallFeed from "@/components/chat/WallFeed";
import SettingsPanel from "@/components/chat/SettingsPanel";
import PresenceEngine from "@/components/realtime/PresenceEngine";
import ActivityFeed from "@/components/realtime/ActivityFeed";
import RoomPage from "@/components/chat/RoomPage";

const TABS = [
  { id: "members", icon: Users, label: "المتواجدون" },
  { id: "activity", icon: Activity, label: "النشاطات" },
  { id: "rooms", icon: Home, label: "الغرف" },
  { id: "wall", icon: LayoutGrid, label: "الحائط" },
  { id: "settings", icon: Settings, label: "الإعدادات" },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("members");
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderSidebarContent = () => {
    switch (activeTab) {
      case "members": return <MemberList />;
      case "activity": return <ActivityFeed />;
      case "rooms": return <RoomList onSelectRoom={(room: any) => { setActiveRoom(room); setSidebarOpen(false); }} />;
      case "wall": return <WallFeed />;
      case "settings": return <SettingsPanel />;
      default: return <MemberList />;
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-foreground rtl">
      <PresenceEngine />
      
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="right" className="p-0 w-80 border-l border-slate-200 dark:border-slate-800">
          <SheetTitle className="sr-only">القائمة الجانبية</SheetTitle>
          <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {TABS.find(t => t.id === activeTab)?.label}
              </h2>
              <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black">REALTIME</Badge>
            </div>

            <div className="flex-1 overflow-hidden">{renderSidebarContent()}</div>
          </div>
        </SheetContent>
      </Sheet>

      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <Zap className="text-white" size={20} fill="currentColor" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-black tracking-tight">DIAD ENGINE</h1>
              <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Realtime Identity Platform</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-2 text-green-600">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase">Live Engine Active</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="z-10 hidden w-80 flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 lg:flex">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black">REALTIME</Badge>
          </div>

          <div className="flex-1 overflow-hidden">{renderSidebarContent()}</div>

          <div className="grid grid-cols-5 gap-1 border-t border-slate-100 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center rounded-xl p-2.5 transition-all ${
                    isActive ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {activeRoom ? (
            <RoomPage room={activeRoom} onBack={() => setActiveRoom(null)} isEmbedded />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px]">
              <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6 text-right">
                  <h2 className="text-4xl font-black text-slate-800 dark:text-white leading-tight">
                    مرحباً بك في <span className="text-primary">مستقبل</span> التواصل الاجتماعي
                  </h2>
                  <p className="text-lg text-slate-500 font-medium">
                    منصة ذكية تفهم تفاعلاتك، تبني هويتك، وتصلك بالمجتمعات التي تهمك لحظة بلحظة.
                  </p>
                  <div className="flex gap-4 justify-end">
                    <Button onClick={() => setActiveTab('rooms')} size="lg" className="rounded-2xl px-8 font-black shadow-xl shadow-primary/20 h-14 text-lg">
                      استكشف الغرف
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-2xl px-8 font-black h-14 text-lg border-2">
                      هويتي الرقمية
                    </Button>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-[40px] p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <Activity size={18} className="text-primary" />
                      آخر النشاطات العالمية
                    </h3>
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  </div>
                  <div className="h-[400px] overflow-hidden">
                    <ActivityFeed />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <nav className="z-30 flex h-20 items-center justify-around border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pb-4 lg:hidden">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSidebarOpen(true);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${isActive ? "text-primary scale-110" : "text-slate-400"}`}
            >
              <div className={`p-3 rounded-2xl ${isActive ? "bg-primary/10" : ""}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Dashboard;