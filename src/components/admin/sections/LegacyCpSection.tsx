"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminDataTable from '../shared/AdminDataTable';
import { getAdminHeaders } from '../utils';
import { FIELD_TRANSLATIONS } from '../constants';

interface LegacyCpSectionProps {
  config: {
    title: string;
    description: string;
    tables: string[];
    actions?: string[];
  };
}

const LegacyCpSection = ({ config }: LegacyCpSectionProps) => {
  const [activeTable, setActiveTable] = useState(config.tables[0] || "");
  const [columns, setColumns] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTable = async (table: string) => {
    setActiveTable(table);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/database?table=${table}&limit=50`, { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.success) {
        setColumns(data.columns || []);
        setRows(data.rows || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (config.tables[0]) loadTable(config.tables[0]);
  }, [config.title]);

  const tableColumns = columns.map(col => ({
    key: col.name,
    label: FIELD_TRANSLATIONS[col.name] || col.name
  }));

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{config.title}</h2>
          <p className="text-sm font-medium text-muted-foreground">{config.description}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {config.tables.map((table) => (
            <Button
              key={table}
              variant={activeTable === table ? "default" : "outline"}
              size="sm"
              onClick={() => loadTable(table)}
              className="rounded-full font-bold text-xs whitespace-nowrap"
            >
              {table}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <AdminDataTable columns={tableColumns} rows={rows} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default LegacyCpSection;