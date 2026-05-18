"use client";

import React, { useEffect } from 'react';
import { useRealtimeStore } from '@/lib/realtime-store';
import { getSocket } from '@/lib/socket';

const PresenceEngine = () => {
  const { setPresence, updateCounter } = useRealtimeStore();

  useEffect(() => {
    const socket = getSocket();

    const handlePresenceUpdate = (data: any) => {
      setPresence(data.userId, data);
    };

    const handleGlobalStats = (data: any) => {
      if (data.onlineCount) updateCounter('online', data.onlineCount);
    };

    socket.on('presence:update', handlePresenceUpdate);
    socket.on('system:stats', handleGlobalStats);

    // تتبع حالة الخمول (Idle Detection)
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

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('system:stats', handleGlobalStats);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, []);

  return null; // مكن خلفي فقط
};

export default PresenceEngine;