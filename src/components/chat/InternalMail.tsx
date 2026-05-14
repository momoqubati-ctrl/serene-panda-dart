"use client";

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Mail, X, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";

const MOCK_MAIL = [
  { id: 1, from: 'الإدارة', subject: 'ترحيب بالعضو الجديد', body: 'أهلاً بك في مجتمعنا المتواضع...', time: 'منذ يومين', read: true },
  { id: 2, from: 'نظام الجوائز', subject: 'لقد حصلت على وسام جديد', body: 'تهانينا! لقد حصلت على وسام المتفاعل المتميز...', time: 'منذ 3 أيام', read: false },
];

const InternalMail = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full bg-white rtl">
      {/* Search Header */}
      <div className="p-3 bg-[#2c3e50] flex items-center gap-2">
        <div className="flex-1 relative">
          <Input 
            placeholder="بحث في البريد .." 
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

      <div className="flex-1 overflow-y-auto">
        {MOCK_MAIL.map((mail) => (
          <div key={mail.id} className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!mail.read ? 'bg-blue-50/30' : ''}`}>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                <Mail size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <h4 className="font-black text-xs text-slate-800 truncate">{mail.from}</h4>
                  <span className="text-[9px] text-slate-400 font-bold">{mail.time}</span>
                </div>
                <p className="text-[10px] text-slate-600 font-bold truncate mb-1">{mail.subject}</p>
                <p className="text-[10px] text-slate-400 truncate font-medium">{mail.body}</p>
              </div>
              <button className="text-slate-300 hover:text-red-500 self-center">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InternalMail;