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
  X
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
  { title: 'Usuarios', icon: <Users className="w-5 h-5" />, view: 'users', category: 'Sistema' },
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

  const sidebarContent = (
    <>
      {/* Branding Section */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-white/10 mb-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img 
              src="/GaneshaLogo.png" 
              alt="Ganesha Logo"
              onClick={() => navigate('dashboard')}
              className="w-12 h-12 object-contain cursor-pointer transition-all duration-500 hover:scale-110 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] relative z-10"
            />
          </div>
          {(!sidebarCollapsed || sidebarOpen) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
               <h2 className="text-lg font-black text-white leading-none tracking-tighter">GANESHA</h2>
               <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] mt-1">Intelligence</span>
            </motion.div>
          )}
        </div>

        {/* Close button for mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all relative z-10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navegación */}
      <div className="h-[calc(100vh-140px)] overflow-y-auto px-3 py-2 custom-scrollbar">
        {categories.map((cat) => (
          <div key={cat} className="mb-4 last:mb-0">
            {(!sidebarCollapsed || sidebarOpen) && (
              <p className="px-3 mb-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                {cat}
              </p>
            )}
            <div className="space-y-1">
              {filteredMenuItems
                .filter(item => item.category === cat)
                .map((item) => {
                  const isActive = currentView === item.view || (item.view === 'data-management' && currentView === 'data-mgmt');
                  return (
                    <button
                      key={item.view}
                      onClick={() => navigate(item.view)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-xl transition-all duration-200 group relative text-left',
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
                      
                      {(!sidebarCollapsed || sidebarOpen) && (
                        <span className="text-[12px] lg:text-[11px] font-bold tracking-wide transition-all truncate">
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

      {/* IA Assistant */}
      <div className="absolute bottom-4 left-0 w-full px-4">
        <button 
          onClick={() => navigate('ai-chat')}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-400/50 hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative shadow-lg shadow-amber-500/20",
            sidebarCollapsed && !sidebarOpen && "justify-center"
          )}
        >
          <Zap className="w-5 h-5 text-black animate-pulse" />
          {(!sidebarCollapsed || sidebarOpen) && (
            <div className="flex flex-col items-start leading-none">
               <span className="text-[11px] font-black text-black uppercase tracking-wider">IA Ganesha</span>
               <span className="text-[8px] text-black/60 font-black uppercase tracking-widest mt-1">Asesor Activo</span>
            </div>
          )}
          <div className="absolute top-[-100%] left-[-100%] w-[300%] h-[300%] bg-white/20 rotate-45 translate-x-[-50%] group-hover:translate-x-[50%] transition-transform duration-1000 pointer-events-none" />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* MOBILE OVERLAY BACKDROP */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* MOBILE SIDEBAR (drawer) */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen z-[60] transition-transform duration-300 border-r border-white/5 w-[280px] bg-sidebar lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* DESKTOP SIDEBAR (persistent) */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen z-50 transition-all duration-300 border-r border-white/5 hidden lg:block',
          sidebarCollapsed ? 'w-[70px]' : 'w-[260px]',
          'bg-sidebar'
        )}
      >
        {sidebarContent}

        {/* Collapse Toggle (desktop only) */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-amber-500/50 transition-all shadow-xl z-50"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>
    </>
  );
}
