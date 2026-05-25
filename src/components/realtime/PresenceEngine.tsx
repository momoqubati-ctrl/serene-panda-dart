"use client";

import React, { useEffect, useCallback, useRef } from 'react';
import { useRealtimeStore } from '@/lib/realtime-store';
import { getSocket } from '@/lib/socket';

const PresenceEngine = () => {
  const {
    // Online Users state & actions
    onlineUsers,
    isOnlineUsersLoaded,
    isLoadingOnlineUsers,
    setOnlineUsers,
    setOnlineCount,
    mergeOnlineUser,
    removeOnlineUser,
    setLoadingOnlineUsers,

    // Rooms state & actions
    rooms,
    isRoomsLoaded,
    isLoadingRooms,
    setRooms,
    updateRoomMemberCount,
    setLoadingRooms,

    // Wall state & actions
    wallPosts,
    isWallLoaded,
    isLoadingWallPosts,
    setWallPosts,
    addWallPost,
    updateWallAuthorProfile,
    setLoadingWallPosts,

    setPresence,
    updateCounter
  } = useRealtimeStore();

  const isOnlineUsersLoadedRef = useRef(isOnlineUsersLoaded);
  const isRoomsLoadedRef = useRef(isRoomsLoaded);
  const isWallLoadedRef = useRef(isWallLoaded);

  useEffect(() => {
    isOnlineUsersLoadedRef.current = isOnlineUsersLoaded;
  }, [isOnlineUsersLoaded]);

  useEffect(() => {
    isRoomsLoadedRef.current = isRoomsLoaded;
  }, [isRoomsLoaded]);

  useEffect(() => {
    isWallLoadedRef.current = isWallLoaded;
  }, [isWallLoaded]);

  // ===== Initial Fetch Logic =====
  const fetchOnlineUsers = useCallback(() => {
    if (isOnlineUsersLoadedRef.current) return;
    
    setLoadingOnlineUsers(true);
    const socket = getSocket();
    socket.emit("get_online_users", (res: any) => {
      if (res?.success) {
        setOnlineUsers(res.users || []);
        setOnlineCount(res.count || 0);
      } else {
        setLoadingOnlineUsers(false);
      }
    });
  }, [setOnlineUsers, setOnlineCount, setLoadingOnlineUsers]);

  const fetchRooms = useCallback(async () => {
    if (isRoomsLoadedRef.current) return;

    setLoadingRooms(true);
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();
      if (response.ok && data.success) {
        setRooms(data.rooms || []);
      } else {
        setLoadingRooms(false);
      }
    } catch (err) {
      console.error("Failed to load rooms in PresenceEngine:", err);
      setLoadingRooms(false);
    }
  }, [setRooms, setLoadingRooms]);

  const fetchWallPosts = useCallback(async () => {
    if (isWallLoadedRef.current) return;

    setLoadingWallPosts(true);
    try {
      const res = await fetch("/api/wall/posts");
      const data = await res.json();
      if (res.ok && data.success) {
        setWallPosts(data.posts || []);
      } else {
        setLoadingWallPosts(false);
      }
    } catch (err) {
      console.error("Failed to load wall posts in PresenceEngine:", err);
      setLoadingWallPosts(false);
    }
  }, [setWallPosts, setLoadingWallPosts]);

  // Load all initial data once
  useEffect(() => {
    const socket = getSocket();
    
    const onConnect = () => {
      // Fetch online users immediately when socket connects (or reconnects)
      fetchOnlineUsers();
    };

    socket.on("connect", onConnect);
    if (socket.connected) {
      onConnect();
    }

    fetchRooms();
    fetchWallPosts();

    return () => {
      socket.off("connect", onConnect);
    };
  }, [fetchOnlineUsers, fetchRooms, fetchWallPosts]);

  // ===== Socket Event Listeners =====
  useEffect(() => {
    const socket = getSocket();

    const handlePresenceUpdate = (data: any) => {
      setPresence(data.userId, data);
    };

    const handleGlobalStats = (data: any) => {
      if (data.onlineCount) updateCounter('online', data.onlineCount);
    };

    const onOnlineCount = (data: { count: number }) => {
      setOnlineCount(data.count);
    };

    const onUserStatusUpdate = (data: any) => {
      if (!data?.userId && !data?.socketId) return;
      
      const toMerge: any = {
        id: data.userId || "0",
        socketId: data.socketId,
        username: data.username || "",
        role: data.role || "guest",
      };
      if (data.status !== undefined) toMerge.status = data.status;
      if (data.avatar !== undefined) toMerge.avatar = data.avatar;
      if (data.avatarUrl !== undefined && !toMerge.avatar) toMerge.avatar = data.avatarUrl;
      if (data.countryCode !== undefined) toMerge.countryCode = data.countryCode;
      if (data.roomId !== undefined) toMerge.roomId = data.roomId;
      if (data.idreg !== undefined) toMerge.idreg = data.idreg;
      if (data.siteBadge !== undefined) toMerge.siteBadge = data.siteBadge;

      mergeOnlineUser(toMerge);
    };

    const onUserCountryUpdate = (data: { userId: string; socketId?: string; username?: string; role?: string; countryCode: string }) => {
      if (!data?.userId && !data?.socketId) return;
      mergeOnlineUser({
        id: data.userId || "0",
        socketId: data.socketId,
        username: data.username || "",
        role: data.role || "guest",
        countryCode: data.countryCode,
      });
    };

    const onUserConnected = (data: any) => {
      if (data?.userId || data?.socketId || data?.username) {
        mergeOnlineUser({
          id: data.userId || "0",
          socketId: data.socketId,
          username: data.username || "زائر",
          role: data.role || "guest",
          avatar: data.avatar || data.avatarUrl || "/pic.png",
          countryCode: data.countryCode || "SA",
          avatarFrameUrl: data.avatarFrameUrl || "",
          giftIconUrl: data.giftIconUrl || "",
          roomId: data.roomId || "",
          status: data.status || "online",
          idreg: data.idreg,
          siteBadge: data.siteBadge,
        });
      }
    };

    const onUserDisconnected = (data: any) => {
      if (data?.userId || data?.socketId || data?.username) {
        removeOnlineUser({ id: data.userId, socketId: data.socketId, username: data.username, role: data.role });
        if (typeof data.count === "number") {
          setOnlineCount(data.count);
        }
      }
    };

    const onUserProfileUpdated = (data: any) => {
      if (!data?.userId) return;

      // Update online user
      mergeOnlineUser({
        id: data.userId,
        username: data.username,
        avatar: data.avatar || data.avatarUrl,
        avatarUrl: data.avatar || data.avatarUrl,
        profileCover: data.profileCover,
        statusMsg: data.profileMsg,
      });

      // Update wall post author avatar
      if (data.avatar || data.avatarUrl) {
        updateWallAuthorProfile(data.userId, data.username, data.avatar || data.avatarUrl);
      }
    };

    const onRoomCountUpdate = (data: { roomId: string; memberCount: number }) => {
      updateRoomMemberCount(data.roomId, data.memberCount);
    };

    const onWallPostCreated = (post: any) => {
      if (post) {
        addWallPost(post);
      }
    };

    // Register all listeners
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('system:stats', handleGlobalStats);
    socket.on("online_count", onOnlineCount);
    socket.on("user_status_update", onUserStatusUpdate);
    socket.on("user_country_update", onUserCountryUpdate);
    socket.on("user_connected", onUserConnected);
    socket.on("user_disconnected", onUserDisconnected);
    socket.on("user_profile_updated", onUserProfileUpdated);
    socket.on("room_count_update", onRoomCountUpdate);
    socket.on("wall_post_created", onWallPostCreated);

    // Idle Detection
    let idleTimer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(idleTimer);
      socket.emit('presence:state', { status: 'active' });
      idleTimer = setTimeout(() => {
        socket.emit('presence:state', { status: 'idle' });
      }, 60000); // 1 minute
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);

    // Initial trigger
    resetTimer();

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('system:stats', handleGlobalStats);
      socket.off("online_count", onOnlineCount);
      socket.off("user_status_update", onUserStatusUpdate);
      socket.off("user_country_update", onUserCountryUpdate);
      socket.off("user_connected", onUserConnected);
      socket.off("user_disconnected", onUserDisconnected);
      socket.off("user_profile_updated", onUserProfileUpdated);
      socket.off("room_count_update", onRoomCountUpdate);
      socket.off("wall_post_created", onWallPostCreated);
      
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      clearTimeout(idleTimer);
    };
  }, [setPresence, updateCounter, setOnlineCount, mergeOnlineUser, removeOnlineUser, updateWallAuthorProfile, updateRoomMemberCount, addWallPost]);

  return null; // Silent background engine
};

export default PresenceEngine;