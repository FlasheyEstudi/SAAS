import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Company, Notification } from '@/lib/api/types';

// Navigation view type
export type AppView =
  | 'login'
  | 'dashboard'
  | 'companies'
  | 'periods'
  | 'accounts'
  | 'cost-centers'
  | 'journal'
  | 'journal-create'
  | 'journal-detail'
  | 'third-parties'
  | 'invoices'
  | 'invoice-create'
  | 'invoice-detail'
  | 'banks'
  | 'reports'
  | 'assets'
  | 'budgets'
  | 'exchange'
  | 'users'
  | 'audit'
  | 'notifications'
  | 'search'
  | 'data-mgmt'
  | 'system'
  | 'ai-chat';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;

  // Navigation
  currentView: AppView;
  viewParams: Record<string, string>;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Company
  currentCompany: Company | null;
  companyId: string | null;

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // UI State
  isLoading: boolean;
  globalSearch: string;

  // Actions
  login: (user: User, token: string, companyId: string) => void;
  logout: () => void;
  setUser: (user: User) => void;

  navigate: (view: AppView, params?: Record<string, string>) => void;
  goBack: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  setCurrentCompany: (company: Company) => void;
  setCompanyId: (id: string) => void;

  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;

  setLoading: (loading: boolean) => void;
  setGlobalSearch: (search: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth defaults
      isAuthenticated: false,
      user: null,
      token: null,

      // Navigation defaults
      currentView: 'login',
      viewParams: {},
      sidebarOpen: true,
      sidebarCollapsed: false,

      // Company defaults
      currentCompany: null,
      companyId: null,

      // Notifications defaults
      notifications: [],
      unreadCount: 0,

      // UI defaults
      isLoading: false,
      globalSearch: '',

      // Auth actions
      login: (user, token, companyId) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('current_company_id', companyId);
        localStorage.setItem('user', JSON.stringify(user));
        set({
          isAuthenticated: true,
          user,
          token,
          companyId,
          currentView: 'dashboard',
        });
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_company_id');
        localStorage.removeItem('user');
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          companyId: null,
          currentCompany: null,
          currentView: 'login',
          notifications: [],
          unreadCount: 0,
        });
      },

      setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
      },

      // Navigation actions
      navigate: (view, params = {}) => {
        set({ currentView: view, viewParams: params, sidebarOpen: false });
      },

      goBack: () => {
        const { viewParams } = get();
        if (viewParams._from) {
          set({ currentView: viewParams._from as AppView, viewParams: {} });
        } else {
          set({ currentView: 'dashboard', viewParams: {} });
        }
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Company actions
      setCurrentCompany: (company) => {
        localStorage.setItem('current_company_id', company.id);
        set({ currentCompany: company, companyId: company.id });
      },

      setCompanyId: (id) => {
        localStorage.setItem('current_company_id', id);
        set({ companyId: id });
      },

      // Notification actions
      setNotifications: (notifications) => {
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        set({ notifications, unreadCount });
      },

      setUnreadCount: (count) => set({ unreadCount: count }),

      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),
      setGlobalSearch: (search) => set({ globalSearch: search }),
    }),
    {
      name: 'erp-app-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        companyId: state.companyId,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
