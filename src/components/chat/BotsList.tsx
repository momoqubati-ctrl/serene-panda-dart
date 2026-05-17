"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Bot, X, Play, Settings, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const BotsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadBots = async () => {
      try {
        setError("");
        const response = await fetch("/api/bots");
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "تعذر تحميل البوتات");
        if (!ignore) setBots(data.bots || []);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "تعذر تحميل البوتات");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadBots();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredBots = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return bots;
    return bots.filter((bot) => `${bot.name} ${bot.description} ${bot.kind}`.toLowerCase().includes(query));
  }, [bots, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-card rtl">
      {/* Search Header */}
      <div className="p-3 bg-[#2c3e50] flex items-center gap-2">
        <div className="flex-1 relative">
          <Input 
            placeholder="بحث في البوتات .." 
            className="h-9 bg-card/10 border-none text-white placeholder:text-white/50 pr-8 rounded-md text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-2 top-2.5 text-white/50" size={14} />
        </div>
        <button className="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading && (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin" size={18} />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && filteredBots.length === 0 && (
          <div className="rounded-lg border border-border bg-muted p-3 text-center text-xs font-bold text-muted-foreground">
            لا توجد بوتات مطابقة
          </div>
        )}

        {filteredBots.map((bot) => (
          <div key={bot.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/20 transition-all bg-card shadow-sm">
            <div className="relative shrink-0">
              <Avatar className="w-11 h-11 rounded-lg border border-border">
                <AvatarImage src={bot.avatarUrl || "/pic.png"} />
                <AvatarFallback><Bot size={20} /></AvatarFallback>
              </Avatar>
              <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${bot.isActive ? 'bg-green-500' : 'bg-slate-300'}`}></span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="font-black text-xs text-foreground truncate">{bot.name}</h4>
                <Badge variant="outline" className={`text-[8px] px-1 h-3.5 ${bot.isActive ? 'text-green-600 border-green-100 bg-green-50' : 'text-muted-foreground border-border bg-muted'}`}>
                  {bot.isActive ? 'يعمل' : 'متوقف'}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium line-clamp-1">{bot.description}</p>
            </div>

            <div className="flex gap-1">
              <button className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors">
                <Settings size={14} />
              </button>
              <button className={`p-1.5 rounded-md transition-colors ${bot.isActive ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-green-400 hover:text-green-600 hover:bg-green-50'}`}>
                <Play size={14} fill="currentColor" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BotsList;
