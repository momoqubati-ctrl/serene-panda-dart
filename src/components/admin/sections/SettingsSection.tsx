"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getAdminHeaders } from '../utils';

const SettingsSection = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/settings', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) setSettings(data.settings);
        setLoading(false);
      });
  }, []);

  if (!settings && !loading) return null;

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden max-w-2xl mx-auto">
      <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardTitle className="text-xl font-black">إعدادات الموقع</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-500">اسم الشات</label>
          <Input defaultValue={settings?.siteName} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-500">رسالة الترحيب</label>
          <Input defaultValue={settings?.welcomeMessage} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-500">أقصى طول للرسالة</label>
            <Input type="number" defaultValue={settings?.maxMessageLength} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-500">عضويات الـ IP</label>
            <Input type="number" defaultValue={settings?.maxAccountsPerIp} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <span className="font-bold">وضع الصيانة</span>
          <Switch defaultChecked={settings?.maintenanceMode} />
        </div>
        <Button className="w-full h-12 rounded-2xl font-black shadow-lg shadow-primary/20">حفظ الإعدادات</Button>
      </CardContent>
    </Card>
  );
};

export default SettingsSection;