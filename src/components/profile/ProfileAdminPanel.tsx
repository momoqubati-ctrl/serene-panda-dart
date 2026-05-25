import { ShieldAlert, Edit2, UserMinus, MicOff, Settings } from "lucide-react";
import { Button } from "../ui/button";

interface ProfileAdminPanelProps {
  profileId: string;
  currentRole: string;
}

export function ProfileAdminPanel({ profileId, currentRole }: ProfileAdminPanelProps) {
  return (
    <div className="mt-4 p-4 border border-red-500/30 bg-red-500/5 rounded-xl">
      <div className="flex items-center gap-2 mb-4 text-red-500">
        <ShieldAlert className="w-5 h-5" />
        <h3 className="font-bold text-sm">لوحة تحكم الإدارة (#myadmin)</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <Button variant="outline" size="sm" className="gap-2 border-red-200 hover:bg-red-50 text-red-700">
          <Edit2 className="w-3 h-3" />
          تغيير النك
        </Button>
        <Button variant="outline" size="sm" className="gap-2 border-red-200 hover:bg-red-50 text-red-700">
          <Settings className="w-3 h-3" />
          الترقية والصلاحيات
        </Button>
        <Button variant="outline" size="sm" className="gap-2 border-red-200 hover:bg-red-50 text-red-700">
          <MicOff className="w-3 h-3" />
          إسكات عام
        </Button>
        <Button variant="outline" size="sm" className="gap-2 border-red-200 hover:bg-red-50 text-red-700">
          <UserMinus className="w-3 h-3" />
          طرد نهائي
        </Button>
      </div>
    </div>
  );
}
