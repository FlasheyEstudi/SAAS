'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/stores/useAppStore';
import { Menu, Bell, Search, Bot, ArrowLeft, Building2, ChevronDown, Sun, Moon, Settings, Database, History, Plus, LogOut, Palette, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemePicker } from '@/components/ui/theme-picker';
import { useState } from 'react';

export function Header() {
  const { 
    toggleSidebar, sidebarCollapsed, currentView, unreadCount, 
    navigate, goBack, viewParams, user, currentCompany, 
    availableCompanies, setCurrentCompany, isDarkMode, toggleDarkMode,
    logout
  } = useAppStore();
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  // ... (keep viewTitles)
  const viewTitles: Record<string, string> = {
    'login': 'Iniciar Sesión',
    'dashboard': 'Dashboard',
    'companies': 'Empresas',
    'periods': 'Períodos Contables',
    'accounts': 'Plan de Cuentas',
    'cost-centers': 'Centros de Costo',
    'journal': 'Pólizas Contables',
    'journal-create': 'Nueva Póliza',
    'journal-detail': 'Detalle de Póliza',
    'third-parties': 'Terceros',
    'invoices': 'Facturación',
    'invoice-create': 'Nueva Factura',
    'invoice-detail': 'Detalle de Factura',
    'banks': 'Bancos',
    'reports': 'Reportes Financieros',
    'assets': 'Activos Fijos',
    'budgets': 'Presupuestos',
    'exchange': 'Tipos de Cambio',
    'users': 'Gestión de Usuarios',
    'audit': 'Bitácora de Auditoría',
    'notifications': 'Notificaciones',
    'search': 'Búsqueda Global',
    'data-mgmt': 'Importar / Exportar',
    'system': 'Sistema',
    'ai-chat': 'Asistente IA Contable',
    'taxes': 'Configuración de Impuestos',
  };

  const showBack = currentView === 'journal-create' || currentView === 'journal-detail' || currentView === 'invoice-create' || currentView === 'invoice-detail';

  return (
    <header className={cn(
      'sticky top-0 z-30 flex items-center justify-between h-[65px] px-4 lg:px-6 border-b border-vintage-200 bg-vintage-50/80 backdrop-blur-md transition-all duration-300 dark:bg-zinc-900/80 dark:border-zinc-800',
      sidebarCollapsed ? 'lg:ml-[70px]' : 'lg:ml-[260px]'
    )}>
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={toggleSidebar}
          title="Abrir menú"
          className="lg:hidden p-2 rounded-xl hover:bg-vintage-100 text-vintage-700 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Back button */}
        {showBack && (
          <motion.button
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-vintage-600 hover:text-vintage-800 transition-colors"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </motion.button>
        )}

        {/* Page title */}
        <motion.h2
          key={currentView}
          className="text-lg font-playfair font-semibold text-vintage-800 dark:text-zinc-100"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {viewTitles[currentView] || 'Ganesha ERP'}
        </motion.h2>

        {/* Company selector */}
        {currentCompany && (
          <div className="relative group">
            <motion.button
              className="flex items-center gap-2 px-3 py-1.5 bg-vintage-50 border border-vintage-200 rounded-lg hover:bg-vintage-100 transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Building2 className="w-4 h-4 text-vintage-500" />
              <span className="text-sm font-medium text-vintage-700 dark:text-zinc-300 truncate max-w-[150px]">
                {currentCompany.name}
              </span>
              <ChevronDown className="w-3 h-3 text-vintage-500" />
            </motion.button>

            {/* Dropdown menu */}
            <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-vintage-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="px-3 py-1.5 mb-1">
                <span className="text-[10px] font-bold text-vintage-400 uppercase tracking-widest">Cambiar Empresa</span>
              </div>
              {availableCompanies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (c.id !== currentCompany.id) {
                      setCurrentCompany({ ...currentCompany, id: c.id, name: c.name });
                      navigate('dashboard');
                    }
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between",
                    c.id === currentCompany.id ? "bg-vintage-100 dark:bg-zinc-800 text-vintage-800 dark:text-white font-semibold" : "text-vintage-600 dark:text-zinc-400 hover:bg-vintage-50 dark:hover:bg-zinc-800"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="truncate">{c.name}</span>
                  </div>
                  {c.id === currentCompany.id && <div className="w-1.5 h-1.5 rounded-full bg-success" />}
                </button>
              ))}
              <div className="border-t border-vintage-100 dark:border-zinc-800 mt-1 pt-1 px-2">
                <button 
                  onClick={() => navigate('companies')}
                  className="w-full text-left px-2 py-1.5 text-xs text-vintage-500 hover:text-vintage-700 dark:text-zinc-500 dark:hover:text-zinc-300 flex items-center gap-1.5"
                >
                  <motion.span whileHover={{ x: 2 }}>Gestionar empresas...</motion.span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search button */}
        <button
          onClick={() => navigate('search')}
          className="p-2 rounded-xl hover:bg-vintage-100 dark:hover:bg-zinc-800 text-vintage-600 dark:text-zinc-400 transition-colors hidden sm:flex"
          title="Búsqueda global"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* AI Chat button */}
        <button
          onClick={() => navigate('ai-chat')}
          className="p-2 rounded-xl hover:bg-vintage-100 dark:hover:bg-zinc-800 text-vintage-600 dark:text-zinc-400 transition-colors relative"
          title="IA Contable"
        >
          <Bot className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-vintage-400 animate-pulse-soft" />
        </button>

        {/* Notifications button */}
        <button
          onClick={() => navigate('notifications')}
          className="p-2 rounded-xl hover:bg-vintage-100 dark:hover:bg-zinc-800 text-vintage-600 dark:text-zinc-400 transition-colors relative"
          title="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full bg-error text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </button>

        {/* User Profile dropdown */}
        <div className="relative group ml-1">
          <button className="flex items-center gap-2 p-1 rounded-full hover:bg-vintage-100 dark:hover:bg-zinc-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vintage-300 to-vintage-500 dark:from-zinc-600 dark:to-zinc-800 flex items-center justify-center text-white text-xs font-bold ring-2 ring-vintage-100 dark:ring-zinc-800 ring-offset-2 dark:ring-offset-zinc-900 transition-all group-hover:ring-vintage-300 dark:group-hover:ring-zinc-600">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-vintage-500 transition-transform group-hover:rotate-180" />
          </button>

          <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-vintage-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl shadow-2xl py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 transform origin-top-right scale-95 group-hover:scale-100">
            <div className="px-4 py-2 mb-2">
              <p className="text-sm font-bold text-vintage-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-vintage-500 dark:text-zinc-400 truncate tracking-tight font-medium uppercase">{user?.role}</p>
            </div>
            
            <div className="h-px bg-vintage-100 dark:bg-zinc-800 my-1" />

            {/* Dark Mode Switch in Menu */}
            <button 
              onClick={(e) => { e.stopPropagation(); toggleDarkMode(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-vintage-600 dark:text-zinc-400 hover:bg-vintage-50 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
              </div>
              <div className={cn(
                "w-8 h-4 rounded-full relative transition-colors",
                isDarkMode ? "bg-vintage-400" : "bg-vintage-200 dark:bg-zinc-700"
              )}>
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all",
                  isDarkMode ? "left-4.5" : "left-0.5"
                )} />
              </div>
            </button>

            <button onClick={() => navigate('users')} className="w-full text-left px-4 py-2.5 text-sm text-vintage-600 dark:text-zinc-400 hover:bg-vintage-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors">
              <UserCog className="w-4 h-4" />
              <span>Usuarios</span>
            </button>
            <button onClick={() => navigate('audit')} className="w-full text-left px-4 py-2.5 text-sm text-vintage-600 dark:text-zinc-400 hover:bg-vintage-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors">
              <History className="w-4 h-4" />
              <span>Auditoría</span>
            </button>
            <button onClick={() => navigate('system')} className="w-full text-left px-4 py-2.5 text-sm text-vintage-600 dark:text-zinc-400 hover:bg-vintage-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors">
              <Settings className="w-4 h-4" />
              <span>Sistema</span>
            </button>
            <button onClick={() => navigate('data-mgmt')} className="w-full text-left px-4 py-2.5 text-sm text-vintage-600 dark:text-zinc-400 hover:bg-vintage-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors">
              <Database className="w-4 h-4" />
              <span>Importar / Exportar</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setThemePickerOpen(true); }} 
              className="w-full text-left px-4 py-2.5 text-sm text-vintage-600 dark:text-zinc-400 hover:bg-vintage-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
            >
              <Palette className="w-4 h-4" />
              <span>Personalización</span>
            </button>
            
            <div className="h-px bg-vintage-100 dark:bg-zinc-800 my-2" />
            
            <div className="px-4 py-1.5">
              <span className="text-[9px] font-bold text-vintage-400 dark:text-zinc-500 uppercase tracking-widest">Empresas Vinculadas</span>
            </div>
            
            <div className="max-h-32 overflow-y-auto thin-scrollbar">
              {availableCompanies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (c.id !== currentCompany?.id) {
                      setCurrentCompany({ ...currentCompany!, id: c.id, name: c.name });
                      navigate('dashboard');
                    }
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between",
                    c.id === currentCompany?.id ? "bg-vintage-100/50 dark:bg-zinc-800/50 text-vintage-900 dark:text-white font-bold" : "text-vintage-500 dark:text-zinc-400 hover:bg-vintage-50 dark:hover:bg-zinc-800"
                  )}
                >
                  <span className="truncate">{c.name}</span>
                  {c.id === currentCompany?.id && <div className="w-1 h-1 rounded-full bg-success" />}
                </button>
              ))}
            </div>

            <button onClick={() => navigate('companies')} className="w-full text-left px-4 py-2.5 text-sm text-vintage-500 dark:text-zinc-400 hover:bg-vintage-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors mt-1 border-t border-vintage-100 dark:border-zinc-800 pt-2">
              <Plus className="w-4 h-4" />
              <span>Crear / Gestionar Empresa</span>
            </button>
            
            <div className="h-px bg-vintage-100 dark:bg-zinc-800 my-2" />
            
            <button onClick={() => logout()} className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/5 flex items-center gap-2.5 transition-colors font-medium">
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
      <ThemePicker isOpen={themePickerOpen} onClose={() => setThemePickerOpen(false)} />
    </header>
  );
}
