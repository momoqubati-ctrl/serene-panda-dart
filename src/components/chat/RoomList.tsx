"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Users, Lock, Mic2, Heart, Crown } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import RoomPage from './RoomPage';

const MOCK_ROOMS = [
  { id: 1, name: 'الغرفة الرئيسية', desc: 'أهلاً بكم في الغرفة العامة للجميع', members: 450, mics: 5, likes: 1000, locked: false, owner: 'المدير العام', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop' },
  { id: 2, name: 'غرفة المسابقات', desc: 'جوائز يومية ومسابقات ثقافية', members: 120, mics: 3, likes: 500, locked: true, owner: 'المشرف الذهبي', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop' },
  { id: 3, name: 'عالم الرومانسية', desc: 'أجمل الأغاني والقصائد', members: 85, mics: 8, likes: 2500, locked: false, owner: 'ليلى', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
];

const RoomList = () => {
  const [activeRoom, setActiveRoom] = useState<any>(null);

  if (activeRoom) {
    return <RoomPage room={activeRoom} onBack={() => setActiveRoom(null)} />;
  }

  return (
    <div className="p-4 grid grid-cols-1 gap-4">
      {MOCK_ROOMS.map((room) => (
        <Card 
          key={room.id} 
          onClick={() => setActiveRoom(room)}
          className="overflow-hidden border-none shadow-sm rounded-2xl group cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex h-32">
            <div className="w-32 h-full relative shrink-0">
              <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
              {room.locked && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Lock className="text-white" size={24} />
                </div>
              )}
            </div>
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-800 truncate">{room.name}</h3>
                  <div className="flex items-center gap-1 text-pink-500">
                    <Heart size={14} fill="currentColor" />
                    <span className="text-xs font-bold">{room.likes}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{room.desc}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Users size={14} />
                    <span className="text-xs font-bold">{room.members}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Mic2 size={14} />
                    <span className="text-xs font-bold">{room.mics}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-primary font-bold bg-primary/5 px-2 py-1 rounded-lg">
                  <Crown size={12} />
                  <span>{room.owner}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default RoomList;