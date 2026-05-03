import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Company, AppNotification } from '@/lib/api/types';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string | null;
  availableCompanies: { id: string, name: string, role: string }[];
}

export type ThemeType = 'vintage' | 'modern' | 'minimal' | 'glass' | 'onyx' | 'ivory' | 'copper' | 'amethyst' | 'ocean' | 'frost';

export type AppView =
  | 'landing'
  | 'login'
  | 'register'
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
  | 'data-management'
  | 'system'
  | 'ai-chat'
  | 'taxes'
  | 'closing-entries'
  | 'financial-concepts'
  | 'payment-terms'
  | 'company-settings';

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
  availableCompanies: { id: string, name: string, role: string }[];

  // Notifications
  notifications: AppNotification[];
  unreadCount: number;

  // UI State
  isLoading: boolean;
  globalSearch: string;
  isDarkMode: boolean;
  accentColor: string; // Hex color
  theme: ThemeType;

  // Actions
  login: (user: User, token: string, companyId: string, company?: Company | null) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setAvailableCompanies: (companies: { id: string, name: string, role: string }[]) => void;

  navigate: (view: AppView, params?: Record<string, string>) => void;
  goBack: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  setCurrentCompany: (company: Company | any) => void;
  setCompanyId: (id: string) => void;

  setNotifications: (notifications: AppNotification[]) => void;
  setUnreadCount: (count: number) => void;
  addNotification: (notification: AppNotification) => void;
  markAsRead: (id: string) => void;

  setLoading: (loading: boolean) => void;
  setGlobalSearch: (search: string) => void;
  toggleDarkMode: () => void;
  setAccentColor: (color: string) => void;
  setTheme: (theme: ThemeType) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth defaults
      isAuthenticated: false,
      user: null,
      token: null,

      // Navigation defaults
      currentView: 'landing',
      viewParams: {},
      sidebarOpen: true,
      sidebarCollapsed: false,

      // Company defaults
      currentCompany: null,
      companyId: null,
      availableCompanies: [],

      // Notifications defaults
      notifications: [],
      unreadCount: 0,

      // UI defaults
      isLoading: false,
      globalSearch: '',
      isDarkMode: true,
      accentColor: '#F59E0B', 
      theme: 'onyx',

      // Auth actions
      login: (user, token, companyId, company = null) => {
        const companies = user.availableCompanies || [];
        const selectedCompany = company || (companies.length > 0 ? { id: companies[0].id, name: companies[0].name } : null);
        const finalCompanyId = companyId || (selectedCompany ? selectedCompany.id : null);

        if (finalCompanyId) localStorage.setItem('current_company_id', finalCompanyId);
        localStorage.setItem('user', JSON.stringify(user));
        
        set({
          isAuthenticated: true,
          user,
          token,
          companyId: finalCompanyId,
          currentCompany: selectedCompany as any,
          availableCompanies: companies,
          currentView: 'dashboard',
        });
      },

      logout: () => {
        localStorage.removeItem('current_company_id');
        localStorage.removeItem('user');
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          companyId: null,
          currentCompany: null,
          availableCompanies: [],
          currentView: 'landing',
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

      setAvailableCompanies: (companies) => set({ availableCompanies: companies }),

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
      toggleDarkMode: () => {
        const mode = get().isDarkMode;
        set({ isDarkMode: !mode, theme: !mode ? 'onyx' : 'ivory' });
      },
      setAccentColor: (color) => set({ accentColor: color }),
      setTheme: (theme) => set({ 
        theme, 
        isDarkMode: ['onyx', 'ocean', 'copper', 'amethyst'].includes(theme) 
      }),
    }),
    {
      name: 'erp-app-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        companyId: state.companyId,
        availableCompanies: state.availableCompanies,
        currentView: state.currentView,
        user: state.user,
        currentCompany: state.currentCompany,
        sidebarCollapsed: state.sidebarCollapsed,
        isDarkMode: state.isDarkMode,
        accentColor: state.accentColor,
        theme: state.theme,
      }),
    }
  )
);
