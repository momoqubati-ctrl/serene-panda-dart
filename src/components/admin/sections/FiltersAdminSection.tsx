"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ban } from 'lucide-react';
import { getAdminHeaders } from '../utils';

const FiltersAdminSection = () => {
  const [filters, setFilters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/filters', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) setFilters(data.filters);
        setLoading(false);
      });
  }, []);

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-black">فلتر الكلمات</CardTitle>
        <Button className="rounded-xl font-bold">+ إضافة كلمة</Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800">
          {filters.map(f => (
            <div key={f.id} className="bg-white dark:bg-slate-900 p-4 flex items-center justify-between group">
              <div>
                <div className="font-black text-slate-800 dark:text-white">{f.pattern}</div>
                <div className="text-[10px] font-bold text-slate-400">{f.action} • {f.scope}</div>
              </div>
              <Button variant="ghost" size="icon" className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Ban size={16} /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FiltersAdminSection;