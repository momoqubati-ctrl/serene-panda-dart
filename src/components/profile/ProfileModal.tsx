import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { getSocket } from "@/lib/socket";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileStats } from "./ProfileStats";
import { ProfileActions } from "./ProfileActions";
import { ProfileAdminPanel } from "./ProfileAdminPanel";

interface ProfileModalProps {
  profileId: string | null;
  onClose: () => void;
  isAdmin: boolean;
}

export function ProfileModal({ profileId, onClose, isAdmin }: ProfileModalProps) {
  const socket = getSocket();
  const [profileData, setProfileData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileId) return;

    let active = true;
    setProfileData(null);
    setStats(null);
    setLoading(true);

    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      setLoading(false);
      alert("تعذر تحميل بيانات الملف الشخصي؛ يرجى المحاولة مرة أخرى.");
      onClose();
    }, 10000);

    socket.emit("profile:view", { profileId, hidden: isAdmin }, (response: any) => {
      if (!active) return;
      clearTimeout(timeoutId);

      if (response && response.success && response.profile) {
        setProfileData(response.profile);
        setStats(response.stats);
      } else {
        alert(response?.error || "تعذر تحميل بيانات الملف الشخصي");
        onClose();
      }

      setLoading(false);
    });

    const onProfileUpdated = (updates: any) => {
      setProfileData((prev: any) => ({
        ...prev,
        profile: { ...prev?.profile, ...updates },
      }));
    };

    socket.on("profile:updated", onProfileUpdated);

    return () => {
      active = false;
      clearTimeout(timeoutId);
      socket.off("profile:updated", onProfileUpdated);
    };
  }, [profileId, isAdmin, onClose, socket]);

  if (!profileId) return null;

  return (
    <Dialog open={!!profileId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background/95 backdrop-blur-md rounded-2xl border-white/10" dir="rtl">
        <DialogTitle className="sr-only">عرض الملف الشخصي</DialogTitle>
        <DialogDescription className="sr-only">تحميل وعرض بيانات الملف الشخصي للمستخدم.</DialogDescription>
        {loading || !profileData ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="relative flex flex-col">
            <ProfileHeader profile={profileData.profile} user={profileData} />
            
            <div className="p-6 pt-16 flex flex-col gap-6">
              <ProfileStats stats={stats} />
              <ProfileActions profileId={profileId} />
              
              {isAdmin && (
                <ProfileAdminPanel profileId={profileId} currentRole={profileData.role} />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
