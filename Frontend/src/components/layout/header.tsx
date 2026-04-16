'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/stores/useAppStore';
import { Menu, Bell, Search, Bot, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export function Header() {
  const { toggleSidebar, sidebarCollapsed, currentView, unreadCount, navigate, goBack, viewParams, user } = useAppStore();

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
  };

  const showBack = currentView === 'journal-create' || currentView === 'journal-detail' || currentView === 'invoice-create' || currentView === 'invoice-detail';

  return (
    <header className={cn(
      'sticky top-0 z-30 flex items-center justify-between h-[65px] px-4 lg:px-6 border-b border-vintage-200 bg-vintage-50/80 backdrop-blur-md transition-all duration-300',
      sidebarCollapsed ? 'lg:ml-[70px]' : 'lg:ml-[260px]'
    )}>
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={toggleSidebar}
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
          className="text-lg font-playfair font-semibold text-vintage-800"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {viewTitles[currentView] || 'Contable ERP'}
        </motion.h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Search button */}
        <button
          onClick={() => navigate('search')}
          className="p-2 rounded-xl hover:bg-vintage-100 text-vintage-600 transition-colors hidden sm:flex"
          title="Búsqueda global"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* AI Chat button */}
        <button
          onClick={() => navigate('ai-chat')}
          className="p-2 rounded-xl hover:bg-vintage-100 text-vintage-600 transition-colors relative"
          title="IA Contable"
        >
          <Bot className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-vintage-400 animate-pulse-soft" />
        </button>

        {/* Notifications button */}
        <button
          onClick={() => navigate('notifications')}
          className="p-2 rounded-xl hover:bg-vintage-100 text-vintage-600 transition-colors relative"
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

        {/* User avatar */}
        {user && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vintage-300 to-vintage-500 flex items-center justify-center text-white text-xs font-bold ml-1">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </header>
  );
}
