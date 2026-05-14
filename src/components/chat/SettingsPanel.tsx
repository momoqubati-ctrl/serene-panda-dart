"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Palette, 
  ShieldCheck, 
  Coins, 
  LogOut, 
  ChevronLeft, 
  Bell, 
  Lock, 
  Eye,
  Smartphone
} from 'lucide-react';

const SettingsPanel = () => {
  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Profile Summary */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-4 border-white/20">
              <AvatarImage src="https://i.pravatar.cc/150?u=me" />
              <AvatarFallback>أنا</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold">المستخدم الحالي</h3>
              <p className="text-white/80 text-sm">عضو ذهبي • 2,450 نقطة</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <Coins size={12} />
                  <span>500 كوين</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Groups */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 px-2 uppercase tracking-wider">الحساب والخصوصية</h4>
        <SettingsItem icon={<User size={20} className="text-blue-500" />} label="تعديل الملف الشخصي" />
        <SettingsItem icon={<Palette size={20} className="text-purple-500" />} label="الألوان والثيمات" />
        <SettingsItem icon={<ShieldCheck size={20} className="text-green-500" />} label="إعدادات الخصوصية" />
        <SettingsItem icon={<Bell size={20} className="text-amber-500" />} label="التنبيهات والإشعارات" />
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-400 px-2 uppercase tracking-wider">الخدمات والعملات</h4>
        <SettingsItem icon={<Coins size={20} className="text-yellow-500" />} label="متجر الكوين والهدايا" />
        <SettingsItem icon={<Smartphone size={20} className="text-indigo-500" />} label="طلب شحن رصيد" />
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-400 px-2 uppercase tracking-wider">أخرى</h4>
        <SettingsItem icon={<Lock size={20} className="text-slate-500" />} label="تغيير كلمة المرور" />
        <SettingsItem icon={<LogOut size={20} className="text-red-500" />} label="تسجيل الخروج" danger />
      </div>

      <div className="text-center pt-4">
        <p className="text-[10px] text-slate-400 font-medium">إصدار التطبيق 1.0.0</p>
      </div>
    </div>
  );
};

const SettingsItem = ({ icon, label, danger }: any) => (
  <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm hover:bg-slate-50 transition-colors group">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-white transition-colors">
        {icon}
      </div>
      <span className={`font-bold text-sm ${danger ? 'text-red-500' : 'text-slate-700'}`}>{label}</span>
    </div>
    <ChevronLeft size={18} className="text-slate-300" />
  </button>
);

export default SettingsPanel;