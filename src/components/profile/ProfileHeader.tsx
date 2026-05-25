import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Copy, Crown, MoreHorizontal, Shield, Sparkles, Verified } from "lucide-react";

interface ProfileHeaderProps {
  profile: any;
  user: any;
}

const getDisplayName = (user: any) => String(user?.displayName || user?.username || "عضو");
const getHandle = (user: any) => String(user?.username || user?.id || "member").replace(/\s+/g, "");

export function ProfileHeader({ profile, user }: ProfileHeaderProps) {
  const displayName = getDisplayName(user);
  const handle = getHandle(user);
  const isOnline = user?.presence === "online" || user?.status === "active";
  const coverUrl = profile?.bannerUrl || user?.coverUrl || "/pich.png";
  const avatarUrl = profile?.avatarUrl || user?.avatarUrl || "/pic.png";
  const accentColor = profile?.profileAccentColor || "#7C3AED";
  const nameColor = profile?.nameColor && profile.nameColor !== "#000000" ? profile.nameColor : undefined;

  return (
    <header className="relative">
      <div
        className="h-60 bg-cover bg-center sm:h-72"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0.68)), url(${coverUrl})`,
        }}
      />

      <div className="absolute right-4 top-4 z-20 sm:right-6">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full bg-slate-950/35 text-white shadow-sm backdrop-blur-md transition hover:bg-slate-950/50"
          aria-label="خيارات الملف الشخصي"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 sm:left-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/35 px-3 py-2 text-xs font-black text-white shadow-sm backdrop-blur-md">
          <span className={`h-3 w-3 rounded-full ${isOnline ? "bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.18)]" : "bg-slate-400"}`} />
          {isOnline ? "متصل الآن" : "غير متصل"}
        </div>
      </div>

      <div className="relative -mt-8 rounded-t-[28px] border-t border-white/70 bg-white px-4 pb-6 pt-20 shadow-[0_-20px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950 sm:px-8 sm:pt-10">
        <div className="absolute -top-20 right-6 sm:-top-24 sm:right-10">
          <div className="relative">
            <div
              className="rounded-full p-1.5 shadow-2xl shadow-violet-500/20"
              style={{ background: `linear-gradient(135deg, ${accentColor}, #F59E0B)` }}
            >
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl dark:border-slate-950 sm:h-40 sm:w-40">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="text-3xl font-black">{displayName[0]}</AvatarFallback>
              </Avatar>
            </div>
            {profile?.avatarFrameUrl && (
              <img
                src={profile.avatarFrameUrl}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full scale-110 rounded-full object-cover"
              />
            )}
            <span className="absolute bottom-4 left-3 h-8 w-8 rounded-full border-4 border-white bg-emerald-500 shadow-lg dark:border-slate-950" />
          </div>
        </div>

        <div className="flex flex-col gap-4 pr-0 sm:min-h-28 sm:pr-48 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="max-w-full truncate text-3xl font-black leading-tight text-slate-950 dark:text-white sm:text-4xl" style={{ color: nameColor }}>
                {displayName}
              </h2>
              {profile?.documents && <Verified className="h-6 w-6 shrink-0 text-violet-600" />}
              {(user?.role === "admin" || user?.role === "owner") && <Shield className="h-6 w-6 shrink-0 text-red-500" />}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
              <span dir="ltr">@{handle}</span>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:text-violet-600 dark:border-slate-800 dark:bg-slate-900"
                aria-label="نسخ اسم المستخدم"
              >
                <Copy className="h-4 w-4" />
              </button>
              {profile?.idreg && <span>{profile.idreg}</span>}
              {user?.countryCode && <span>{user.countryCode}</span>}
            </div>

            {profile?.profileMsg && (
              <p className="mt-4 max-w-2xl text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">
                {profile.profileMsg}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            <Badge className="h-9 rounded-xl border-none bg-violet-600 px-3 text-sm font-black text-white shadow-lg shadow-violet-600/20">
              <Sparkles className="ml-1 h-4 w-4" />
              {profile?.siteBadge || "chatmaster"}
            </Badge>
            <Badge className="h-9 rounded-xl border-none bg-gradient-to-l from-amber-700 to-amber-400 px-3 text-sm font-black text-white shadow-lg shadow-amber-600/20">
              <Crown className="ml-1 h-4 w-4" />
              برونزي
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
