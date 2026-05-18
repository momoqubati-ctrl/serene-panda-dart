"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRealtimeStore } from '@/lib/realtime-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Star, Heart } from 'lucide-react';

interface LiveIdentityCardProps {
  user: any;
  size?: 'sm' | 'md' | 'lg';
}

const LiveIdentityCard = ({ user, size = 'md' }: LiveIdentityCardProps) => {
  const presence = useRealtimeStore((state) => state.presence[user.id]);
  const status = presence?.status || user.presence || 'offline';

  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-amber-500';
      case 'multitasking': return 'bg-blue-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="relative group cursor-pointer">
      {/* Animated Aura (if active) */}
      <AnimatePresence>
        {status === 'active' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.2 }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
            className="absolute inset-0 bg-primary rounded-full blur-xl"
          />
        )}
      </AnimatePresence>

      {/* Avatar with Frame */}
      <div className="relative z-10">
        <div className={`relative rounded-2xl p-1 transition-all duration-500 ${status === 'active' ? 'bg-gradient-to-tr from-primary via-purple-500 to-pink-500 animate-gradient-xy' : 'bg-slate-200'}`}>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-0.5">
            <Avatar className={`${size === 'lg' ? 'w-20 h-20' : size === 'md' ? 'w-12 h-12' : 'w-8 h-8'} rounded-lg`}>
              <AvatarImage src={user.avatarUrl || '/pic.png'} />
              <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Status Indicator */}
        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${getStatusColor()} shadow-sm`} />
      </div>

      {/* Identity Badges */}
      <div className="absolute -top-2 -left-2 flex flex-col gap-1 z-20">
        {user.isStaff && (
          <div className="bg-blue-600 text-white p-1 rounded-md shadow-lg">
            <Shield size={10} />
          </div>
        )}
        {user.trustScore > 80 && (
          <div className="bg-amber-500 text-white p-1 rounded-md shadow-lg">
            <Star size={10} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveIdentityCard;