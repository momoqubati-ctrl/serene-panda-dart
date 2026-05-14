"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Mic2, 
  ChevronRight, 
  MoreVertical, 
  Users, 
  Smile, 
  Gift, 
  Image as ImageIcon, 
  Send,
  ShieldCheck,
  Plus,
  X
} from 'lucide-react';

const MOCK_MESSAGES = [
  { id: 1, user: 'الغرفة العامة | بوت الترحيب', role: 'bot', text: 'مرحبا بيكم و حياكم في الغرفة العامة', time: '10:45 ص', color: 'text-teal-600', avatar: 'https://i.pravatar.cc/150?u=bot1', isSystem: true },
  { id: 2, user: 'الغرفة العامة | بوت الترحيب', role: 'bot', text: 'chatmaster : أهلا بك مستر سهم، رتبتك الحالية في الموقع .', time: '10:46 ص', color: 'text-teal-600', avatar: 'https://i.pravatar.cc/150?u=bot1', isSystem: true },
  { id: 3, user: 'مستر سهم', role: 'admin', text: 'السلام عليكم ورحمة الله وبركاتة', time: '10:47 ص', color: 'text-red-600', avatar: 'https://i.pravatar.cc/150?u=1', isOwner: true, siteBadge: 'مالك الموقع' },
  { id: 4, user: 'مستر سهم', role: 'admin', text: 'السلام عليكم ورحمة الله وبركاتة', time: '10:48 ص', color: 'text-red-600', avatar: 'https://i.pravatar.cc/150?u=1', isOwner: true, siteBadge: 'مالك الموقع' },
];

const RoomPage = ({ room, onBack, isEmbedded = false }: any) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMsg = {
      id: messages.length + 1,
      user: 'مستر سهم',
      role: 'admin',
      text: message,
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      color: 'text-red-600',
      avatar: 'https://i.pravatar.cc/150?u=1',
      isOwner: true,
      siteBadge: 'مالك الموقع'
    };

    setMessages([...messages, newMsg]);
    setMessage('');
  };

  return (
    <div className={`flex flex-col h-full bg-white rtl ${!isEmbedded ? 'fixed inset-0 z-[60] animate-in slide-in-from-left duration-300' : ''}`}>
      {/* Room Header */}
      <header className="bg-[#4834d4] text-white px-4 py-2 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          {!isEmbedded && (
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-white/10 text-white">
              <ChevronRight size={24} />
            </Button>
          )}
          <div className="relative">
            <Avatar className="w-10 h-10 rounded-lg border border-white/20 shadow-sm">
              <AvatarImage src={room.image} />
              <AvatarFallback>{room.name[0]}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h3 className="font-black text-sm leading-tight">{room.name}</h3>
            <p className="text-[10px] text-white/70 font-bold">غرفة عامة</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-red-500 text-white p-1 rounded-md hover:bg-red-600 transition-colors">
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-0 space-y-0 bg-white">
        {messages.map((msg) => (
          <div key={msg.id} className={`border-b border-slate-100 p-2 hover:bg-slate-50 transition-colors group ${msg.isSystem ? 'bg-blue-50/30' : ''}`}>
            <div className="flex gap-3">
              <div className="relative shrink-0">
                <Avatar className="w-10 h-10 rounded-lg shadow-sm border border-slate-200">
                  <AvatarImage src={msg.avatar} />
                  <AvatarFallback>{msg.user[0]}</AvatarFallback>
                </Avatar>
                {msg.role === 'admin' && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-0.5 rounded-full border border-white">
                    <ShieldCheck size={10} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h4 className={`text-xs font-black ${msg.color}`}>{msg.user}</h4>
                  {msg.isOwner && (
                    <Badge className="h-4 text-[9px] px-1.5 bg-blue-600 text-white border-none font-black rounded-sm">
                      {msg.siteBadge}
                    </Badge>
                  )}
                  {msg.role === 'bot' && (
                    <Badge className="h-4 text-[9px] px-1.5 bg-teal-500 text-white border-none font-black rounded-sm">
                      بوت
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <p className={`text-[13px] font-bold leading-relaxed break-words ${msg.isSystem ? 'text-teal-700' : 'text-blue-800'}`}>
                    {msg.text}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="bg-blue-500 text-white p-0.5 rounded-sm">
                  <ShieldCheck size={12} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-[#f8f9fa] border-t p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-10">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" className="rounded-full w-10 h-10 text-slate-400 hover:text-primary hover:bg-white shadow-sm border border-slate-100">
              <Plus size={22} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="rounded-full w-10 h-10 text-slate-400 hover:text-amber-500 hover:bg-white shadow-sm border border-slate-100">
              <Smile size={22} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="rounded-full w-10 h-10 text-slate-400 hover:text-pink-500 hover:bg-white shadow-sm border border-slate-100">
              <Gift size={22} />
            </Button>
          </div>
          
          <div className="flex-1 relative">
            <Input 
              placeholder="اكتب رسالتك هنا..." 
              className="h-11 bg-white border border-slate-200 rounded-lg focus-visible:ring-1 focus-visible:ring-primary transition-all text-slate-900 font-bold placeholder:text-slate-400 shadow-inner"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button 
            type="submit" 
            disabled={!message.trim()}
            className={`w-11 h-11 rounded-lg p-0 transition-all ${message.trim() ? 'bg-primary text-white shadow-md' : 'bg-slate-200 text-slate-400'}`}
          >
            <Send size={20} className="rotate-180" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RoomPage;