import { create } from 'zustand';

const useAppStore = create((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Notifications
  notificationCount: 0,
  setNotificationCount: (count) => set({ notificationCount: count }),

  // Current page title
  pageTitle: 'Dashboard',
  setPageTitle: (title) => set({ pageTitle: title }),

  // XP animation queue
  xpAnimation: null,
  showXPGain: (amount) => set({ xpAnimation: { amount, id: Date.now() } }),
  clearXPAnimation: () => set({ xpAnimation: null }),

  // Modal states
  activeModal: null,
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

export default useAppStore;
