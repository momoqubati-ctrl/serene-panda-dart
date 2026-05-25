import { getSocket } from "@/lib/socket";
import { Button } from "../ui/button";
import { Gift, Heart, MessageCircle, Share2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface ProfileActionsProps {
  profileId: string;
}

export function ProfileActions({ profileId }: ProfileActionsProps) {
  const socket = getSocket();

  const handleFollow = () => {
    if (!socket) return;
    socket.emit("profile:follow", { profileId }, (res: any) => {
      if (res.success) {
        toast.success("تمت المتابعة بنجاح");
      } else {
        toast.error(res.error || "حدث خطأ أثناء المتابعة");
      }
    });
  };

  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 sm:-mx-8 sm:px-8">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <Button className="h-12 rounded-2xl bg-violet-600 text-sm font-black text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700" onClick={handleFollow}>
          <UserPlus className="ml-2 h-5 w-5" />
          متابعة
        </Button>
        <Button variant="outline" className="h-12 rounded-2xl border-slate-200 bg-white text-sm font-black text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
          <MessageCircle className="ml-2 h-5 w-5 text-violet-600" />
          رسالة
        </Button>
        <Button variant="outline" className="h-12 rounded-2xl border-slate-200 bg-white text-sm font-black text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
          <UserPlus className="ml-2 h-5 w-5 text-violet-600" />
          إضافة صديق
        </Button>
        <Button variant="outline" className="h-12 rounded-2xl border-slate-200 bg-white text-sm font-black text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
          <Gift className="ml-2 h-5 w-5 text-rose-500" />
          إهداء
        </Button>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-2">
          <Button variant="outline" size="icon" className="h-12 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800" aria-label="إعجاب">
            <Heart className="h-5 w-5 text-rose-500" />
          </Button>
          <Button variant="outline" size="icon" className="h-12 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800" aria-label="مشاركة">
            <Share2 className="h-5 w-5 text-slate-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}
