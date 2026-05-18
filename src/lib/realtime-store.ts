import { create } from 'zustand';

interface RealtimeState {
  presence: Record<string, any>;
  activityFeed: any[];
  activeRoom: any | null;
  recommendations: any[];
  counters: Record<string, number>;
  
  // Actions
  setPresence: (userId: string, data: any) => void;
  addActivity: (event: any) => void;
  setActiveRoom: (room: any) => void;
  setRecommendations: (items: any[]) => void;
  updateCounter: (key: string, val: number) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  presence: {},
  activityFeed: [],
  activeRoom: null,
  recommendations: [],
  counters: {},

  setPresence: (userId, data) => set((state) => ({
    presence: { ...state.presence, [userId]: data }
  })),

  addActivity: (event) => set((state) => ({
    activityFeed: [event, ...state.activityFeed].slice(0, 50)
  })),

  setActiveRoom: (room) => set({ activeRoom: room }),

  setRecommendations: (items) => set({ recommendations: items }),

  updateCounter: (key, val) => set((state) => ({
    counters: { ...state.counters, [key]: val }
  })),
}));