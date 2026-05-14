"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, CheckCheck } from 'lucide-react';
import { Input } from "@/components/ui/input";

const MOCK_CHATS = [
  { id: 1, name: 'أحمد محمد', avatar: 'https://i.pravatar.cc/150?u=11', lastMsg: 'تمام، نلتقي في الغرفة الرئيسية', time: '10:30 ص', unread: 2, online: true },
  { id: 2, name: 'ليلى خالد', avatar: 'https://i.pravatar.cc/150?u=14', lastMsg: 'شكراً على الهدية الرائعة! 🎁', time: 'أمس', unread: 0, online: false },
  { id: 3, name: 'ياسين علي', avatar: 'https://i.pravatar.cc/150?u=15', lastMsg: 'أرسلت لك ملف الإعدادات', time: 'أمس', unread: 0, online: true },
];

const PrivateList = () => {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute right-3 top-3 text-slate-400" size={18} />
          <Input placeholder="بحث في الرسائل..." className="pr-10 bg-slate-50 border-none rounded-xl h-11" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {MOCK_CHATS.map((chat) => (
          <div key={chat.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50">
            <div className="relative">
              <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
                <AvatarImage src={chat.avatar} />
                <AvatarFallback>{chat.name[0]}</AvatarFallback>
              </Avatar>
              {chat.online && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-bold text-slate-800 truncate">{chat.name}</h4>
                <span className="text-[10px] text-slate-400 font-medium">{chat.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500 truncate flex-1">{chat.lastMsg}</p>
                {chat.unread > 0 ? (
                  <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {chat.unread}
                  </span>
                ) : (
                  <CheckCheck size={14} className="text-slate-300" />
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