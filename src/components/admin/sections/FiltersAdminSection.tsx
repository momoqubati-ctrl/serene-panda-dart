"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ban, Search, Trash2, ShieldAlert, Eye, History, AlertTriangle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AdminDataTable from '../shared/AdminDataTable';
import { getAdminHeaders, formatAdminDate } from '../utils';
import { useConfirm } from '@/hooks/use-confirm';
import { showSuccess, showError } from '@/utils/toast';

const FiltersAdminSection = () => {
  const [filters, setFilters] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules');
  const { confirm } = useConfirm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, lRes] = await Promise.all([
        fetch('/api/admin/filters', { headers: getAdminHeaders() }),
        fetch('/api/admin/filter-logs', { headers: getAdminHeaders() })
      ]);
      const fData = await fRes.json();
      const lData = await lRes.json();
      if (fData.success) setFilters(fData.filters);
      if (lData.success) setLogs(lData.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleClearLogs = async () => {
    const ok = await confirm({
      title: "تفريغ سجل الرصد",
      message: "هل أنت متأكد من رغبتك في حذف جميع سجلات الكلمات الملتقطة؟ لا يمكن التراجع عن هذا الإجراء.",
      variant: "destructive",
      confirmText: "نعم، مسح الكل"
    });

    if (ok) {
      const res = await fetch('/api/admin/filter-logs', { 
        method: 'DELETE', 
        headers: getAdminHeaders() 
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(data.message);
        setLogs([]);
      } else {
        showError(data.message);
      }
    }
  };

  const ruleColumns = [
    { 
      key: "pattern", 
      label: "الكلمه",
      render: (val: any) => <span className="font-black text-slate-800 dark:text-white">{val}</span>
    },
    { 
      key: "action", 
      label: "التصنيف",
      render: (val: any) => (
        <Badge className={`${val === 'block' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'} border-none font-black`}>
          {val === 'block' ? 'ممنوعة' : 'مراقبة'}
        </Badge>
      )
    },
    { key: "scope", label: "النطاق", render: (val: any) => <span className="text-xs font-bold text-slate-400">{val}</span> },
    {
      key: "actions",
      label: "حذف",
      render: () => <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-50"><Trash2 size={16} /></Button>
    }
  ];

  const logColumns = [
    {
      key: "v",
      label: "الكلمة",
      render: (val: any, row: any) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-800 dark:text-white">{val}</span>
          <Badge variant="outline" className={`text-[8px] h-3.5 w-fit mt-1 ${row.type === 'bmsgs' ? 'text-red-500 border-red-100' : 'text-amber-500 border-amber-100'}`}>
            {row.type === 'bmsgs' ? 'ممنوعة' : 'مراقبة'}
          </Badge>
        </div>
      )
    },
    {
      key: "topic",
      label: "العضو (الكاتب)",
      render: (val: any, row: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-primary">{val}</span>
          <span className="text-[9px] text-slate-400" dir="ltr">{row.ip}</span>
        </div>
      )
    },
    { key: "source", label: "المصدر", render: (val: any) => <span className="text-xs font-bold">{val}</span> },
    { key: "msg", label: "الرسالة الكاملة", render: (val: any) => <span className="text-[10px] font-medium text-slate-500 truncate max-w-[200px] block">{val}</span> },
    { key: "createdAt", label: "آخر رصد", render: (val: any) => <span className="text-[10px] font-bold text-slate-400" dir="ltr">{formatAdminDate(Number(val))}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">نظام الفلترة والرصد</h2>
          <p className="text-sm text-muted-foreground font-medium">إدارة قوانين الكلمات ومتابعة سجلات الرصد الذكي</p>
        </div>
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('rules')}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'rules' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
          >
            قائمة القوانين
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'logs' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
          >
            سجل الرصد
          </button>
        </div>
      </div>

      {activeTab === 'rules' ? (
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-row items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input placeholder="بحث في الكلمات المضافة..." className="h-11 pr-10 rounded-2xl bg-slate-50 border-none" />
            </div>
            <Button className="rounded-2xl h-11 px-6 font-black shadow-lg shadow-primary/20">+ إضافة قانون</Button>
          </CardHeader>
          <CardContent className="p-0">
            <AdminDataTable columns={ruleColumns} rows={filters} loading={loading} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-amber-600">
              <History size={20} />
              <span className="text-sm font-black">يتم الاحتفاظ بآخر 35 حركة رصد فقط</span>
            </div>
            <Button variant="ghost" onClick={handleClearLogs} className="text-red-500 hover:bg-red-50 font-black gap-2 rounded-xl">
              <Trash2 size={18} /> تفريغ السجل نهائياً
            </Button>
          </div>
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <AdminDataTable columns={logColumns} rows={logs} loading={loading} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FiltersAdminSection;