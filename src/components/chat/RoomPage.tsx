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
  Image as LucideImage, 
  Send,
  ShieldCheck,
  Plus,
  X,
  Volume2,
  VolumeX,
  Crown,
  MessageSquareOff,
  MicOff
} from 'lucide-react';

const MOCK_MESSAGES = [
  { id: 1, user: 'بوت الترحيب', role: 'bot', text: 'مرحبا بيكم و حياكم في الغرفة العامة، نتمنى لكم وقتاً ممتعاً!', time: '10:45 ص', color: 'text-teal-400', avatar: 'https://i.pravatar.cc/150?u=bot1', isSystem: true },
  { id: 2, user: 'مستر سهم', role: 'admin', text: 'السلام عليكم ورحمة الله وبركاتة، كيف حال الجميع؟', time: '10:47 ص', color: 'text-red-500', avatar: 'https://i.pravatar.cc/150?u=1', isOwner: true, siteBadge: 'مالك الموقع' },
  { id: 3, user: 'سارة', role: 'member', text: 'وعليكم السلام مستر سهم، منور الغرفة 🌹', time: '10:48 ص', color: 'text-pink-400', avatar: 'https://i.pravatar.cc/150?u=12' },
];

const RoomPage = ({ room, onBack, isEmbedded = false }: any) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [isMuted, setIsMuted] = useState(false);
  const [showMics, setShowMics] = useState(true);
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
      color: 'text-red-500',
      avatar: 'https://i.pravatar.cc/150?u=1',
      isOwner: true,
      siteBadge: 'مالك الموقع'
    };

    setMessages([...messages, newMsg]);
    setMessage('');
  };

  return (
    <div className={`flex flex-col h-full bg-[#1a1a2e] rtl ${!isEmbedded ? 'fixed inset-0 z-[60]' : ''}`}>
      {/* Room Header */}
      <header className="bg-[#12121f] border-b border-white/[0.06] px-4 py-2 flex items-center justify-between shadow-xl z-10">
        <div className="flex items-center gap-3">
          {!isEmbedded && (
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl hover:bg-white/5 text-white">
              <ChevronRight size={24} />
            </Button>
          )}
          <div className="relative">
            <Avatar className="w-10 h-10 rounded-xl border border-white/10 shadow-lg">
              <AvatarImage src={room.image} />
              <AvatarFallback>{room.name[0]}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#12121f]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-xs leading-tight text-white">{room.name}</h3>
              <Crown size={12} className="text-yellow-500" />
            </div>
            <p className="text-[9px] text-slate-500 font-bold">بواسطة: {room.owner}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className={`rounded-xl h-9 w-9 ${isMuted ? 'text-red-500 bg-red-500/10' : 'text-slate-400 hover:bg-white/5'}`}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowMics(!showMics)} className={`rounded-xl h-9 w-9 ${showMics ? 'text-primary bg-primary/10' : 'text-slate-400 hover:bg-white/5'}`}>
            <Mic2 size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl h-9 w-9 text-red-500 hover:bg-red-500/10">
            <X size={18} />
          </Button>
        </div>
      </header>

      {/* Mics Section */}
      {showMics && (
        <div className="bg-[#12121f]/50 border-b border-white/[0.06] p-2 grid grid-cols-5 gap-2 overflow-x-auto no-scrollbar">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="relative">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${i === 1 ? 'border-primary bg-primary/10 animate-pulse' : 'border-white/5 bg-white/5'}`}>
                  {i === 1 ? (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="https://i.pravatar.cc/150?u=1" />
                      <AvatarFallback>م</AvatarFallback>
                    </Avatar>
                  ) : (
                    <MicOff size={14} className="text-white/20" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#12121f] text-[8px] font-black px-1 rounded-full border border-white/10">
                  {i}
                </div>
              </div>
              <span className="text-[8px] font-bold text-slate-500 truncate w-12 text-center">
                {i === 1 ? 'مستر سهم' : 'فارغ'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0a0a14]/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 group animate-in fade-in slide-in-from-bottom-1 duration-300`}>
            <div className="relative shrink-0">
              <Avatar className="w-9 h-9 rounded-xl shadow-lg border border-white/5">
                <AvatarImage src={msg.avatar} />
                <AvatarFallback>{msg.user[0]}</AvatarFallback>
              </Avatar>
              {msg.role === 'admin' && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-0.5 rounded-full border border-[#1a1a2e]">
                  <ShieldCheck size={10} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className={`text-[11px] font-black ${msg.color}`}>{msg.user}</h4>
                {msg.isOwner && (
                  <Badge className="h-3.5 text-[8px] px-1 bg-blue-600 text-white border-none font-black rounded-sm">
                    {msg.siteBadge}
                  </Badge>
                )}
                {msg.role === 'bot' && (
                  <Badge className="h-3.5 text-[8px] px-1 bg-teal-500 text-white border-none font-black rounded-sm">
                    بوت
                  </Badge>
                )}
                <span className="text-[8px] text-slate-600 font-bold mr-auto">{msg.time}</span>
              </div>
              <div className={`relative p-2.5 rounded-2xl rounded-tr-none inline-block max-w-[90%] ${msg.isSystem ? 'bg-teal-500/10 border border-teal-500/20' : 'bg-white/5 border border-white/5'}`}>
                <p className={`text-xs font-bold leading-relaxed break-words ${msg.isSystem ? 'text-teal-400' : 'text-slate-200'}`}>
                  {msg.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-[#12121f] border-t border-white/[0.06] p-3 shadow-2xl z-10">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" className="rounded-xl w-10 h-10 text-slate-400 hover:text-primary hover:bg-white/5">
              <Plus size={20} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="rounded-xl w-10 h-10 text-slate-400 hover:text-amber-500 hover:bg-white/5 hidden sm:flex">
              <Smile size={20} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="rounded-xl w-10 h-10 text-slate-400 hover:text-pink-500 hover:bg-white/5">
              <Gift size={20} />
            </Button>
          </div>
          
          <div className="flex-1 relative">
            <Input 
              placeholder="اكتب رسالتك هنا..." 
              className="h-10 bg-white/5 border-white/10 rounded-xl focus-visible:ring-1 focus-visible:ring-primary transition-all text-white font-bold placeholder:text-slate-600 text-xs"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button 
            type="submit" 
            disabled={!message.trim()}
            className={`w-10 h-10 rounded-xl p-0 transition-all ${message.trim() ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-600'}`}
          >
            <Send size={18} className="rotate-180" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RoomPage;