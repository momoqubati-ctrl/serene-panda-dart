"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AdminDataTable from '../shared/AdminDataTable';
import { getAdminHeaders } from '../utils';

const RoomsSection = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/rooms', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) setRooms(data.rooms);
        setLoading(false);
      });
  }, []);

  const columns = [
    {
      key: "name",
      label: "الغرفة",
      render: (_: any, r: any) => (
        <div className="flex items-center gap-3">
          <img src={r.avatarUrl || '/room.png'} className="w-10 h-10 rounded-xl object-cover border border-slate-100" alt="" />
          <div>
            <div className="font-black text-slate-800 dark:text-white">{r.name}</div>
            <div className="text-[10px] font-bold text-slate-400" dir="ltr">/{r.slug}</div>
          </div>
        </div>
      )
    },
    { key: "ownerName", label: "المالك", render: (val: any) => <span className="font-bold text-primary">{val || 'الإدارة'}</span> },
    { key: "maxMembers", label: "السعة", render: (val: any) => <span className="font-black text-slate-500">{val}</span> },
    { key: "micSlots", label: "المايكات", render: (val: any) => <span className="font-black text-slate-500">{val}</span> },
    {
      key: "actions",
      label: "إجراءات",
      render: () => (
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:bg-slate-100"><SettingsIcon size={18} /></Button>
      )
    }
  ];

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-xl font-black">إدارة الغرف</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <AdminDataTable columns={columns} rows={rooms} loading={loading} />
      </CardContent>
    </Card>
  );
};

export default RoomsSection;