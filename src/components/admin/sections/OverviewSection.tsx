"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare, Ban, BellRing } from 'lucide-react';
import { getAdminHeaders } from '../utils';

const OverviewSection = () => {
  const [stats, setStats] = useState({ users: 0, banned: 0, rooms: 0, reports: 0 });

  useEffect(() => {
    fetch('/api/admin/stats', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => data.success && setStats(data.stats));
  }, []);

  const cards = [
    { label: 'إجمالي الأعضاء', value: stats.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'المحظورين', value: stats.banned, icon: Ban, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'الغرف النشطة', value: stats.rooms, icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'سجل الإشراف', value: stats.reports, icon: BellRing, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((c, i) => (
        <Card key={i} className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${c.bg} dark:bg-slate-800 transition-colors`}>
              <c.icon className={c.color} size={28} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{c.label}</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{c.value.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OverviewSection;