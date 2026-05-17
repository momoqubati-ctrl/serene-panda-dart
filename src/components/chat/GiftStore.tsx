"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Gift, Star, Heart, Flame, Trophy } from 'lucide-react';

const GIFTS = [
  { id: 1, name: 'وردة حمراء', price: 10, icon: '🌹', category: 'common' },
  { id: 2, name: 'قلب ذهبي', price: 50, icon: '💖', category: 'rare' },
  { id: 3, name: 'سيارة رياضية', price: 500, icon: '🏎️', category: 'epic' },
  { id: 4, name: 'طائرة خاصة', price: 2000, icon: '🛩️', category: 'legendary' },
  { id: 5, name: 'تاج الملك', price: 5000, icon: '👑', category: 'legendary' },
  { id: 6, name: 'خاتم ألماس', price: 1000, icon: '💎', category: 'epic' },
];

const GiftStore = () => {
  return (
    <div className="p-4 space-y-6 pb-24 rtl">
      <div className="bg-gradient-to-r from-amber-400 to-yellow-600 p-6 rounded-3xl text-white shadow-lg shadow-yellow-500/20">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold mb-1">متجر الهدايا</h3>
            <p className="text-white/80 text-xs">أرسل الهدايا لأصدقائك لزيادة شعبيتهم</p>
          </div>
          <div className="bg-card/20 px-4 py-2 rounded-2xl backdrop-blur-sm flex items-center gap-2">
            <Coins size={20} className="text-yellow-200" />
            <span className="font-bold">2,450</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {GIFTS.map((gift) => (
          <Card key={gift.id} className="border-none shadow-sm rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="text-5xl mb-4 transform hover:scale-110 transition-transform duration-300">
                {gift.icon}
              </div>
              <h4 className="font-bold text-foreground mb-1">{gift.name}</h4>
              <div className="flex items-center gap-1 text-amber-600 font-bold text-sm mb-4">
                <Coins size={14} />
                <span>{gift.price}</span>
              </div>
              <Button className="w-full rounded-xl h-9 text-xs font-bold" variant={gift.category === 'legendary' ? 'default' : 'secondary'}>
                شراء وإهداء
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
        <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500" />
          أكثر الهدايا إرسالاً اليوم
        </h4>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">{i}</span>
                <span className="text-2xl">🌹</span>
                <span className="font-medium text-foreground">وردة حمراء</span>
              </div>
              <span className="text-muted-foreground text-xs">1,240 مرة</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GiftStore;