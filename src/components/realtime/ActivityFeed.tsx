"use client";

import React from 'react';
import { useRealtimeStore } from '@/lib/realtime-store';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Heart, UserPlus, LogIn, Gift, MessageSquare } from 'lucide-react';

const ActivityFeed = () => {
  const activities = useRealtimeStore((state) => state.activityFeed);

  const getIcon = (verb: string) => {
    switch (verb) {
      case 'joined': return <LogIn className="text-green-500" size={14} />;
      case 'followed': return <UserPlus className="text-blue-500" size={14} />;
      case 'sent_gift': return <Gift className="text-pink-500" size={14} />;
      case 'reacted': return <Heart className="text-red-500" size={14} />;
      default: return <MessageSquare className="text-slate-400" size={14} />;
    }
  };

  const getMessage = (activity: any) => {
    const actor = <span className="font-black text-slate-800 dark:text-white">{activity.actorName}</span>;
    switch (activity.verb) {
      case 'joined': return <>{actor} دخل الغرفة {activity.metadata?.roomName}</>;
      case 'followed': return <>{actor} بدأ بمتابعة {activity.metadata?.targetName}</>;
      case 'sent_gift': return <>{actor} أرسل هدية إلى {activity.metadata?.targetName}</>;
      case 'posted': return <>{actor} نشر تحديثاً جديداً على الحائط</>;
      default: return <>{actor} قام بنشاط جديد</>;
    }
  };

  return (
    <div className="space-y-3 p-2">
      <AnimatePresence initial={false}>
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
          >
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl shrink-0">
              {getIcon(activity.verb)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                {getMessage(activity)}
              </p>
              <span className="text-[9px] font-black text-slate-400 uppercase mt-1 block">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ar })}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {activities.length === 0 && (
        <div className="py-10 text-center text-slate-400">
          <p className="text-xs font-bold">لا توجد نشاطات حالياً</p>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;