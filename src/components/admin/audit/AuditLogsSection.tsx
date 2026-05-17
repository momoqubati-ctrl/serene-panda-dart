"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Search, Download, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminDataTable from '../shared/AdminDataTable';
import { getAdminHeaders, formatAdminDate } from '../utils';

const AuditLogsSection = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/audit-logs', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) setLogs(data.logs);
        setLoading(false);
      });
  }, []);

  const columns = [
    {
      key: "actorName",
      label: "المسؤول",
      render: (val: any, row: any) => (
        <div className="flex flex-col">
          <span className="font-black text-primary">{val}</span>
          <span className="text-[10px] text-muted-foreground font-bold">{row.actorRole}</span>
        </div>
      )
    },
    {
      key: "action",
      label: "العملية",
      render: (val: any) => (
        <Badge variant="secondary" className="font-black bg-slate-100 text-slate-600 border-none">
          {val}
        </Badge>
      )
    },
    {
      key: "targetId",
      label: "المستهدف",
      render: (val: any, row: any) => (
        <div className="flex flex-col">
          <span className="font-bold">{val || '-'}</span>
          <span className="text-[9px] text-muted-foreground">{row.targetType}</span>
        </div>
      )
    },
    {
      key: "metadata",
      label: "التفاصيل",
      render: (val: any) => (
        <span className="text-[10px] font-medium text-slate-500 truncate max-w-[200px] block">
          {JSON.stringify(val)}
        </span>
      )
    },
    { key: "createdAt", label: "الوقت", render: (val: any) => <span className="text-[10px] font-bold text-slate-400" dir="ltr">{formatAdminDate(val)}</span> },
    {
      key: "actions",
      label: "عرض",
      render: () => (
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100"><Eye size={16} /></Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">سجل العمليات (Audit)</h2>
          <p className="text-sm text-muted-foreground font-medium">سجل كامل لكل التغييرات التي تمت عبر لوحة التحكم</p>
        </div>
        <Button variant="outline" className="rounded-xl gap-2 font-bold">
          <Download size={16} /> تصدير CSV
        </Button>
      </div>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="بحث في سجل العمليات..." 
                className="h-11 pr-10 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button className="h-11 px-8 rounded-2xl font-bold">بحث</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <AdminDataTable columns={columns} rows={logs} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsSection;