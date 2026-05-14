"use client";

import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Crown, Star, Gift, MapPin, Users } from 'lucide-react';
import ProfileModal from './ProfileModal';

const MOCK_MEMBERS = [
  { id: 1, name: 'المدير العام', role: 'admin', rank: 100, color: 'text-red-600', bg: 'bg-red-50', status: 'online', room: 'الغرفة الرئيسية', country: 'SA', points: 5000, rep: 120, avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: 'المشرف الذهبي', role: 'mod', rank: 80, color: 'text-amber-600', bg: 'bg-amber-50', status: 'online', room: 'غرفة المسابقات', country: 'EG', points: 3500, rep: 85, avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, name: 'عضو مميز جداً', role: 'vip', rank: 50, color: 'text-purple-600', bg: 'bg-purple-50', status: 'busy', room: 'الغرفة الرئيسية', country: 'KW', points: 2000, rep: 45, avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: 4, name: 'زائر 5542', role: 'guest', rank: 0, color: 'text-slate-600', bg: 'bg-slate-50', status: 'online', room: 'الغرفة الرئيسية', country: 'MA', points: 0, rep: 0, avatar: 'https://i.pravatar.cc/150?u=4' },
];

const MemberList = () => {
  const [selectedUser, setSelectedUser] = useState<any>(null);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <Users className="text-primary" size={20} />
          <span className="font-bold text-slate-700">المتواجدون (1,245)</span>
        </div>
        <div className="text-xs text-slate-400">ترتيب حسب الرتبة</div>
      </div>

      {MOCK_MEMBERS.sort((a, b) => b.rank - a.rank).map((member) => (
        <div 
          key={member.id} 
          onClick={() => setSelectedUser(member)}
          className={`flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:border-primary/20 transition-all cursor-pointer bg-white shadow-sm`}
        >
          <div className="relative">
            <Avatar className="w-14 h-14 border-2 border-white shadow-md">
              <AvatarImage src={member.avatar} />
              <AvatarFallback>{member.name[0]}</AvatarFallback>
            </Avatar>
            <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${member.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <span className={`font-bold truncate ${member.color}`}>{member.name}</span>
              {member.role === 'admin' && <Crown size={14} className="text-red-500 fill-red-500" />}
              {member.role === 'mod' && <Shield size={14} className="text-amber-500 fill-amber-500" />}
              {member.role === 'vip' && <Star size={14} className="text-purple-500 fill-purple-500" />}
              <Gift size={14} className="text-pink-500" />
            </div>
            
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-0.5"><MapPin size={10} /> {member.country}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="truncate">{member.room}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 h-5 rounded-lg border-slate-100 bg-slate-50">
              {member.points} نقطة
            </Badge>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <span>{member.rep} إعجاب</span>
            </div>
          </div>
        </div>
      ))}

      <ProfileModal 
        user={selectedUser} 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
      />
    </div>
  );
};

export default MemberList;