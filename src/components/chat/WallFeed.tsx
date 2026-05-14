"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, Mic, Send, Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";

const MOCK_POSTS = [
  {
    id: 1,
    user: { name: 'المدير العام', avatar: 'https://i.pravatar.cc/150?u=1', role: 'admin' },
    content: 'أهلاً بكم جميعاً في النسخة الجديدة من دردشة دياد! نتمنى لكم وقتاً ممتعاً.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    likes: 124,
    comments: 15,
    time: 'منذ ساعتين'
  },
  {
    id: 2,
    user: { name: 'سارة', avatar: 'https://i.pravatar.cc/150?u=12', role: 'member' },
    content: 'هل يوجد مسابقات اليوم في غرفة المسابقات؟',
    likes: 45,
    comments: 8,
    time: 'منذ 30 دقيقة'
  }
];

const WallFeed = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full bg-slate-50 rtl">
      {/* Search Header */}
      <div className="p-3 bg-[#2c3e50] flex items-center gap-2">
        <div className="flex-1 relative">
          <Input 
            placeholder="بحث في الحائط .." 
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

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Post Creator */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-3">
            <div className="flex gap-2 mb-3">
              <Avatar className="w-9 h-9 rounded-lg">
                <AvatarImage src="https://i.pravatar.cc/150?u=me" />
                <AvatarFallback>أنا</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-slate-100 rounded-lg px-3 py-2 text-slate-500 text-[11px] flex items-center cursor-pointer hover:bg-slate-200 transition-colors font-medium">
                بماذا تفكر يا بطل؟
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600 gap-1.5 rounded-lg hover:bg-slate-100">
                  <ImageIcon size={16} className="text-green-500" />
                  <span className="text-[10px] font-bold">صورة</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600 gap-1.5 rounded-lg hover:bg-slate-100">
                  <Mic size={16} className="text-red-500" />
                  <span className="text-[10px] font-bold">صوت</span>
                </Button>
              </div>
              <Button size="sm" className="h-8 rounded-lg px-4 text-[10px] font-bold">نشر</Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        {MOCK_POSTS.map((post) => (
          <Card key={post.id} className="border-none shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="p-3 flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Avatar className="w-9 h-9 rounded-lg border border-slate-100">
                  <AvatarImage src={post.user.avatar} />
                  <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-black text-[11px] text-slate-800">{post.user.name}</h4>
                  <p className="text-[9px] text-slate-400 font-bold">{post.time}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal size={16} />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-3 pb-2 text-[11px] text-slate-700 leading-relaxed font-medium">
                {post.content}
              </div>
              {post.image && (
                <div className="w-full aspect-video overflow-hidden">
                  <img src={post.image} alt="post" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-2 flex items-center justify-between border-t mt-1">
                <div className="flex gap-3">
                  <button className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors">
                    <Heart size={16} />
                    <span className="text-[10px] font-bold">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1 text-slate-500 hover:text-primary transition-colors">
                    <MessageCircle size={16} />
                    <span className="text-[10px] font-bold">{post.comments}</span>
                  </button>
                </div>
                <button className="text-slate-500 hover:text-primary transition-colors">
                  <Share2 size={16} />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WallFeed;
