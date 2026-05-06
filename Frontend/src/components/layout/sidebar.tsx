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
  LayoutDashboard, 
  Users, 
  Settings, 
  ShieldCheck,
  Zap,
  Globe,
  Calculator,
  GanttChartSquare,
  Network,
  X,
  HelpCircle,
  Code2,
  Terminal,
  BookMarked
} from 'lucide-react';
import { useAppStore, type AppView } from '@/lib/stores/useAppStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  view: AppView;
  category?: string;
}

const menuItems: MenuItem[] = [
  // Principal
  { title: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, view: 'dashboard', category: 'General' },
  
  // Contabilidad
  { title: 'Pólizas', icon: <FileSpreadsheet className="w-4 h-4" />, view: 'journal', category: 'Contabilidad' },
  { title: 'Catálogo de Cuentas', icon: <BookOpen className="w-4 h-4" />, view: 'accounts', category: 'Contabilidad' },
  { title: 'Periodos Fiscales', icon: <Calculator className="w-4 h-4" />, view: 'periods', category: 'Contabilidad' },
  { title: 'Centros de Costo', icon: <Network className="w-4 h-4" />, view: 'cost-centers', category: 'Contabilidad' },
  
  // Facturación
  { title: 'Facturas', icon: <FileText className="w-4 h-4" />, view: 'invoices', category: 'Tesorería' },
  { title: 'Terceros / Clientes', icon: <Users className="w-4 h-4" />, view: 'third-parties', category: 'Tesorería' },
  { title: 'Bancos / Cuentas', icon: <CreditCard className="w-4 h-4" />, view: 'banks', category: 'Tesorería' },
  
  // Avanzado
  { title: 'Activos Fijos', icon: <FileBox className="w-4 h-4" />, view: 'assets', category: 'Avanzado' },
  { title: 'Presupuestos', icon: <GanttChartSquare className="w-4 h-4" />, view: 'budgets', category: 'Avanzado' },
  { title: 'Tipo de Cambio', icon: <Globe className="w-4 h-4" />, view: 'exchange', category: 'Avanzado' },
  
  // Reportes
  { title: 'Reportes', icon: <BarChart3 className="w-4 h-4" />, view: 'reports', category: 'Reportes' },
  { title: 'Impuestos', icon: <Briefcase className="w-4 h-4" />, view: 'taxes', category: 'Reportes' },
  
  // Sistema
  { title: 'Usuarios', icon: <Users className="w-4 h-4" />, view: 'users', category: 'Sistema' },
  { title: 'Auditoría', icon: <ShieldCheck className="w-4 h-4" />, view: 'audit', category: 'Sistema' },
  { title: 'Gestión de Datos', icon: <Database className="w-4 h-4" />, view: 'data-management', category: 'Sistema' },
  { title: 'Configuración', icon: <Settings className="w-4 h-4" />, view: 'system', category: 'Sistema' },

  // Soporte & Docs
  { title: 'Documentación', icon: <BookMarked className="w-4 h-4" />, view: 'support', category: 'Soporte' },
  { title: 'API Reference', icon: <Terminal className="w-4 h-4" />, view: 'support', category: 'Soporte' },
  { title: 'Manual Maestro', icon: <HelpCircle className="w-4 h-4" />, view: 'support', category: 'Soporte' },
];

export function Sidebar() {
  const { 
    currentView, 
    navigate, 
    sidebarCollapsed, 
    setSidebarCollapsed,
    sidebarOpen,
    setSidebarOpen,
    user: currentUser
  } = useAppStore();

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const isAdmin = currentUser?.role === 'ADMIN';

  // Group items by category and filter by role
  const filteredMenuItems = menuItems.filter(item => {
    if (item.view === 'users' && !isAdmin) return false;
    if (item.view === 'audit' && !isAdmin) return false;
    return true;
  });

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [setSidebarOpen]);

  // Group items by category
  const categories = Array.from(new Set(filteredMenuItems.map(item => item.category)));

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-[120] h-full bg-background border-r border-border transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-[70px]" : "w-[260px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header/Logo */}
        <div className="h-[65px] flex items-center px-5 border-b border-border/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
               <img src="/GaneshaLogo.png" className="w-5 h-5 object-contain" alt="Logo" />
            </div>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-black tracking-tighter uppercase text-sm truncate"
              >
                Ganesha<span className="text-primary">.</span>
              </motion.span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto p-1.5 text-zinc-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="h-[calc(100%-140px)] overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
          {categories.map((cat) => (
            <div key={cat} className="mb-6 last:mb-0">
              {!sidebarCollapsed && cat && (
                <p className="px-3 mb-2 text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] opacity-60">
                  {cat}
                </p>
              )}
              <div className="space-y-1">
                {filteredMenuItems
                  .filter((item) => item.category === cat)
                  .map((item) => (
                    <button
                      key={item.title}
                      onClick={() => {
                        navigate(item.view);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group relative",
                        currentView === item.view
                          ? "bg-primary/10 text-primary"
                          : "text-zinc-500 hover:text-foreground hover:bg-zinc-800/50"
                      )}
                      title={sidebarCollapsed ? item.title : undefined}
                    >
                      <div className={cn(
                        "flex-shrink-0 transition-transform group-hover:scale-110",
                        currentView === item.view ? "text-primary" : "text-zinc-500 group-hover:text-primary"
                      )}>
                        {item.icon}
                      </div>
                      {!sidebarCollapsed && (
                        <span className="text-[12px] font-bold tracking-tight truncate">
                          {item.title}
                        </span>
                      )}
                      {currentView === item.view && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute left-0 w-1 h-4 bg-primary rounded-r-full"
                        />
                      )}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer/Toggle */}
        <div className="absolute bottom-0 left-0 w-full p-3 border-t border-border/50 bg-background/80 backdrop-blur-md">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-xl border border-border/50 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Colapsar</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
