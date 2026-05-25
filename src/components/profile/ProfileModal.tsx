import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { getSocket } from "@/lib/socket";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileStats } from "./ProfileStats";
import { ProfileActions } from "./ProfileActions";
import { ProfileAdminPanel } from "./ProfileAdminPanel";
import { Award, Eye, Medal, MessageCircle, Music2, ShieldCheck, Sparkles, Star, Trophy, Users } from "lucide-react";

interface ProfileModalProps {
  profileId: string | null;
  onClose: () => void;
  isAdmin: boolean;
}

const getRankName = (evaluation: number) => {
  if (evaluation >= 500) return "ماسي";
  if (evaluation >= 200) return "برونزي";
  if (evaluation >= 75) return "فضي";
  return "عضو نشط";
};

const getNextRankAt = (evaluation: number) => {
  if (evaluation >= 500) return 500;
  if (evaluation >= 200) return 500;
  if (evaluation >= 75) return 200;
  return 75;
};

const achievementToneClasses = {
  violet: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200",
  blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200",
  amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
};

function Achievement({
  icon,
  title,
  value,
  description,
  tone,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  description: string;
  tone: keyof typeof achievementToneClasses;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 text-center shadow-sm dark:border-white/10 dark:bg-slate-900/70">
      <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl border shadow-sm ${achievementToneClasses[tone]}`}>
        <div className="h-6 w-6">{icon}</div>
      </div>
      <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {value}
      </div>
      <h4 className="mt-2 truncate text-sm font-black text-slate-950 dark:text-white">{title}</h4>
      <p className="mt-1 truncate text-xs font-bold text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

export function ProfileModal({ profileId, onClose, isAdmin }: ProfileModalProps) {
  const socket = getSocket();
  const [profileData, setProfileData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [relationship, setRelationship] = useState({ isSelf: false, isFollowing: false });
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileId) return;

    let active = true;
    setProfileData(null);
    setStats(null);
    setRelationship({ isSelf: false, isFollowing: false });
    setVisitors([]);
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
        setRelationship(response.relationship || { isSelf: false, isFollowing: false });
        setVisitors(response.visitors || []);
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

  const profile = profileData?.profile || {};
  const evaluation = Number(stats?.evaluation || profile.evaluation || 0);
  const likes = Number(stats?.likes || profile.wallPostLikes || 0);
  const coins = Number(stats?.coins || profile.coins || 0);
  const gifts = Number(stats?.giftsReceivedCount || profile.giftsReceivedCount || 0);
  const rankName = getRankName(evaluation);
  const nextRankAt = getNextRankAt(evaluation);
  const progress = Math.min(100, Math.round((evaluation / Math.max(nextRankAt, 1)) * 100));
  const remainingPoints = Math.max(0, nextRankAt - evaluation);

  return (
    <Dialog open={!!profileId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-4xl overflow-hidden rounded-[28px] border border-white/40 bg-white/95 p-0 text-slate-950 shadow-2xl shadow-slate-950/40 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 dark:text-white [&>button]:left-4 [&>button]:right-auto [&>button]:top-4 [&>button]:z-30 [&>button]:h-10 [&>button]:w-10 [&>button]:rounded-full [&>button]:bg-white/80 [&>button]:text-slate-700 [&>button]:opacity-100 [&>button]:shadow-sm dark:[&>button]:bg-slate-900/80 dark:[&>button]:text-white"
        dir="rtl"
      >
        <DialogTitle className="sr-only">عرض الملف الشخصي</DialogTitle>
        <DialogDescription className="sr-only">تحميل وعرض بيانات الملف الشخصي للمستخدم.</DialogDescription>
        {loading || !profileData ? (
          <div className="flex h-[520px] items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-violet-100 border-b-violet-600" />
          </div>
        ) : (
          <div className="max-h-[92vh] overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.14),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#ffffff_36%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.22),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_36%,#020617_100%)]">
            <ProfileHeader profile={profile} user={profileData} />

            <div className="space-y-5 px-4 pb-4 pt-20 sm:px-8 sm:pb-8">
              <ProfileStats stats={stats} />

              <section className="grid gap-4 rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 md:grid-cols-[220px_1fr]">
                <div className="flex items-center gap-4">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-200 via-orange-300 to-amber-700 text-white shadow-lg shadow-amber-500/20">
                    <Trophy className="h-12 w-12 drop-shadow" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400">الرتبة الحالية</p>
                    <h3 className="mt-1 truncate text-2xl font-black text-slate-950 dark:text-white">{rankName}</h3>
                    <span className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
                      {evaluation.toLocaleString("ar-EG")} نقطة
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950 dark:text-white">الرتبة التالية</p>
                      <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                        {progress >= 100 ? "وصلت إلى متطلبات هذه الرتبة" : `باقي ${remainingPoints.toLocaleString("ar-EG")} نقطة للوصول`}
                      </p>
                    </div>
                    <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-black text-white">{progress}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-amber-400 via-pink-500 to-violet-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-950 dark:text-white">
                  <Trophy className="h-5 w-5 text-violet-600" />
                  <h3 className="text-base font-black">الإنجازات</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Achievement icon={<MessageCircle className="h-6 w-6" />} title="محادث نشط" value="100" description="أرسلت 100 رسالة" tone="violet" />
                  <Achievement icon={<Star className="h-6 w-6" />} title="مثير للإعجاب" value={likes.toLocaleString("ar-EG")} description="إجمالي الإعجابات" tone="blue" />
                  <Achievement icon={<Users className="h-6 w-6" />} title="صانع مجتمع" value="10" description="تفاعل متواصل" tone="amber" />
                  <Achievement icon={<Sparkles className="h-6 w-6" />} title="أسبوع نشط" value="7" description="نشاط لمدة 7 أيام" tone="emerald" />
                </div>
              </section>

              {(profile?.youtubeUrl || profile?.youtube || profile?.youtub) && (
                <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-200">
                        <Music2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-950 dark:text-white">الأغنية الشخصية</p>
                        <p className="mt-1 max-w-md truncate text-xs font-bold text-slate-500 dark:text-slate-400" dir="ltr">
                          {profile.youtubeUrl || profile.youtube || profile.youtub}
                        </p>
                      </div>
                    </div>
                    <a
                      href={profile.youtubeUrl || profile.youtube || profile.youtub}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 px-4 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
                    >
                      تشغيل
                    </a>
                  </div>
                </section>
              )}

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-950 dark:text-white">
                  <Medal className="h-5 w-5 text-violet-600" />
                  <h3 className="text-base font-black">الشارات</h3>
                </div>
                <div className="grid grid-cols-4 gap-3 rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 sm:grid-cols-8">
                  {["ملكي", "ماسي", "محادث", "خبير", "مجتمع", "محبوب", "نشط"].map((badge, index) => (
                    <div key={badge} className="group flex min-w-0 flex-col items-center gap-2">
                      <div className={`grid h-12 w-12 place-items-center rounded-2xl border shadow-sm ${index % 3 === 0 ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200" : index % 3 === 1 ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"}`}>
                        <Award className="h-6 w-6" />
                      </div>
                      <span className="max-w-full truncate text-[10px] font-bold text-slate-500 dark:text-slate-400">{badge}</span>
                    </div>
                  ))}
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-xl font-black text-slate-400 dark:border-slate-700 dark:bg-slate-800/50">
                    +
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-200 to-amber-700 text-white">
                      <Trophy className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950 dark:text-white">أعلى رتبة تم الوصول إليها</p>
                      <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{rankName} · {coins.toLocaleString("ar-EG")} عملة · {gifts.toLocaleString("ar-EG")} هدية</p>
                    </div>
                  </div>
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <ShieldCheck className="h-4 w-4" />
                    متصل الآن
                  </div>
                </div>
              </section>

              {visitors.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-950 dark:text-white">
                    <Eye className="h-5 w-5 text-violet-600" />
                    <h3 className="text-base font-black">من زار ملفي الشخصي</h3>
                  </div>
                  <div className="grid gap-2 rounded-3xl border border-slate-200/80 bg-white/85 p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/70 sm:grid-cols-2">
                    {visitors.slice(0, 6).map((visitor) => (
                      <div key={`${visitor.id}-${visitor.visitedAt}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2 dark:bg-slate-950/40">
                        <img src={visitor.avatarUrl || "/pic.png"} alt="" className="h-10 w-10 rounded-full object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950 dark:text-white">{visitor.displayName || visitor.username}</p>
                          <p className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">
                            {new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }).format(new Date(visitor.visitedAt))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <ProfileActions
                profileId={profileData.id || profileId}
                isSelf={relationship.isSelf}
                initialFollowing={relationship.isFollowing}
                onFollowChange={(following) => setRelationship((current) => ({ ...current, isFollowing: following }))}
              />

              {isAdmin && (
                <ProfileAdminPanel
                  profileId={profileData.id || profileId}
                  currentRole={profileData.role}
                  onProfilePatch={(patch) => {
                    setProfileData((current: any) => ({
                      ...current,
                      displayName: patch.displayName ?? current.displayName,
                      profile: { ...current.profile, ...patch.profile },
                    }));
                    if (patch.stats) setStats((current: any) => ({ ...current, ...patch.stats }));
                  }}
                />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
