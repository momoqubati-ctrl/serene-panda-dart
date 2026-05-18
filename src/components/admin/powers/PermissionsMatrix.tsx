"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, Shield, Save, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { getAdminHeaders } from '../utils';
import { showSuccess, showError } from '@/utils/toast';
import { PERMISSION_TRANSLATIONS } from '../constants';

const PermissionsMatrix = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/roles', { headers: getAdminHeaders() });
        const data = await res.json();
        if (data.success) {
          setRoles(data.roles);
          // استخراج كل مفاتيح الصلاحيات الفريدة
          const allPerms = new Set<string>();
          const initialMatrix: any = {};
          
          data.roles.forEach((role: any) => {
            initialMatrix[role.id] = role.permissions || {};
            Object.keys(role.permissions || {}).forEach(p => allPerms.add(p));
          });
          
          setPermissions(Array.from(allPerms).sort());
          setMatrix(initialMatrix);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggle = (roleId: string, permKey: string) => {
    setMatrix(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [permKey]: !prev[roleId][permKey]
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/permissions/bulk', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ matrix })
      });
      const data = await res.json();
      if (data.success) showSuccess("تم حفظ مصفوفة الصلاحيات بنجاح");
      else showError(data.message);
    } catch (err) {
      showError("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const filteredPerms = permissions.filter(p => 
    p.toLowerCase().includes(search.toLowerCase()) || 
    (PERMISSION_TRANSLATIONS[p] || "").includes(search)
  );

  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">مصفوفة الصلاحيات</h2>
          <p className="text-sm text-muted-foreground font-medium">تحكم كامل في مميزات الرتب من مكان واحد</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-2xl h-12 px-8 gap-2 font-black shadow-lg shadow-primary/20">
          {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          حفظ التغييرات
        </Button>
      </div>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 bg-white">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="بحث في الصلاحيات..." 
              className="h-11 pr-10 rounded-2xl bg-slate-50 border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-black sticky right-0 bg-slate-50 z-10">الصلاحية</th>
                {roles.map(role => (
                  <th key={role.id} className="px-4 py-4 font-black text-center min-w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <span style={{ color: role.color }}>{role.name}</span>
                      <span className="text-[9px] text-slate-400">Rank: {role.rank}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPerms.map(perm => (
                <tr key={perm} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700 sticky right-0 bg-white group-hover:bg-slate-50">
                    {PERMISSION_TRANSLATIONS[perm] || perm}
                    <div className="text-[9px] text-slate-400 font-medium" dir="ltr">{perm}</div>
                  </td>
                  {roles.map(role => (
                    <td key={role.id} className="px-4 py-4 text-center">
                      <Checkbox 
                        checked={!!matrix[role.id]?.[perm]} 
                        onCheckedChange={() => handleToggle(role.id, perm)}
                        className="rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsMatrix;