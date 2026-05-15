"use client";

import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Crown, Star, Gift, MapPin, Users, Search, X } from 'lucide-react';
import ProfileModal from './ProfileModal';
import { Input } from "@/components/ui/input";
import StoriesBar from './StoriesBar';

interface MemberListProps {
  isSearchOpen?: boolean;
  setIsSearchOpen?: (open: boolean) => void;
}

const MOCK_MEMBERS = [
  { id: 1, name: 'مستر سهم', role: 'admin', rank: 100, color: 'text-green-600', bg: 'bg-green-50', status: 'online', room: 'الغرفة العامة', country: 'SA', points: 5000, rep: 120, avatar: 'https://i.pravatar.cc/150?u=1', siteBadge: 'مالك الموقع', statusMsg: 'لست نصا يمكن ازالته انا الفكرة' },
  { id: 2, name: 'صادق 10', role: 'member', rank: 80, color: 'text-slate-700', bg: 'bg-slate-50', status: 'online', room: 'الغرفة العامة', country: 'EG', points: 3500, rep: 85, avatar: 'https://i.pravatar.cc/150?u=10', statusMsg: 'مرحبا بكم' },
  { id: 3, name: 'صادق 1001', role: 'member', rank: 50, color: 'text-slate-700', bg: 'bg-slate-50', status: 'online', room: 'الغرفة العامة', country: 'KW', points: 2000, rep: 45, avatar: 'https://i.pravatar.cc/150?u=1001', statusMsg: 'مرحبا بكم' },
  { id: 4, name: 'صادق 1004', role: 'member', rank: 0, color: 'text-slate-700', bg: 'bg-slate-50', status: 'online', room: 'الغرفة العامة', country: 'MA', points: 0, rep: 0, avatar: 'https://i.pravatar.cc/150?u=1004', statusMsg: 'مرحبا بكم' },
  { id: 5, name: 'صادق 1006', role: 'member', rank: 0, color: 'text-slate-700', bg: 'bg-slate-50', status: 'online', room: 'الغرفة العامة', country: 'DZ', points: 0, rep: 0, avatar: 'https://i.pravatar.cc/150?u=1006', statusMsg: 'مرحبا بكم' },
];

const MemberList = ({ isSearchOpen = false, setIsSearchOpen }: MemberListProps) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Stories Bar at the very top */}
      <StoriesBar />

      {/* Search Header - Conditionally Rendered */}
      {isSearchOpen && (
        <div className="p-3 bg-[#2c3e50] flex items-center gap-2 animate-in slide-in-from-top duration-200 ltr">
          <div className="flex-1 relative">
            <Input 
              placeholder="Search .." 
              className="h-9 bg-white/10 border-none text-white placeholder:text-white/50 pl-8 rounded-md text-xs"
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
        {MOCK_MEMBERS.filter(m => m.name.includes(searchQuery)).map((member) => (
          <div 
            key={member.id} 
            onClick={() => setSelectedUser(member)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-all cursor-pointer border-b border-slate-50"
            style={{ direction: 'ltr' }}
          >
            <div className="relative shrink-0">
              <Avatar className="w-12 h-12 rounded-full border-2 border-white shadow-sm">
                <AvatarImage src={member.avatar} />
                <AvatarFallback>{member.name[0]}</AvatarFallback>
              </Avatar>
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${member.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`font-black text-xs truncate ${member.color}`} style={{ direction: 'rtl' }}>{member.name}</span>
                  {member.siteBadge && (
                    <Badge className="h-3.5 text-[8px] px-1 bg-blue-600 text-white border-none rounded-sm font-black">
                      {member.siteBadge}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                   <img src={`https://flagcdn.com/w20/${member.country.toLowerCase()}.png`} alt={member.country} className="w-4 h-3 object-cover rounded-sm" />
                   <span className="text-[9px] text-slate-400 font-bold">#{member.id + 300}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-500 truncate font-medium" style={{ direction: 'rtl' }}>{member.statusMsg}</p>
                <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                  <span>@{member.name.replace(' ', '')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
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