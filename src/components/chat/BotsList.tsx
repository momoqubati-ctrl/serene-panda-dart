"use client";

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Bot, X, Play, Settings } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const MOCK_BOTS = [
  { id: 1, name: 'بوت المسابقات', desc: 'يقوم بطرح أسئلة وجوائز تلقائية', status: 'active', avatar: 'https://i.pravatar.cc/150?u=bot1' },
  { id: 2, name: 'بوت الحماية', desc: 'مراقبة الكلمات الممنوعة والسبام', status: 'active', avatar: 'https://i.pravatar.cc/150?u=bot2' },
  { id: 3, name: 'بوت الترحيب', desc: 'الترحيب بالأعضاء الجدد في الغرف', status: 'inactive', avatar: 'https://i.pravatar.cc/150?u=bot3' },
];

const BotsList = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full bg-white rtl">
      {/* Search Header */}
      <div className="p-3 bg-[#2c3e50] flex items-center gap-2">
        <div className="flex-1 relative">
          <Input 
            placeholder="بحث في البوتات .." 
            className="h-9 bg-white/10 border-none text-white placeholder:text-white/50 pr-8 rounded-md text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-2 top-2.5 text-white/50" size={14} />
        </div>
        <button className="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {MOCK_BOTS.map((bot) => (
          <div key={bot.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-primary/20 transition-all bg-white shadow-sm">
            <div className="relative shrink-0">
              <Avatar className="w-11 h-11 rounded-lg border border-slate-100">
                <AvatarImage src={bot.avatar} />
                <AvatarFallback><Bot size={20} /></AvatarFallback>
              </Avatar>
              <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${bot.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="font-black text-xs text-slate-800 truncate">{bot.name}</h4>
                <Badge variant="outline" className={`text-[8px] px-1 h-3.5 ${bot.status === 'active' ? 'text-green-600 border-green-100 bg-green-50' : 'text-slate-400 border-slate-100 bg-slate-50'}`}>
                  {bot.status === 'active' ? 'يعمل' : 'متوقف'}
                </Badge>
              </div>
              <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{bot.desc}</p>
            </div>

            <div className="flex gap-1">
              <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-md transition-colors">
                <Settings size={14} />
              </button>
              <button className={`p-1.5 rounded-md transition-colors ${bot.status === 'active' ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-green-400 hover:text-green-600 hover:bg-green-50'}`}>
                <Play size={14} fill="currentColor" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BotsList;