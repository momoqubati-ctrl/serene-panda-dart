"use client";

import React, { useState } from 'react';
import { Users, MessageSquare, Home, LayoutGrid, Settings, Bell, Search, Gift } from 'lucide-react';
import MemberList from '@/components/chat/MemberList';
import RoomList from '@/components/chat/RoomList';
import WallFeed from '@/components/chat/WallFeed';
import PrivateList from '@/components/chat/PrivateList';
import SettingsPanel from '@/components/chat/SettingsPanel';
import StoriesBar from '@/components/chat/StoriesBar';
import GiftStore from '@/components/chat/GiftStore';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('members');

  const renderContent = () => {
    switch (activeTab) {
      case 'members': return <MemberList />;
      case 'rooms': return <RoomList />;
      case 'wall': return <WallFeed />;
      case 'private': return <PrivateList />;
      case 'settings': return <SettingsPanel />;
      case 'store': return <GiftStore />;
      default: return <MemberList />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'members': return 'المتواجدين';
      case 'rooms': return 'الغرف';
      case 'wall': return 'الحائط';
      case 'private': return 'الخاصة';
      case 'settings': return 'الإعدادات';
      case 'store': return 'متجر الهدايا';
      default: return 'المتواجدين';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 rtl">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">D</div>
          <h2 className="font-bold text-lg text-slate-800">{getTitle()}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 rounded-full relative">
            <Bell size={22} className="text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full">
            <Search size={22} className="text-slate-600" />
          </button>
        </div>
      </header>

      {/* Stories Bar (Only for Wall or Members) */}
      {(activeTab === 'wall' || activeTab === 'members') && <StoriesBar />}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t fixed bottom-0 w-full flex justify-around items-center py-2 px-1 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <NavButton 
          active={activeTab === 'members'} 
          onClick={() => setActiveTab('members')} 
          icon={<Users size={24} />} 
          label="المتواجدين" 
          badge="1.2k"
        />
        <NavButton 
          active={activeTab === 'private'} 
          onClick={() => setActiveTab('private')} 
          icon={<MessageSquare size={24} />} 
          label="الخاصة" 
          badge="5"
        />
        <NavButton 
          active={activeTab === 'rooms'} 
          onClick={() => setActiveTab('rooms')} 
          icon={<Home size={24} />} 
          label="الغرف" 
        />
        <NavButton 
          active={activeTab === 'store'} 
          onClick={() => setActiveTab('store')} 
          icon={<Gift size={24} />} 
          label="المتجر" 
        />
        <NavButton 
          active={activeTab === 'wall'} 
          onClick={() => setActiveTab('wall')} 
          icon={<LayoutGrid size={24} />} 
          label="الحائط" 
        />
        <NavButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
          icon={<Settings size={24} />} 
          label="الإعدادات" 
        />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, badge }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl transition-all relative ${active ? 'text-primary' : 'text-slate-400'}`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
    {badge && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-white font-bold">
        {badge}
      </span>
    )}
    {active && <span className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full"></span>}
  </button>
);

export default Dashboard;