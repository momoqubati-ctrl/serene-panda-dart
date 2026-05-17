"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminHeaders } from '../utils';

const BotsAdminSection = () => {
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/bots', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) setBots(data.bots);
        setLoading(false);
      });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bots.map(b => (
        <Card key={b.id} className="border-none shadow-lg rounded-3xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <img src={b.avatarUrl || '/pic.png'} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100" alt="" />
              <div className="flex-1">
                <h3 className="font-black text-slate-800 dark:text-white">{b.name}</h3>
                <Badge className={b.isActive ? 'bg-green-500' : 'bg-slate-300'}>{b.isActive ? 'نشط' : 'متوقف'}</Badge>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-4 line-clamp-2">{b.description}</p>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1 rounded-xl font-bold">تعديل</Button>
              <Button variant="secondary" className="flex-1 rounded-xl font-bold">تشغيل</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BotsAdminSection;