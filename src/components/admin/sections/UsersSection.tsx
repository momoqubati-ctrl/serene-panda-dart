"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, Ban } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminDataTable from '../shared/AdminDataTable';
import { getAdminHeaders } from '../utils';

const UsersSection = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    fetch(`/api/admin/users?search=${search}`, { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) setUsers(data.users);
        setLoading(false);
      });
  };

  useEffect(() => { fetchUsers(); }, []);

  const columns = [
    {
      key: "displayName",
      label: "العضو",
      render: (_: any, u: any) => (
        <div className="flex items-center gap-3">
          <img src={u.avatarUrl || '/pic.png'} className="w-10 h-10 rounded-xl object-cover border border-slate-100" alt="" />
          <div>
            <div className="font-black text-slate-800 dark:text-white">{u.displayName}</div>
            <div className="text-[10px] font-bold text-slate-400" dir="ltr">#{u.idreg}</div>
          </div>
        </div>
      )
    },
    { key: "role", label: "الرتبة", render: (val: any) => <span className="font-bold text-primary">{val}</span> },
    {
      key: "status",
      label: "الحالة",
      render: (val: any) => (
        <Badge className={val === 'active' ? 'bg-green-500/10 text-green-600 border-none' : 'bg-red-500/10 text-red-600 border-none'}>
          {val === 'active' ? 'نشط' : 'مكتوم'}
        </Badge>
      )
    },
    { key: "evaluation", label: "النقاط", render: (val: any) => <span className="font-black text-slate-500">{val}</span> },
    {
      key: "actions",
      label: "إجراءات",
      render: () => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-blue-500 hover:bg-blue-50"><UserCog size={18} /></Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50"><Ban size={18} /></Button>
        </div>
      )
    }
  ];

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xl font-black">إدارة الأعضاء</CardTitle>
          <div className="flex items-center gap-2">
            <Input 
              placeholder="بحث بالاسم أو المعرف..." 
              className="w-full md:w-72 h-11 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            />
            <Button onClick={fetchUsers} className="h-11 px-6 rounded-2xl font-bold">بحث</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <AdminDataTable columns={columns} rows={users} loading={loading} />
      </CardContent>
    </Card>
  );
};

export default UsersSection;