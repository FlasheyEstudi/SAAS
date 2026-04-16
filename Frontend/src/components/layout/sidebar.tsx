'use client';

import { cn } from '@/lib/utils';
import { useAppStore, type AppView } from '@/lib/stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Building2, CalendarDays, BookOpen, Target,
  FileText, Users, Receipt, Landmark, BarChart3, Package,
  PiggyBank, ArrowLeftRight, UserCog, Shield, Bell, Search,
  Database, Activity, Bot, X, ChevronLeft, LogOut,
  FileDown, ChevronRight, Menu
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/vintage-ui';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  children?: { id: AppView; label: string }[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'journal', label: 'Pólizas', icon: <FileText className="w-5 h-5" /> },
  { id: 'invoices', label: 'Facturación', icon: <Receipt className="w-5 h-5" /> },
  { id: 'accounts', label: 'Plan de Cuentas', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'cost-centers', label: 'Centros de Costo', icon: <Target className="w-5 h-5" /> },
  { id: 'third-parties', label: 'Terceros', icon: <Users className="w-5 h-5" /> },
  { id: 'banks', label: 'Bancos', icon: <Landmark className="w-5 h-5" /> },
  { id: 'periods', label: 'Períodos', icon: <CalendarDays className="w-5 h-5" /> },
  { id: 'reports', label: 'Reportes', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'assets', label: 'Activos Fijos', icon: <Package className="w-5 h-5" /> },
  { id: 'budgets', label: 'Presupuestos', icon: <PiggyBank className="w-5 h-5" /> },
  { id: 'exchange', label: 'Tipos de Cambio', icon: <ArrowLeftRight className="w-5 h-5" /> },
  { id: 'users', label: 'Usuarios', icon: <UserCog className="w-5 h-5" /> },
  { id: 'audit', label: 'Auditoría', icon: <Shield className="w-5 h-5" /> },
  { id: 'notifications', label: 'Notificaciones', icon: <Bell className="w-5 h-5" /> },
  { id: 'search', label: 'Búsqueda', icon: <Search className="w-5 h-5" /> },
  { id: 'data-mgmt', label: 'Import/Export', icon: <Database className="w-5 h-5" /> },
  { id: 'system', label: 'Sistema', icon: <Activity className="w-5 h-5" /> },
  { id: 'ai-chat', label: 'IA Contable', icon: <Bot className="w-5 h-5" />, badge: 'IA' },
];

export function Sidebar() {
  const { currentView, navigate, sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, user, logout, unreadCount } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 bg-sidebar border-r border-sidebar-border',
          sidebarCollapsed ? 'w-[70px]' : 'w-[260px]',
          // Mobile: off-screen by default
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border min-h-[65px]">
          {!sidebarCollapsed && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vintage-300 to-vintage-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                C
              </div>
              <div>
                <h1 className="text-sm font-playfair font-bold text-sidebar-foreground">Contable</h1>
                <p className="text-[10px] text-sidebar-foreground/60">ERP Enterprise</p>
              </div>
            </motion.div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-vintage-300 to-vintage-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              C
            </div>
          )}
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60"
          >
            <X className="w-5 h-5" />
          </button>
          {/* Desktop collapse button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 mb-0.5 group relative',
                currentView === item.id
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                sidebarCollapsed && 'justify-center px-2'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className={cn(
                'transition-colors',
                currentView === item.id ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
              )}>
                {item.icon}
              </span>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-vintage-300 text-white">
                      {item.badge}
                    </span>
                  )}
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full bg-error text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </>
              )}
              {sidebarCollapsed && item.id === 'notifications' && unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center text-[8px] font-bold rounded-full bg-error text-white">
                  {unreadCount > 99 ? '!' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-sidebar-border">
          {!sidebarCollapsed && user ? (
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sidebar-accent transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vintage-300 to-vintage-500 flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-[10px] text-sidebar-foreground/50">{user.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/40 hover:text-error transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-error transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
