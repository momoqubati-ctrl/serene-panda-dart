"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Search, Filter, ShieldAlert } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminDataTable from '../shared/AdminDataTable';
import { getAdminHeaders, formatAdminDate } from '../utils';

const ModerationSection = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchEvents = () => {
    setLoading(true);
    fetch(`/api/admin/moderation-events?search=${search}`, { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) setEvents(data.events);
        setLoading(false);
      });
  };

  useEffect(() => { fetchEvents(); }, []);

  const columns = [
    {
      key: "actorName",
      label: "المشرف",
      render: (val: any, row: any) => (
        <div className="flex flex-col">
          <span className="font-black text-primary">{val}</span>
          <span className="text-[10px] text-muted-foreground font-bold">{row.actorRole}</span>
        </div>
      )
    },
    {
      key: "eventType",
      label: "الإجراء",
      render: (val: any) => {
        const colors: any = {
          kick: "bg-amber-500/10 text-amber-600",
          ban: "bg-red-500/10 text-red-600",
          mute: "bg-slate-500/10 text-slate-600",
          alert: "bg-blue-500/10 text-blue-600",
          role_change: "bg-purple-500/10 text-purple-600"
        };
        return <Badge className={`${colors[val] || 'bg-slate-100'} border-none font-black`}>{val}</Badge>;
      }
    },
    {
      key: "targetName",
      label: "المستهدف",
      render: (val: any, row: any) => (
        <div className="flex flex-col">
          <span className="font-bold">{val || 'نظام'}</span>
          {row.targetIdreg && <span className="text-[9px] text-muted-foreground" dir="ltr">#{row.targetIdreg}</span>}
        </div>
      )
    },
    { key: "roomName", label: "الغرفة", render: (val: any) => <span className="text-xs font-bold text-slate-500">{val || 'عام'}</span> },
    { key: "reason", label: "السبب", render: (val: any) => <span className="text-xs truncate max-w-[150px] block">{val || '-'}</span> },
    { key: "createdAt", label: "الوقت", render: (val: any) => <span className="text-[10px] font-bold text-slate-400" dir="ltr">{formatAdminDate(val)}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">سجل الإشراف</h2>
          <p className="text-sm text-muted-foreground font-medium">متابعة تحركات المشرفين والعمليات اللحظية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2 font-bold">
            <Filter size={16} /> تصفية
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="بحث في السجل (اسم المشرف، العضو، الغرفة)..." 
                className="h-11 pr-10 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchEvents()}
              />
            </div>
            <Button onClick={fetchEvents} className="h-11 px-8 rounded-2xl font-bold">تحديث</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <AdminDataTable columns={columns} rows={events} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ModerationSection;