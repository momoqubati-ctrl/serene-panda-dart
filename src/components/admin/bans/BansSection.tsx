"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ban, UserX, Globe, Monitor, ShieldX, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminDataTable from '../shared/AdminDataTable';
import { getAdminHeaders, formatAdminDate } from '../utils';

const BansSection = () => {
  const [bans, setBans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBans = () => {
    setLoading(true);
    fetch('/api/admin/bans', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) setBans(data.bans);
        setLoading(false);
      });
  };

  useEffect(() => { fetchBans(); }, []);

  const columns = [
    {
      key: "targetName",
      label: "المستهدف",
      render: (val: any, row: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg text-red-500">
            {row.type === 'ip' ? <Globe size={18} /> : row.type === 'device' ? <Monitor size={18} /> : <UserX size={18} />}
          </div>
          <div>
            <div className="font-black text-slate-800 dark:text-white">{val}</div>
            <div className="text-[10px] font-bold text-slate-400" dir="ltr">{row.value}</div>
          </div>
        </div>
      )
    },
    {
      key: "type",
      label: "النوع",
      render: (val: any) => (
        <Badge variant="outline" className="font-bold border-slate-200">
          {val === 'ip' ? 'IP' : val === 'device' ? 'جهاز' : val === 'country' ? 'دولة' : 'اسم'}
        </Badge>
      )
    },
    { key: "duration", label: "المدة", render: (val: any) => <span className="font-bold text-amber-600">{val}</span> },
    {
      key: "isActive",
      label: "الحالة",
      render: (val: any) => (
        <Badge className={val ? 'bg-red-500/10 text-red-600 border-none' : 'bg-slate-100 text-slate-400 border-none'}>
          {val ? 'نشط' : 'منتهي'}
        </Badge>
      )
    },
    { key: "createdBy", label: "بواسطة", render: (val: any) => <span className="text-xs font-bold text-primary">{val}</span> },
    { key: "createdAt", label: "التاريخ", render: (val: any) => <span className="text-[10px] font-bold text-slate-400" dir="ltr">{formatAdminDate(val)}</span> },
    {
      key: "actions",
      label: "إجراءات",
      render: () => (
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-red-400 hover:bg-red-50"><Trash2 size={18} /></Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">إدارة الحظر</h2>
          <p className="text-sm text-muted-foreground font-medium">التحكم في قائمة المطرودين والمحظورين من الموقع</p>
        </div>
        <Button className="rounded-2xl h-12 px-6 gap-2 font-black shadow-lg shadow-primary/20">
          <Plus size={20} /> إضافة حظر جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BanStatCard icon={<Globe size={20} />} label="حظر IP" value={bans.filter(b => b.type === 'ip').length} color="text-blue-500" />
        <BanStatCard icon={<Monitor size={20} />} label="حظر أجهزة" value={bans.filter(b => b.type === 'device').length} color="text-purple-500" />
        <BanStatCard icon={<ShieldX size={20} />} label="حظر دائم" value={bans.filter(b => b.duration === 'دائم').length} color="text-red-500" />
      </div>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="بحث في قائمة الحظر..." 
                className="h-11 pr-10 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button variant="outline" onClick={fetchBans} className="h-11 px-6 rounded-2xl font-bold">تحديث</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <AdminDataTable columns={columns} rows={bans} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};

const BanStatCard = ({ icon, label, value, color }: any) => (
  <Card className="border-none shadow-md rounded-2xl overflow-hidden">
    <CardContent className="p-4 flex items-center gap-4">
      <div className={`p-3 bg-slate-50 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase">{label}</p>
        <h4 className="text-xl font-black">{value}</h4>
      </div>
    </CardContent>
  </Card>
);

export default BansSection;