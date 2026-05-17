"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface AdminDataTableProps {
  columns: Column[];
  rows: any[];
  loading?: boolean;
  emptyMessage?: string;
}

const AdminDataTable = ({ columns, rows, loading, emptyMessage = "لا توجد بيانات متوفرة حالياً" }: AdminDataTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-4 font-black whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-20 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary/30" />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-20 text-center text-muted-foreground font-bold">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDataTable;