import { Star, Coins, Heart, Eye } from "lucide-react";

interface ProfileStatsProps {
  stats: {
    views: number;
    likes: number;
    coins: number;
    evaluation: number;
  };
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  if (!stats) return null;

  const statItems = [
    { label: "التقييم", value: stats.evaluation, icon: <Star className="w-5 h-5 text-yellow-500" /> },
    { label: "العملات", value: stats.coins, icon: <Coins className="w-5 h-5 text-orange-500" /> },
    { label: "الإعجابات", value: stats.likes, icon: <Heart className="w-5 h-5 text-red-500" /> },
    { label: "الزيارات", value: stats.views, icon: <Eye className="w-5 h-5 text-blue-500" /> },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl border border-border">
      {statItems.map((item, index) => (
        <div key={index} className="flex flex-col items-center justify-center gap-2 p-2">
          {item.icon}
          <span className="text-2xl font-bold">{item.value.toLocaleString('ar-EG')}</span>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
