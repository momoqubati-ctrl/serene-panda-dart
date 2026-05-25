import { ShieldAlert, Edit2, UserMinus, MicOff, Settings } from "lucide-react";
import { Button } from "../ui/button";

interface ProfileAdminPanelProps {
  profileId: string;
  currentRole: string;
}

export function ProfileAdminPanel({ profileId, currentRole }: ProfileAdminPanelProps) {
  return (
    <section className="rounded-3xl border border-red-200/80 bg-red-50/80 p-4 shadow-sm dark:border-red-500/20 dark:bg-red-500/10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-200">
          <ShieldAlert className="h-5 w-5" />
          <h3 className="text-sm font-black">أدوات الإدارة</h3>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-red-700 shadow-sm dark:bg-slate-950/40 dark:text-red-200">
          {currentRole || "member"} · {profileId}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Button variant="outline" size="sm" className="h-11 rounded-2xl border-red-200 bg-white text-xs font-black text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:bg-slate-950/40 dark:text-red-200">
          <Edit2 className="ml-2 h-4 w-4" />
          تغيير النك
        </Button>
        <Button variant="outline" size="sm" className="h-11 rounded-2xl border-red-200 bg-white text-xs font-black text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:bg-slate-950/40 dark:text-red-200">
          <Settings className="ml-2 h-4 w-4" />
          الصلاحيات
        </Button>
        <Button variant="outline" size="sm" className="h-11 rounded-2xl border-red-200 bg-white text-xs font-black text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:bg-slate-950/40 dark:text-red-200">
          <MicOff className="ml-2 h-4 w-4" />
          إسكات عام
        </Button>
        <Button variant="outline" size="sm" className="h-11 rounded-2xl border-red-200 bg-white text-xs font-black text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:bg-slate-950/40 dark:text-red-200">
          <UserMinus className="ml-2 h-4 w-4" />
          طرد نهائي
        </Button>
      </div>
    </section>
  );
}
