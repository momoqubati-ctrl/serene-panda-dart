"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Users, Lock, Mic2, Heart, Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getSocket } from "@/lib/socket";

type Room = {
  id: string;
  name: string;
  description: string;
  members: number;
  mics: number;
  likes: number;
  locked: boolean;
  owner: string;
  image: string;
};

const RoomList = ({ onSelectRoom }: { onSelectRoom: (room: Room) => void }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadRooms = async () => {
      try {
        setError("");
        const response = await fetch("/api/rooms");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "تعذر تحميل الغرف");
        }

        if (!ignore) {
          setRooms(data.rooms);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "تعذر تحميل الغرف");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadRooms();

    // تحديث أعداد الأعضاء من Socket.io بشكل لحظي عبر الأحداث وكاحتياط كل 5 ثوانٍ
    const socket = getSocket();

    const handleRoomCountUpdate = (data: { roomId: string; memberCount: number }) => {
      if (ignore) return;
      setRooms((prev) =>
        prev.map((room) =>
          room.id === data.roomId ? { ...room, members: data.memberCount } : room
        )
      );
    };

    socket.on("room_count_update", handleRoomCountUpdate);

    const refreshCounts = () => {
      socket.emit("get_rooms", (res: any) => {
        if (res?.success && !ignore) {
          setRooms((prev) =>
            prev.map((room) => {
              const updated = res.rooms?.find((r: any) => r.id === room.id);
              return updated ? { ...room, members: updated.members } : room;
            }),
          );
        }
      });
    };

    const interval = setInterval(refreshCounts, 5000);

    return () => {
      ignore = true;
      clearInterval(interval);
      socket.off("room_count_update", handleRoomCountUpdate);
    };
  }, []);

  const filteredRooms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rooms;
    return rooms.filter((room) => `${room.name} ${room.description} ${room.owner}`.toLowerCase().includes(query));
  }, [rooms, searchQuery]);

  return (
    <div className="flex h-full flex-col bg-card [direction:ltr]">
      <div className="flex items-center gap-1.5 bg-[#2c3e50] p-1.5">
        <div className="relative flex-1">
          <Input
            placeholder="ابحث عن غرفة"
            className="h-7 rounded-md border-none bg-card/10 pl-7 text-[10px] text-white placeholder:text-white/60"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-2 top-2 text-white/50" size={12} />
        </div>
        <button className="rounded-md bg-green-500 p-1 text-white transition-colors hover:bg-green-600" type="button">
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {isLoading && (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin" size={18} />
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center text-xs font-bold text-red-600" dir="rtl">
            {error}
          </div>
        )}

        {!isLoading && !error && filteredRooms.length === 0 && (
          <div className="rounded-lg border border-border bg-muted p-3 text-center text-xs font-bold text-muted-foreground" dir="rtl">
            لا توجد غرف مطابقة
          </div>
        )}

        {filteredRooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border-b border-border/50 p-2 text-left transition-all hover:bg-slate-100 [direction:ltr]"
            type="button"
          >
            <div className="relative shrink-0">
              <img src={room.image} alt={room.name} className="h-12 w-12 rounded-lg object-cover shadow-sm" />
              {room.locked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                  <Lock className="text-white" size={12} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center justify-between">
                <h4 className="truncate text-xs font-black text-foreground" dir="rtl">
                  {room.name}
                </h4>
                <div className="flex items-center gap-1 text-pink-500">
                  <Heart size={10} fill="currentColor" />
                  <span className="text-[9px] font-bold">{room.likes}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-muted-foreground">
                    <Users size={10} />
                    <span className="text-[9px] font-bold">{room.members}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-muted-foreground">
                    <Mic2 size={10} />
                    <span className="text-[9px] font-bold">{room.mics}</span>
                  </div>
                </div>
                <span className="rounded-sm bg-primary/5 px-1.5 py-0.5 text-[9px] font-bold text-primary" dir="rtl">
                  {room.owner}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoomList;
