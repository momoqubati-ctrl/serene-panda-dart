import React, { useState } from 'react';
import { Users, MessageSquare, Home, LayoutGrid, Settings, Bell, Search, Gift, Mail, Bot } from 'lucide-react';
import MemberList from '@/components/chat/MemberList';
import RoomList from '@/components/chat/RoomList';
import WallFeed from '@/components/chat/WallFeed';
import PrivateList from '@/components/chat/PrivateList';
import SettingsPanel from '@/components/chat/SettingsPanel';
import NotificationCenter from '@/components/chat/NotificationCenter';
import RoomPage from '@/components/chat/RoomPage';
import InternalMail from '@/components/chat/InternalMail';
import BotsList from '@/components/chat/BotsList';

const Dashboard = () => {
  const [activeSidebarTab, setActiveSidebarTab] = useState('members');
  const [activeRoom, setActiveRoom] = useState({
    id: 1,
    name: 'الغرفة العامة',
    members: 1245,
    owner: 'مستر سهم',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop',
    locked: false
  });

  const renderSidebarContent = () => {
    switch (activeSidebarTab) {
      case 'members': return <MemberList />;
      case 'rooms': return <RoomList onSelectRoom={setActiveRoom} />;
      case 'private': return <PrivateList />;
      case 'mail': return <InternalMail />;
      case 'wall': return <WallFeed />;
      case 'settings': return <SettingsPanel />;
      case 'bots': return <BotsList />;
      case 'notifications': return <NotificationCenter />;
      default: return <MemberList />;
    }
  };

  const getSidebarTitle = () => {
    switch (activeSidebarTab) {
      case 'members': return 'المتواجدين';
      case 'rooms': return 'الغرف';
      case 'private': return 'الخاصة';
      case 'mail': return 'البريد الداخلي';
      case 'wall': return 'الحائط';
      case 'settings': return 'الإعدادات';
      case 'bots': return 'البوتات';
      case 'notifications': return 'التنبيهات';
      default: return 'المتواجدين';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1a1a2e] text-white rtl overflow-hidden">
      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Section: Room Chat (Main Area) */}
        <div className="flex-1 flex flex-col bg-[#f0f2f5] relative">
          {activeRoom ? (
            <RoomPage room={activeRoom} isEmbedded={true} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-4">
              <Home size={64} strokeWidth={1} />
              <p className="text-xl font-bold">الرجاء اختيار غرفة للبدء بالدردشة</p>
            </div>
          )}
        </div>

        {/* Right Section: Sidebar (Dynamic Content) */}
        <div className="w-80 lg:w-96 bg-white border-r flex flex-col shadow-xl z-20">
          <div className="p-4 border-b bg-[#4834d4] text-white flex items-center justify-between">
            <h2 className="font-bold text-lg">{getSidebarTitle()}</h2>
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <Search size={20} />
              </button>
              <button 
                onClick={() => setActiveSidebarTab('notifications')}
                className={`p-1.5 rounded-lg transition-colors ${activeSidebarTab === 'notifications' ? 'bg-white/20' : 'hover:bg-white/10'}`}
              >
                <Bell size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-50/50">
            {renderSidebarContent()}
          </div>
        </div>
      </div>

      {/* Bottom Navigation (Footer) */}
      <nav className="bg-[#f8f9fa] border-t flex justify-around items-center py-2 px-4 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <NavButton 
          active={activeSidebarTab === 'members'} 
          onClick={() => setActiveSidebarTab('members')} 
          icon={<Users size={22} />} 
          label="المتواجدين" 
          badge="1155"
          badgeColor="bg-red-500"
        />
        <NavButton 
          active={activeSidebarTab === 'private'} 
          onClick={() => setActiveSidebarTab('private')} 
          icon={<MessageSquare size={22} />} 
          label="الخاصة" 
        />
        <NavButton 
          active={activeSidebarTab === 'mail'} 
          onClick={() => setActiveSidebarTab('mail')} 
          icon={<Mail size={22} />} 
          label="البريد الداخلي" 
        />
        <NavButton 
          active={activeSidebarTab === 'rooms'} 
          onClick={() => setActiveSidebarTab('rooms')} 
          icon={<Home size={22} />} 
          label="الغرف" 
          badge="6"
          badgeColor="bg-red-500"
        />
        <NavButton 
          active={activeSidebarTab === 'wall'} 
          onClick={() => setActiveSidebarTab('wall')} 
          icon={<LayoutGrid size={22} />} 
          label="الحائط" 
          badge="0"
          badgeColor="bg-red-500"
        />
        <NavButton 
          active={activeSidebarTab === 'settings'} 
          onClick={() => setActiveSidebarTab('settings')} 
          icon={<Settings size={22} />} 
          label="الإعدادات" 
        />
        <NavButton 
          active={activeSidebarTab === 'bots'} 
          onClick={() => setActiveSidebarTab('bots')} 
          icon={<Bot size={22} />} 
          label="البوتات" 
        />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, badge, badgeColor }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 px-4 py-1 rounded-xl transition-all relative group ${active ? 'text-[#4834d4]' : 'text-slate-500 hover:text-[#4834d4]'}`}
  >
    <div className={`p-1 rounded-lg transition-colors ${active ? 'bg-[#4834d4]/10' : 'group-hover:bg-[#4834d4]/5'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold whitespace-nowrap">{label}</span>
    {badge && (
      <span className={`absolute top-0 right-2 ${badgeColor || 'bg-primary'} text-white text-[9px] px-1.5 py-0.5 rounded-full border-2 border-white font-bold shadow-sm`}>
        {badge}
      </span>
    )}
  </button>
);

export default Dashboard;
