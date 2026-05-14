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
];

const StoriesBar = () => {
  return (
    <div className="bg-white border-b py-4 px-4 overflow-x-auto flex gap-4 no-scrollbar">
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="relative">
          <Avatar className="w-16 h-16 border-2 border-slate-100 p-0.5">
            <AvatarImage src="https://i.pravatar.cc/150?u=me" />
            <AvatarFallback>أنا</AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 border-2 border-white">
            <Plus size={12} strokeWidth={3} />
          </div>
        </div>
        <span className="text-[11px] font-medium text-slate-500">قصتك</span>
      </div>

      {MOCK_STORIES.map((story) => (
        <div key={story.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
          <div className={`rounded-full p-0.5 border-2 ${story.viewed ? 'border-slate-200' : 'border-primary'}`}>
            <Avatar className="w-16 h-16 border-2 border-white">
              <AvatarImage src={story.avatar} />
              <AvatarFallback>{story.name[0]}</AvatarFallback>
            </Avatar>
          </div>
          <span className="text-[11px] font-medium text-slate-600">{story.name}</span>
        </div>
      ))}
    </div>
  );
};

export default StoriesBar;