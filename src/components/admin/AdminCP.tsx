"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  Ban, 
  Settings, 
  BarChart3,
  Lock,
  Globe,
  BellRing
} from 'lucide-react';

const AdminCP = () => {
  const stats = [
    { label: 'إجمالي الأعضاء', value: '12,450', icon: Users, color: 'text-blue-500' },
    { label: 'المحظورين', value: '124', icon: Ban, color: 'text-red-500' },
    { label: 'الغرف النشطة', value: '45', icon: MessageSquare, color: 'text-green-500' },
    { label: 'تقارير اليوم', value: '12', icon: BellRing, color: 'text-amber-500' },
  ];

  return (
    <div className="p-4 space-y-6 rtl">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 rounded-xl">
          <ShieldCheck className="text-primary" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-slate-200">لوحة التحكم</h3>
          <p className="text-[10px] text-slate-500 font-medium">إدارة النظام والصلاحيات</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => {
          const IconComponent = stat.icon;
          return (
            <Card key={i} className="bg-white/5 border-white/10 shadow-none rounded-2xl">
              <CardContent className="p-3">
                <IconComponent className={`${stat.color} mb-2`} size={18} />
                <div className="text-lg font-black text-white">{stat.value}</div>
                <div className="text-[9px] font-bold text-slate-500 uppercase">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-2">
        <h4 className="text-[10px] font-bold text-slate-500 px-2 uppercase tracking-wider">الإعدادات السريعة</h4>
        <AdminAction icon={<Settings size={18} />} label="إعدادات الموقع العامة" />
        <AdminAction icon={<Lock size={18} />} label="إدارة الرتب والصلاحيات" />
        <AdminAction icon={<Globe size={18} />} label="إدارة الغرف والدول" />
        <AdminAction icon={<BarChart3 size={18} />} label="سجلات النظام والأحداث" />
      </div>
    </div>
  );
};

const AdminAction = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <button className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group border border-white/5">
    <div className="flex items-center gap-3">
      <div className="text-slate-400 group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="text-xs font-bold text-slate-300">{label}</span>
    </div>
  </button>
);

export default AdminCP;