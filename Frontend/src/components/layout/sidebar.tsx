'use client';

import { 
  BarChart3, 
  BookOpen, 
  Briefcase, 
  ChevronLeft, 
  ChevronRight, 
  CreditCard, 
  Database, 
  FileBox, 
  FileSpreadsheet, 
  FileText, 
  Home, 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  ShieldCheck,
  Zap,
  Globe,
  Calculator,
  GanttChartSquare,
  Network
} from 'lucide-react';
import { useAppStore, type AppView } from '@/lib/stores/useAppStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  view: AppView;
  category?: string;
}

const menuItems: MenuItem[] = [
  // Principal
  { title: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, view: 'dashboard', category: 'General' },
  
  // Contabilidad
  { title: 'Pólizas', icon: <FileSpreadsheet className="w-5 h-5" />, view: 'journal', category: 'Contabilidad' },
  { title: 'Catálogo de Cuentas', icon: <BookOpen className="w-5 h-5" />, view: 'accounts', category: 'Contabilidad' },
  { title: 'Periodos Fiscales', icon: <Calculator className="w-5 h-5" />, view: 'periods', category: 'Contabilidad' },
  { title: 'Centros de Costo', icon: <Network className="w-5 h-5" />, view: 'cost-centers', category: 'Contabilidad' },
  
  // Facturación
  { title: 'Facturas', icon: <FileText className="w-5 h-5" />, view: 'invoices', category: 'Tesorería' },
  { title: 'Terceros / Clientes', icon: <Users className="w-5 h-5" />, view: 'third-parties', category: 'Tesorería' },
  { title: 'Bancos / Cuentas', icon: <CreditCard className="w-5 h-5" />, view: 'banks', category: 'Tesorería' },
  
  // Avanzado
  { title: 'Activos Fijos', icon: <FileBox className="w-5 h-5" />, view: 'assets', category: 'Avanzado' },
  { title: 'Presupuestos', icon: <GanttChartSquare className="w-5 h-5" />, view: 'budgets', category: 'Avanzado' },
  { title: 'Tipo de Cambio', icon: <Globe className="w-5 h-5" />, view: 'exchange', category: 'Avanzado' },
  
  // Reportes
  { title: 'Reportes', icon: <BarChart3 className="w-5 h-5" />, view: 'reports', category: 'Reportes' },
  { title: 'Impuestos', icon: <Briefcase className="w-5 h-5" />, view: 'taxes', category: 'Reportes' },
  
  // Sistema
  { title: 'Auditoría', icon: <ShieldCheck className="w-5 h-5" />, view: 'audit', category: 'Sistema' },
  { title: 'Gestión de Datos', icon: <Database className="w-5 h-5" />, view: 'data-management', category: 'Sistema' },
  { title: 'Configuración', icon: <Settings className="w-5 h-5" />, view: 'system', category: 'Sistema' },
];

export function Sidebar() {
  const { 
    currentView, 
    navigate, 
    sidebarCollapsed, 
    setSidebarCollapsed,
    isDarkMode,
    theme 
  } = useAppStore();

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  // Group items by category
  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-50 transition-all duration-300 border-r border-white/5',
        sidebarCollapsed ? 'w-[70px]' : 'w-[260px]',
        'bg-sidebar'
      )}
    >
      {/* Branding Section (Logo only to avoid duplicate name) */}
      <div className="h-16 flex items-center px-4 border-b border-white/5 mb-2 overflow-hidden">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => navigate('dashboard')}
            className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 cursor-pointer"
          >
             <img src="/images/logo_ganesha.png" alt="Ganesha Logo" className="w-full h-full object-cover" />
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
               <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest">Master Menu</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navegación */}
      <div className="h-[calc(100vh-140px)] overflow-y-auto px-3 py-2 custom-scrollbar">
        {categories.map((cat, catIdx) => (
          <div key={cat} className="mb-4 last:mb-0">
            {!sidebarCollapsed && (
              <p className="px-3 mb-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                {cat}
              </p>
            )}
            <div className="space-y-1">
              {menuItems
                .filter(item => item.category === cat)
                .map((item) => {
                  const isActive = currentView === item.view || (item.view === 'data-management' && currentView === 'data-mgmt');
                  return (
                    <button
                      key={item.view}
                      onClick={() => navigate(item.view)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                        isActive 
                          ? 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/5' 
                          : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                      )}
                    >
                      <span className={cn(
                        'transition-transform duration-200 group-hover:scale-110',
                        isActive ? 'text-amber-500' : 'text-zinc-600'
                      )}>
                        {item.icon}
                      </span>
                      
                      {!sidebarCollapsed && (
                        <span className="text-[11px] font-bold tracking-wide transition-all truncate">
                          {item.title}
                        </span>
                      )}

                      {isActive && (
                        <motion.div 
                          layoutId="active-indicator"
                          className="absolute left-0 w-1 h-5 bg-amber-500 rounded-r-full"
                        />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* IA Assistant / Shortcuts (Enhanced visibility) */}
      <div className="absolute bottom-4 left-0 w-full px-4">
        <button 
          onClick={() => navigate('ai-chat')}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-400/50 hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative shadow-lg shadow-amber-500/20",
            sidebarCollapsed && "justify-center"
          )}
        >
          <Zap className="w-5 h-5 text-black animate-pulse" />
          {!sidebarCollapsed && (
            <div className="flex flex-col items-start leading-none">
               <span className="text-[11px] font-black text-black uppercase tracking-wider">IA Ganesha</span>
               <span className="text-[8px] text-black/60 font-black uppercase tracking-widest mt-1">Asesor Activo</span>
            </div>
          )}
          {/* Internal shine effect */}
          <div className="absolute top-[-100%] left-[-100%] w-[300%] h-[300%] bg-white/20 rotate-45 translate-x-[-50%] group-hover:translate-x-[50%] transition-transform duration-1000 pointer-events-none" />
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-amber-500/50 transition-all shadow-xl z-50"
      >
        {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
