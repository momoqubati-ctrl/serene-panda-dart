"use client";

import React from 'react';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MOCK_STORIES = [
  { id: 1, name: 'أحمد', avatar: 'https://i.pravatar.cc/150?u=11', viewed: false },
  { id: 2, name: 'سارة', avatar: 'https://i.pravatar.cc/150?u=12', viewed: true },
  { id: 3, name: 'خالد', avatar: 'https://i.pravatar.cc/150?u=13', viewed: false },
  { id: 4, name: 'ليلى', avatar: 'https://i.pravatar.cc/150?u=14', viewed: true },
  { id: 5, name: 'ياسين', avatar: 'https://i.pravatar.cc/150?u=15', viewed: false },
  { id: 6, name: 'نورة', avatar: 'https://i.pravatar.cc/150?u=16', viewed: false },
];

const StoriesBar = () => {
  return (
    <div className="bg-white border-b border-slate-100 py-3 px-2 overflow-x-auto flex gap-3 no-scrollbar shrink-0 ltr">
      {/* Add Story */}
      <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
        <div className="relative">
          <Avatar className="w-12 h-12 border-2 border-slate-100 p-0.5 group-hover:border-primary transition-colors">
            <AvatarImage src="https://i.pravatar.cc/150?u=me" />
            <AvatarFallback>أنا</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5 border-2 border-white shadow-sm">
            <Plus size={10} strokeWidth={4} />
          </div>
        </div>
        <span className="text-[9px] font-bold text-slate-400">Story</span>
      </div>

      {/* Friends Stories */}
      {MOCK_STORIES.map((story) => (
        <div key={story.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
          <div className={`rounded-full p-0.5 border-2 transition-transform group-hover:scale-105 ${story.viewed ? 'border-slate-200' : 'border-primary'}`}>
            <Avatar className="w-12 h-12 border-2 border-white">
              <AvatarImage src={story.avatar} />
              <AvatarFallback>{story.name[0]}</AvatarFallback>
            </Avatar>
          </div>
          <span className="text-[9px] font-bold text-slate-500 truncate w-12 text-center">{story.name}</span>
        </div>
      ))}
    </div>
  );
};

export default StoriesBar;