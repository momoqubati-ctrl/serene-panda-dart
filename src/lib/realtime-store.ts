import { create } from 'zustand';

interface RealtimeState {
  presence: Record<string, any>;
  activityFeed: any[];
  activeRoom: any | null;
  recommendations: any[];
  counters: Record<string, number>;
  
  // New cached lists
  rooms: any[];
  onlineUsers: any[];
  wallPosts: any[];
  onlineCount: number;
  
  // Loading states
  isLoadingRooms: boolean;
  isLoadingOnlineUsers: boolean;
  isLoadingWallPosts: boolean;
  
  // Initial load flags (to prevent double fetching when mounting tabs)
  isRoomsLoaded: boolean;
  isOnlineUsersLoaded: boolean;
  isWallLoaded: boolean;

  // Actions
  setPresence: (userId: string, data: any) => void;
  addActivity: (event: any) => void;
  setActiveRoom: (room: any) => void;
  setRecommendations: (items: any[]) => void;
  updateCounter: (key: string, val: number) => void;
  
  // New actions for Rooms
  setRooms: (rooms: any[]) => void;
  updateRoomMemberCount: (roomId: string, count: number) => void;
  setLoadingRooms: (val: boolean) => void;
  setIsRoomsLoaded: (val: boolean) => void;

  // New actions for Online Users
  setOnlineUsers: (users: any[]) => void;
  setOnlineCount: (count: number) => void;
  mergeOnlineUser: (user: any) => void;
  removeOnlineUser: (target: { id?: string; socketId?: string; username?: string; role?: string }) => void;
  setLoadingOnlineUsers: (val: boolean) => void;
  setIsOnlineUsersLoaded: (val: boolean) => void;

  // New actions for Wall Posts
  setWallPosts: (posts: any[]) => void;
  addWallPost: (post: any) => void;
  updateWallAuthorProfile: (userId: string, username: string, avatar: string) => void;
  setLoadingWallPosts: (val: boolean) => void;
  setIsWallLoaded: (val: boolean) => void;
}

const getPresenceKey = (member: { id?: string; socketId?: string; username?: string; name?: string; role?: string }) => {
  const id = String(member.id || "").trim();
  if (id && id !== "0") return `id:${id}`;
  if (member.socketId) return `socket:${member.socketId}`;
  const name = String(member.username || member.name || "").trim().toLowerCase();
  if (name && member.role !== "guest") return `username:${name}`;
  return `guest:${name || "anonymous"}`;
};

export const useRealtimeStore = create<RealtimeState>((set) => ({
  presence: {},
  activityFeed: [],
  activeRoom: null,
  recommendations: [],
  counters: {},
  
  rooms: [],
  onlineUsers: [],
  wallPosts: [],
  onlineCount: 0,
  
  isLoadingRooms: false,
  isLoadingOnlineUsers: false,
  isLoadingWallPosts: false,
  
  isRoomsLoaded: false,
  isOnlineUsersLoaded: false,
  isWallLoaded: false,

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

  // Rooms Actions
  setRooms: (rooms) => set({ rooms, isRoomsLoaded: true, isLoadingRooms: false }),
  updateRoomMemberCount: (roomId, count) => set((state) => ({
    rooms: state.rooms.map((room) =>
      room.id === roomId ? { ...room, members: count } : room
    )
  })),
  setLoadingRooms: (val) => set({ isLoadingRooms: val }),
  setIsRoomsLoaded: (val) => set({ isRoomsLoaded: val }),

  // Online Users Actions
  setOnlineUsers: (users) => set({ onlineUsers: users, isOnlineUsersLoaded: true, isLoadingOnlineUsers: false }),
  setOnlineCount: (count) => set({ onlineCount: count }),
  mergeOnlineUser: (incoming) => set((state) => {
    const identity = getPresenceKey(incoming);
    if (!identity) return {};
    
    let found = false;
    const next = state.onlineUsers.map((user) => {
      if (getPresenceKey(user) !== identity) return user;
      found = true;
      const updated = { ...user } as any;
      for (const [key, value] of Object.entries(incoming)) {
        if (value !== undefined) {
          updated[key] = value;
        }
      }
      return updated;
    });

    if (!found) {
      next.push(incoming);
    }
    return { onlineUsers: next };
  }),
  removeOnlineUser: (target) => set((state) => {
    const identity = getPresenceKey(target);
    return {
      onlineUsers: state.onlineUsers.filter((user) => getPresenceKey(user) !== identity)
    };
  }),
  setLoadingOnlineUsers: (val) => set({ isLoadingOnlineUsers: val }),
  setIsOnlineUsersLoaded: (val) => set({ isOnlineUsersLoaded: val }),

  // Wall Posts Actions
  setWallPosts: (posts) => set({ wallPosts: posts, isWallLoaded: true, isLoadingWallPosts: false }),
  addWallPost: (post) => set((state) => {
    if (state.wallPosts.some((item) => String(item.id) === String(post.id))) return {};
    return { wallPosts: [post, ...state.wallPosts].slice(0, 50) };
  }),
  updateWallAuthorProfile: (userId, username, avatar) => set((state) => ({
    wallPosts: state.wallPosts.map((post) => {
      const author = post.author || {};
      if (author.id !== userId && author.name !== username) return post;
      return {
        ...post,
        author: {
          ...author,
          avatar: avatar
        }
      };
    })
  })),
  setLoadingWallPosts: (val) => set({ isLoadingWallPosts: val }),
  setIsWallLoaded: (val) => set({ isWallLoaded: val }),
}));