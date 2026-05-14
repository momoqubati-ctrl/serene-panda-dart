"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Mic2, 
  MicOff, 
  ChevronRight, 
  MoreVertical, 
  Heart, 
  Users, 
  Smile, 
  Gift, 
  Image as ImageIcon, 
  Send,
  Volume2,
  VolumeX,
  ShieldCheck,
  Crown,
  Trophy
} from 'lucide-react';

const MOCK_MESSAGES = [
  { id: 1, user: 'المدير العام', role: 'admin', text: 'أهلاً بك في غرفتنا المتواضعة! 🌹', time: '10:45 ص', color: 'text-red-600', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, user: 'سارة', role: 'member', text: 'صباح الخير للجميع، كيف الحال؟', time: '10:46 ص', color: 'text-pink-600', avatar: 'https://i.pravatar.cc/150?u=12' },
  { id: 3, user: 'أحمد محمد', role: 'mod', text: 'منورين جميعاً يا شباب!', time: '10:47 ص', color: 'text-blue-600', avatar: 'https://i.pravatar.cc/150?u=11' },
  { id: 4, user: 'نظام الغرفة', role: 'system', text: 'دخل العضو "ياسين" إلى الغرفة', time: '10:48 ص', color: 'text-slate-400', isSystem: true },
];

const RoomPage = ({ room, onBack }: any) => {
  const [isMuted, setIsMuted] = useState(false);
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
      user: 'أنا',
      role: 'member',
      text: message,
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      color: 'text-primary',
      avatar: 'https://i.pravatar.cc/150?u=me'
    };

    setMessages([...messages, newMsg]);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 fixed inset-0 z-[60] rtl animate-in slide-in-from-left duration-300">
      {/* Room Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-slate-100">
            <ChevronRight size={24} />
          </Button>
          <div className="relative">
            <Avatar className="w-11 h-11 rounded-2xl border-2 border-primary/10 shadow-sm">
              <AvatarImage src={room.image} />
              <AvatarFallback>{room.name[0]}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-slate-800 text-sm">{room.name}</h3>
              {room.locked && <ShieldCheck size={14} className="text-slate-400" />}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
              <span className="flex items-center gap-0.5"><Users size={10} /> {room.members} متواجد</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="flex items-center gap-0.5 text-primary"><Crown size={10} /> {room.owner}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-slate-100 rounded-full px-3 py-1 flex items-center gap-1 mr-2">
             <Trophy size={14} className="text-yellow-500" />
             <span className="text-[10px] font-bold text-slate-600">Lvl 24</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="rounded-full">
            {isMuted ? <VolumeX size={20} className="text-red-500" /> : <Volume2 size={20} className="text-slate-600" />}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreVertical size={20} className="text-slate-600" />
          </Button>
        </div>
      </header>

      {/* Mics Section - Scrollable horizontally if needed */}
      <div className="bg-white/80 backdrop-blur-md p-4 border-b flex justify-between items-center gap-2 overflow-x-auto no-scrollbar">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 shrink-0 min-w-[64px]">
            <div className="relative group cursor-pointer">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${i === 1 ? 'bg-primary/10 border-2 border-primary shadow-lg shadow-primary/20 scale-110' : 'bg-slate-100 border-2 border-dashed border-slate-300 hover:border-primary/50'}`}>
                {i === 1 ? (
                   <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src="https://i.pravatar.cc/150?u=1" />
                        <AvatarFallback>م</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full">
                        <Mic2 size={10} />
                      </div>
                   </div>
                ) : (
                  <Mic2 size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                )}
              </div>
              <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">{i}</span>
            </div>
            <span className={`text-[10px] font-bold truncate max-w-[60px] ${i === 1 ? 'text-primary' : 'text-slate-400'}`}>
              {i === 1 ? 'المدير' : 'ميك مغلق'}
            </span>
          </div>
        ))}
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
        <div className="flex justify-center my-4">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
            <p className="text-[10px] text-slate-500 font-bold">بث مباشر من الغرفة الرئيسية 🎙️</p>
          </div>
        </div>

        {messages.map((msg) => (
          msg.isSystem ? (
            <div key={msg.id} className="flex justify-center my-2">
              <span className="bg-slate-200/50 px-3 py-0.5 rounded-full text-[10px] text-slate-500 font-medium">
                {msg.text}
              </span>
            </div>
          ) : (
            <div key={msg.id} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-1`}>
              <Avatar className="w-10 h-10 shrink-0 shadow-sm border border-white">
                <AvatarImage src={msg.avatar} />
                <AvatarFallback>{msg.user[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-bold ${msg.color}`}>{msg.user}</span>
                  {msg.role === 'admin' && <Badge className="h-4 text-[8px] px-1 bg-red-50 text-red-600 border-red-100">مدير</Badge>}
                  {msg.role === 'mod' && <Badge className="h-4 text-[8px] px-1 bg-blue-50 text-blue-600 border-blue-100">مشرف</Badge>}
                </div>
                <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tr-none shadow-sm border border-slate-100 inline-block max-w-[90%] relative group">
                  <p className="text-[13px] text-slate-700 leading-relaxed break-words">{msg.text}</p>
                  <span className="absolute -bottom-5 left-1 text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {msg.time}
                  </span>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-10">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <Button type="button" variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary hover:bg-primary/5">
              <ImageIcon size={22} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-pink-500 hover:bg-pink-50">
              <Gift size={22} />
            </Button>
          </div>
          <div className="flex-1 relative group">
            <Input 
              placeholder="اكتب رسالتك هنا..." 
              className="pr-10 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-primary focus-visible:bg-white transition-all shadow-inner"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-10 w-10 rounded-full text-slate-400 hover:text-amber-500">
              <Smile size={22} />
            </Button>
          </div>
          <Button 
            type="submit" 
            disabled={!message.trim()}
            className={`w-12 h-12 rounded-2xl p-0 shadow-lg transition-all duration-300 ${message.trim() ? 'bg-primary shadow-primary/30 scale-100' : 'bg-slate-200 shadow-none scale-95'}`}
          >
            <Send size={20} className="rotate-180" />
          </Button>
        </form>
        
        {/* Quick Actions/Shortcuts */}
        <div className="flex gap-4 mt-3 px-2 overflow-x-auto no-scrollbar">
           <button type="button" className="text-[10px] font-bold text-slate-400 hover:text-primary whitespace-nowrap"># ترحيب</button>
           <button type="button" className="text-[10px] font-bold text-slate-400 hover:text-primary whitespace-nowrap"># منورين</button>
           <button type="button" className="text-[10px] font-bold text-slate-400 hover:text-primary whitespace-nowrap"># قوانين_الغرفة</button>
           <button type="button" className="text-[10px] font-bold text-slate-400 hover:text-primary whitespace-nowrap"># مسابقات</button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;