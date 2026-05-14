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
  Trophy,
  Sparkles
} from 'lucide-react';

const MOCK_MESSAGES = [
  { id: 1, user: 'المدير العام', role: 'admin', text: 'أهلاً بك في غرفتنا المتواضعة! 🌹 نرجو الالتزام بالقوانين.', time: '10:45 ص', color: 'text-red-600', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, user: 'سارة', role: 'member', text: 'صباح الخير للجميع، كيف الحال؟ ✨', time: '10:46 ص', color: 'text-pink-600', avatar: 'https://i.pravatar.cc/150?u=12' },
  { id: 3, user: 'أحمد محمد', role: 'mod', text: 'منورين جميعاً يا شباب! الغرفة منورة بوجودكم.', time: '10:47 ص', color: 'text-blue-600', avatar: 'https://i.pravatar.cc/150?u=11' },
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
    <div className="flex flex-col h-full bg-[#F1F5F9] fixed inset-0 z-[60] rtl animate-in slide-in-from-left duration-300">
      {/* Room Header - More Vibrant */}
      <header className="bg-white border-b-2 border-slate-100 px-4 py-3 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-slate-100 text-slate-700">
            <ChevronRight size={24} />
          </Button>
          <div className="relative">
            <Avatar className="w-12 h-12 rounded-2xl border-2 border-primary shadow-sm">
              <AvatarImage src={room.image} />
              <AvatarFallback>{room.name[0]}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-slate-900 text-sm">{room.name}</h3>
              {room.locked && <ShieldCheck size={14} className="text-amber-500" />}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
              <span className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded-md"><Users size={10} /> {room.members}</span>
              <span className="flex items-center gap-0.5 text-primary bg-primary/5 px-1.5 py-0.5 rounded-md"><Crown size={10} /> {room.owner}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="hidden sm:flex bg-gradient-to-r from-amber-400 to-orange-500 rounded-full px-3 py-1 items-center gap-1.5 shadow-sm">
             <Trophy size={14} className="text-white" />
             <span className="text-[10px] font-black text-white">LVL 24</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="rounded-full hover:bg-slate-100">
            {isMuted ? <VolumeX size={22} className="text-red-500" /> : <Volume2 size={22} className="text-slate-700" />}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
            <MoreVertical size={22} className="text-slate-700" />
          </Button>
        </div>
      </header>

      {/* Mics Section - Enhanced Contrast */}
      <div className="bg-white border-b-2 border-slate-100 p-4 flex justify-between items-center gap-2 overflow-x-auto no-scrollbar shadow-sm">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 min-w-[68px]">
            <div className="relative group cursor-pointer">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${i === 1 ? 'bg-white border-4 border-primary shadow-xl shadow-primary/20 scale-105' : 'bg-slate-50 border-2 border-dashed border-slate-300 hover:border-primary/50'}`}>
                {i === 1 ? (
                   <div className="relative">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src="https://i.pravatar.cc/150?u=1" />
                        <AvatarFallback>م</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full shadow-md">
                        <Mic2 size={12} strokeWidth={3} />
                      </div>
                   </div>
                ) : (
                  <Mic2 size={24} className="text-slate-300 group-hover:text-primary transition-colors" />
                )}
              </div>
              <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-black border-2 border-white shadow-md">{i}</span>
            </div>
            <span className={`text-[11px] font-black truncate max-w-[64px] ${i === 1 ? 'text-primary' : 'text-slate-400'}`}>
              {i === 1 ? 'المدير' : 'ميك مغلق'}
            </span>
          </div>
        ))}
      </div>

      {/* Messages Area - Better Readability */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
        <div className="flex justify-center my-2">
          <div className="bg-primary/10 backdrop-blur-sm px-5 py-2 rounded-2xl border border-primary/20 shadow-sm flex items-center gap-2">
            <Sparkles size={14} className="text-primary animate-pulse" />
            <p className="text-[11px] text-primary font-black">بث مباشر من الغرفة الرئيسية 🎙️</p>
          </div>
        </div>

        {messages.map((msg) => (
          msg.isSystem ? (
            <div key={msg.id} className="flex justify-center my-2">
              <span className="bg-slate-200/80 px-4 py-1 rounded-full text-[10px] text-slate-600 font-bold shadow-sm">
                {msg.text}
              </span>
            </div>
          ) : (
            <div key={msg.id} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2`}>
              <Avatar className="w-11 h-11 shrink-0 shadow-md border-2 border-white">
                <AvatarImage src={msg.avatar} />
                <AvatarFallback>{msg.user[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-black ${msg.color}`}>{msg.user}</span>
                  {msg.role === 'admin' && <Badge className="h-4 text-[9px] px-1.5 bg-red-600 text-white border-none font-black">مدير</Badge>}
                  {msg.role === 'mod' && <Badge className="h-4 text-[9px] px-1.5 bg-blue-600 text-white border-none font-black">مشرف</Badge>}
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tr-none shadow-md border border-slate-100 inline-block max-w-[92%] relative group">
                  <p className="text-[14px] text-slate-800 font-medium leading-relaxed break-words">{msg.text}</p>
                  <div className="flex justify-end mt-1">
                    <span className="text-[9px] text-slate-400 font-bold">
                      {msg.time}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Input Area - High Contrast & Powerful Design */}
      <div className="bg-white border-t-2 border-slate-200 p-4 pb-10 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-10">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" className="rounded-2xl w-11 h-11 text-slate-500 hover:text-primary hover:bg-primary/10 transition-all">
              <ImageIcon size={24} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="rounded-2xl w-11 h-11 text-slate-500 hover:text-pink-600 hover:bg-pink-50 transition-all">
              <Gift size={24} />
            </Button>
          </div>
          
          <div className="flex-1 relative group">
            <Input 
              placeholder="اكتب رسالتك هنا..." 
              className="pr-12 h-14 bg-slate-100 border-2 border-slate-200 rounded-2xl focus-visible:ring-primary focus-visible:border-primary focus-visible:bg-white transition-all shadow-sm text-slate-900 font-bold placeholder:text-slate-400"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button type="button" variant="ghost" size="icon" className="absolute right-1.5 top-1.5 h-11 w-11 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors">
              <Smile size={24} />
            </Button>
          </div>

          <Button 
            type="submit" 
            disabled={!message.trim()}
            className={`w-14 h-14 rounded-2xl p-0 shadow-xl transition-all duration-300 transform active:scale-90 ${message.trim() ? 'bg-primary hover:bg-primary/90 shadow-primary/40 scale-100' : 'bg-slate-300 shadow-none scale-95'}`}
          >
            <Send size={24} className="rotate-180 text-white" strokeWidth={3} />
          </Button>
        </form>
        
        {/* Quick Actions - More Visible */}
        <div className="flex gap-3 mt-4 px-1 overflow-x-auto no-scrollbar">
           <QuickAction label="ترحيب 👋" />
           <QuickAction label="منورين ✨" />
           <QuickAction label="قوانين الغرفة 📜" />
           <QuickAction label="مسابقات 🏆" />
           <QuickAction label="طلب ميك 🎙️" />
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ label }: { label: string }) => (
  <button type="button" className="text-[11px] font-black text-slate-500 bg-slate-100 hover:bg-primary hover:text-white px-4 py-2 rounded-xl whitespace-nowrap transition-all shadow-sm border border-slate-200">
    {label}
  </button>
);

export default RoomPage;