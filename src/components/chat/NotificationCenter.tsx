"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Gift, MessageSquare, UserPlus, Heart } from 'lucide-react';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'gift', user: 'سارة', content: 'أرسلت لك "وردة حمراء" 🌹', time: 'منذ 5 دقائق', icon: <Gift className="text-pink-500" size={14} /> },
  { id: 2, type: 'like', user: 'أحمد', content: 'أعجب بمنشورك على الحائط', time: 'منذ 12 دقيقة', icon: <Heart className="text-red-500" size={14} /> },
  { id: 3, type: 'mention', user: 'خالد', content: 'قام بالإشارة إليك في الغرفة الرئيسية', time: 'منذ ساعة', icon: <MessageSquare className="text-blue-500" size={14} /> },
  { id: 4, type: 'follow', user: 'ياسين', content: 'بدأ بمتابعتك الآن', time: 'منذ ساعتين', icon: <UserPlus className="text-green-500" size={14} /> },
];

const NotificationCenter = () => {
  return (
    <div className="p-4 space-y-4 pb-24 rtl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-800">التنبيهات الأخيرة</h3>
        <button className="text-xs text-primary font-bold">تحديد الكل كمقروء</button>
      </div>

      <div className="space-y-3">
        {MOCK_NOTIFICATIONS.map((notif) => (
          <Card key={notif.id} className="border-none shadow-sm rounded-2xl overflow-hidden hover:bg-slate-50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12 border">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${notif.id + 10}`} />
                    <AvatarFallback>{notif.user[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm border">
                    {notif.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-slate-900">{notif.user}</h4>
                    <span className="text-[10px] text-slate-400">{notif.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{notif.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-4">
        <p className="text-[10px] text-slate-400 font-medium">لا يوجد المزيد من التنبيهات</p>
      </div>
    </div>
  );
};

export default NotificationCenter;