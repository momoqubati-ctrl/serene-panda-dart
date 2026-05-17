"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { getAdminHeaders } from '../utils';
import { PERMISSION_TRANSLATIONS } from '../constants';

const RolesSection = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/roles', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setRoles(data.roles);
          setSelected(data.roles[0]);
        }
        setLoading(false);
      });
  }, []);

  if (!selected && !loading) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      <Card className="border-none shadow-lg rounded-3xl h-fit">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-lg font-black">الرتب</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {roles.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all mb-1 ${selected?.id === r.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              <span>{r.name}</span>
              <Badge variant="secondary" className="text-[10px] rounded-lg">{r.rank}</Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      {selected && (
        <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-primary">صلاحيات: {selected.name}</CardTitle>
                <p className="text-xs font-bold text-muted-foreground mt-1">تعديل قوى الرتبة في النظام</p>
              </div>
              <Button className="rounded-2xl font-bold px-8 shadow-lg shadow-primary/20">حفظ</Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(selected.permissions || {}).map(([key, val]: [string, any]) => {
                const isBooleanLike = val === 0 || val === 1 || typeof val === 'boolean';
                const translatedKey = PERMISSION_TRANSLATIONS[key] || key;
                
                return (
                  <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{translatedKey}</span>
                    {isBooleanLike ? (
                      <Switch checked={val === 1 || val === true} />
                    ) : (
                      <Input className="w-24 h-9 text-center font-black rounded-xl" value={String(val)} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RolesSection;