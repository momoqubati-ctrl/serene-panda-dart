import { Star, Coins, Heart, Eye, Gift } from "lucide-react";

interface ProfileStatsProps {
  stats: {
    views: number;
    likes: number;
    coins: number;
    evaluation: number;
    giftsReceivedCount?: number;
  };
}

const formatNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toLocaleString("ar-EG", { maximumFractionDigits: 1 })}M`;
  if (value >= 1000) return `${(value / 1000).toLocaleString("ar-EG", { maximumFractionDigits: 1 })}K`;
  return value.toLocaleString("ar-EG");
};

export function ProfileStats({ stats }: ProfileStatsProps) {
  if (!stats) return null;

  const statItems = [
    {
      label: "إعجابات",
      value: stats.likes,
      icon: <Heart className="h-7 w-7" />,
      className: "from-rose-50 to-pink-50 text-rose-500 dark:from-rose-500/10 dark:to-pink-500/10",
    },
    {
      label: "نقاط",
      value: stats.evaluation,
      icon: <Star className="h-7 w-7" />,
      className: "from-violet-600 to-fuchsia-500 text-white shadow-violet-600/25",
      featured: true,
    },
    {
      label: "عملات",
      value: stats.coins,
      icon: <Coins className="h-7 w-7" />,
      className: "from-amber-50 to-orange-50 text-amber-600 dark:from-amber-500/10 dark:to-orange-500/10",
    },
    {
      label: "هدايا",
      value: stats.giftsReceivedCount || 0,
      icon: <Gift className="h-7 w-7" />,
      className: "from-emerald-50 to-green-50 text-emerald-600 dark:from-emerald-500/10 dark:to-green-500/10",
    },
    {
      label: "زيارات",
      value: stats.views,
      icon: <Eye className="h-7 w-7" />,
      className: "from-blue-50 to-sky-50 text-blue-600 dark:from-blue-500/10 dark:to-sky-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {statItems.map((item) => (
        <div
          key={item.label}
          className={`min-h-32 rounded-3xl border border-slate-200/80 bg-gradient-to-br p-4 shadow-sm dark:border-white/10 ${item.className} ${item.featured ? "shadow-lg" : "bg-white/85 dark:bg-slate-900/70"}`}
        >
          <div className="flex h-full items-center justify-between gap-3">
            <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${item.featured ? "bg-white/15 text-amber-300 ring-1 ring-white/30" : "bg-white shadow-sm dark:bg-slate-950/60"}`}>
              {item.icon}
            </div>
            <div className="min-w-0 text-left">
              <div className={`truncate text-3xl font-black ${item.featured ? "text-white" : "text-slate-950 dark:text-white"}`}>
                {formatNumber(Number(item.value || 0))}
              </div>
              <div className={`mt-1 truncate text-sm font-black ${item.featured ? "text-white/85" : "text-slate-500 dark:text-slate-400"}`}>
                {item.label}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
