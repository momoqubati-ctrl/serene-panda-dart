"use client";

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, CheckCheck, X } from 'lucide-react';
import { Input } from "@/components/ui/input";

const MOCK_CHATS = [
  { id: 1, name: 'أحمد محمد', avatar: 'https://i.pravatar.cc/150?u=11', lastMsg: 'تمام، نلتقي في الغرفة الرئيسية', time: '10:30 ص', unread: 2, online: true },
  { id: 2, name: 'ليلى خالد', avatar: 'https://i.pravatar.cc/150?u=14', lastMsg: 'شكراً على الهدية الرائعة! 🎁', time: 'أمس', unread: 0, online: false },
  { id: 3, name: 'ياسين علي', avatar: 'https://i.pravatar.cc/150?u=15', lastMsg: 'أرسلت لك ملف الإعدادات', time: 'أمس', unread: 0, online: true },
];

const PrivateList = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full bg-white ltr">
      {/* Search Header - Compact */}
      <div className="p-1.5 bg-[#2c3e50] flex items-center gap-1.5">
        <div className="flex-1 relative">
          <Input 
            placeholder="Search private .." 
            className="h-7 bg-white/10 border-none text-white placeholder:text-white/50 pl-7 rounded-md text-[10px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-2 top-2 text-white/50" size={12} />
        </div>
        <button className="bg-red-500 text-white p-1 rounded-md hover:bg-red-600 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {MOCK_CHATS.map((chat) => (
          <div key={chat.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50">
            <div className="relative shrink-0">
              <Avatar className="w-11 h-11 rounded-full border-2 border-white shadow-sm">
                <AvatarImage src={chat.avatar} />
                <AvatarFallback>{chat.name[0]}</AvatarFallback>
              </Avatar>
              {chat.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <h4 className="font-black text-xs text-slate-800 truncate">{chat.name}</h4>
                <span className="text-[9px] text-slate-400 font-bold">{chat.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-slate-500 truncate flex-1 font-medium">{chat.lastMsg}</p>
                {chat.unread > 0 ? (
                  <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                    {chat.unread}
                  </span>
                ) : (
                  <CheckCheck size={12} className="text-slate-300" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrivateList;