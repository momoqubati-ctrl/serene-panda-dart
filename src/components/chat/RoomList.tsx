"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Users, Lock, Mic2, Heart, Crown, Search, Plus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const MOCK_ROOMS = [
  { id: 1, name: 'الغرفة العامة', desc: 'أهلاً بكم في الغرفة العامة للجميع', members: 1245, mics: 5, likes: 1000, locked: false, owner: 'مستر سهم', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop' },
  { id: 2, name: 'غرفة المسابقات', desc: 'جوائز يومية ومسابقات ثقافية', members: 120, mics: 3, likes: 500, locked: true, owner: 'المشرف الذهبي', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop' },
  { id: 3, name: 'عالم الرومانسية', desc: 'أجمل الأغاني والقصائد', members: 85, mics: 8, likes: 2500, locked: false, owner: 'ليلى', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
];

const RoomList = ({ onSelectRoom }: any) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full bg-white ltr">
      {/* Search Header - Compact */}
      <div className="p-1.5 bg-[#2c3e50] flex items-center gap-1.5">
        <div className="flex-1 relative">
          <Input 
            placeholder="Search room .." 
            className="h-7 bg-white/10 border-none text-white placeholder:text-white/50 pl-7 rounded-md text-[10px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-2 top-2 text-white/50" size={12} />
        </div>
        <button className="bg-green-500 text-white p-1 rounded-md hover:bg-green-600 transition-colors">
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {MOCK_ROOMS.map((room) => (
          <div 
            key={room.id} 
            onClick={() => onSelectRoom(room)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-all cursor-pointer border-b border-slate-50 group"
          >
            <div className="relative shrink-0">
              <img src={room.image} alt={room.name} className="w-12 h-12 object-cover rounded-lg shadow-sm" />
              {room.locked && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                  <Lock className="text-white" size={12} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="font-black text-xs text-slate-800 truncate">{room.name}</h4>
                <div className="flex items-center gap-1 text-pink-500">
                  <Heart size={10} fill="currentColor" />
                  <span className="text-[9px] font-bold">{room.likes}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-slate-400">
                    <Users size={10} />
                    <span className="text-[9px] font-bold">{room.members}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-slate-400">
                    <Mic2 size={10} />
                    <span className="text-[9px] font-bold">{room.mics}</span>
                  </div>
                </div>
                <span className="text-[9px] text-primary font-bold bg-primary/5 px-1.5 py-0.5 rounded-sm">
                  {room.owner}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomList;