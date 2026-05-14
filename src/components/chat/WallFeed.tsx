"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, Mic, Send } from 'lucide-react';
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
  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Post Creator */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-3 mb-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src="https://i.pravatar.cc/150?u=me" />
              <AvatarFallback>أنا</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-slate-100 rounded-2xl px-4 py-2 text-slate-500 text-sm flex items-center cursor-pointer hover:bg-slate-200 transition-colors">
              بماذا تفكر يا بطل؟
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-slate-600 gap-2 rounded-xl">
                <ImageIcon size={18} className="text-green-500" />
                <span className="text-xs font-bold">صورة</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-600 gap-2 rounded-xl">
                <Mic size={18} className="text-red-500" />
                <span className="text-xs font-bold">صوت</span>
              </Button>
            </div>
            <Button size="sm" className="rounded-xl px-6 font-bold">نشر</Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {MOCK_POSTS.map((post) => (
        <Card key={post.id} className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="p-4 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border">
                <AvatarImage src={post.user.avatar} />
                <AvatarFallback>{post.user.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-bold text-sm text-slate-800">{post.user.name}</h4>
                <p className="text-[10px] text-slate-400">{post.time}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreHorizontal size={18} />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-4 pb-3 text-sm text-slate-700 leading-relaxed">
              {post.content}
            </div>
            {post.image && (
              <div className="w-full aspect-video overflow-hidden">
                <img src={post.image} alt="post" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4 flex items-center justify-between border-t mt-2">
              <div className="flex gap-4">
                <button className="flex items-center gap-1.5 text-slate-500 hover:text-red-500 transition-colors">
                  <Heart size={20} />
                  <span className="text-xs font-bold">{post.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-slate-500 hover:text-primary transition-colors">
                  <MessageCircle size={20} />
                  <span className="text-xs font-bold">{post.comments}</span>
                </button>
              </div>
              <button className="text-slate-500 hover:text-primary transition-colors">
                <Share2 size={20} />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WallFeed;