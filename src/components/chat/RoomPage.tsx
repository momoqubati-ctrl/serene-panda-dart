"use client";

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  VolumeX
} from 'lucide-react';

const RoomPage = ({ room, onBack }: any) => {
  const [isMuted, setIsMuted] = useState(false);
  const [message, setMessage] = useState('');

  return (
    <div className="flex flex-col h-full bg-slate-50 fixed inset-0 z-50 rtl">
      {/* Room Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ChevronRight size={24} />
          </Button>
          <Avatar className="w-10 h-10 rounded-xl">
            <AvatarImage src={room.image} />
            <AvatarFallback>{room.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">{room.name}</h3>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-0.5"><Users size={10} /> {room.members}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span>بواسطة: {room.owner}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="rounded-full">
            {isMuted ? <VolumeX size={20} className="text-red-500" /> : <Volume2 size={20} className="text-slate-600" />}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreVertical size={20} className="text-slate-600" />
          </Button>
        </div>
      </header>

      {/* Mics Section */}
      <div className="bg-white/50 backdrop-blur-sm p-4 border-b grid grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                <Mic2 size={18} />
              </div>
              <span className="absolute -top-1 -right-1 bg-slate-800 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{i}</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400">فارغ</span>
          </div>
        ))}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-primary/5 border border-primary/10 p-3 rounded-2xl text-center">
          <p className="text-xs text-primary font-bold">أهلاً بك في {room.name}! يرجى الالتزام بالقوانين.</p>
        </div>

        {/* Sample Message */}
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarImage src="https://i.pravatar.cc/150?u=1" />
            <AvatarFallback>م</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-red-600">المدير العام</span>
              <Badge className="h-4 text-[8px] px-1 bg-red-50 text-red-600 border-red-100">مدير</Badge>
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tr-none shadow-sm inline-block max-w-[85%]">
              <p className="text-sm text-slate-700">منورين جميعاً في الغرفة! 🌹</p>
            </div>
            <span className="block text-[9px] text-slate-400 mt-1">10:45 ص</span>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-3 pb-6">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
              <ImageIcon size={22} />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
              <Gift size={22} />
            </Button>
          </div>
          <div className="flex-1 relative">
            <Input 
              placeholder="اكتب رسالتك..." 
              className="pr-10 h-11 bg-slate-50 border-none rounded-2xl"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button variant="ghost" size="icon" className="absolute right-1 top-1 rounded-full text-slate-400">
              <Smile size={20} />
            </Button>
          </div>
          <Button className="w-11 h-11 rounded-2xl p-0 shadow-lg shadow-primary/20">
            <Send size={20} className="rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;