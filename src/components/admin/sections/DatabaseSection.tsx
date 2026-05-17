"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminHeaders } from '../utils';

const DatabaseSection = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [columns, setColumns] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDatabase = async (table = "") => {
    setLoading(true);
    try {
      const url = table ? `/api/admin/database?table=${table}` : '/api/admin/database';
      const res = await fetch(url, { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.success) {
        setTables(data.tables || []);
        if (table) {
          setColumns(data.columns || []);
          setRows(data.rows || []);
          setSelectedTable(table);
        } else if (data.tables?.length > 0) {
          loadDatabase(data.tables[0].name);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDatabase(); }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <Card className="border-none shadow-lg rounded-3xl h-fit sticky top-6">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <Database size={20} className="text-primary" />
            هيكل البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {tables.map((t) => (
            <button
              key={t.name}
              onClick={() => loadDatabase(t.name)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all mb-1 ${selectedTable === t.name ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              <span dir="ltr">{t.name}</span>
              <Badge variant="secondary" className="text-[10px] rounded-lg">{t.rowCount}</Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-black" dir="ltr">{selectedTable}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => loadDatabase(selectedTable)} className="rounded-xl">تحديث</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500">
                <tr>
                  {columns.map((col) => (
                    <th key={col.name} className="px-4 py-4 font-black whitespace-nowrap" dir="ltr">{col.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={columns.length || 1} className="py-20 text-center"><Loader2 className="mx-auto animate-spin" /></td></tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      {columns.map((col) => (
                        <td key={col.name} className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                          {String(row[col.name] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseSection;