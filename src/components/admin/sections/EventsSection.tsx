"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminDataTable from '../shared/AdminDataTable';
import { getAdminHeaders, formatAdminDate } from '../utils';

const EventsSection = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/events', { headers: getAdminHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) setEvents(data.events);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: "actorName", label: "المشرف", render: (val: any) => <span className="font-bold text-primary">{val}</span> },
    { key: "eventType", label: "الحدث", render: (val: any) => <Badge variant="outline" className="font-bold">{val}</Badge> },
    { key: "targetName", label: "المستهدف", render: (val: any) => <span className="font-bold">{val}</span> },
    { key: "createdAt", label: "الوقت", render: (val: any) => <span className="text-xs text-slate-400" dir="ltr">{formatAdminDate(val)}</span> }
  ];

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-xl font-black">سجل الأحداث</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <AdminDataTable columns={columns} rows={events} loading={loading} />
      </CardContent>
    </Card>
  );
};

export default EventsSection;