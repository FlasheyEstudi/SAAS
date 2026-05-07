'use client';

import { useState } from 'react';
import { 
  Bell, 
  Search, 
  LogOut, 
  Shield, 
  Palette, 
  Moon, 
  Sun, 
  Building2, 
  PlusCircle, 
  Briefcase,
  ChevronDown,
  Sparkles,
  Bot,
  Waves,
  Snowflake,
  CheckCircle2,
  AlertCircle,
  Clock,
  Menu
} from 'lucide-react';
import { useAppStore, type ThemeType } from '@/lib/stores/useAppStore';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

import { apiClient } from '@/lib/api/client';
import { NOTIFICATIONS } from '@/lib/api/endpoints';
import { useQuery } from '@tanstack/react-query';

export function Header() {
  const { 
    user,
    logout, 
    navigate,
    theme, 
    setTheme, 
    currentCompany, 
    availableCompanies, 
    setCurrentCompany,
    setGlobalSearch,
    globalSearch,
    setSidebarOpen,
    companyId
  } = useAppStore();

  const [showCompanies, setShowCompanies] = useState(false);
  const [showThemes, setShowThemes] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('landing');
    toast.info('Sesión cerrada correctamente');
  };

  const handleCompanyChange = (companyId: string) => {
    const company = availableCompanies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company as any);
      toast.success(`Cambiado a: ${company.name}`);
    }
  };

  const themes: { id: ThemeType; name: string; icon: React.ReactNode }[] = [
    { id: 'onyx', name: 'Onyx Midnight', icon: <Moon className="w-4 h-4 text-amber-500" /> },
    { id: 'ivory', name: 'Ivory Grace', icon: <Sun className="w-4 h-4 text-zinc-400" /> },
    { id: 'ocean', name: 'Midnight Ocean', icon: <Waves className="w-4 h-4 text-blue-400" /> },
    { id: 'frost', name: 'Nordic Frost', icon: <Snowflake className="w-4 h-4 text-cyan-300" /> },
    { id: 'copper', name: 'Copper Ethos', icon: <Sparkles className="w-4 h-4 text-orange-400" /> },
    { id: 'amethyst', name: 'Amethyst Vision', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
  ];

  // Fetch real notifications for the header
  const { data: notificationsData } = useQuery<any>({
    queryKey: ['notifications', 'header', { companyId }],
    queryFn: () => apiClient.get(NOTIFICATIONS.list, { companyId, isRead: 'false', limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
    enabled: !!companyId,
    refetchInterval: 30000, // Sync every 30s
  });

  const displayNotifications = (notificationsData as any)?.data || [];
  const unreadCount = displayNotifications.length;

  return (
    <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-3xl px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-500 gap-2">
      {/* LEFT: Hamburger + Logo */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Hamburger - mobile only */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 -ml-1 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div 
          onClick={() => navigate('dashboard')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#EA580C]/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <img 
              src="/GaneshaLogo.png" 
              alt="Ganesha Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 drop-shadow-[0_0_15px_rgba(234,88,12,0.3)] relative z-10"
            />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <h1 className="text-xl font-black uppercase tracking-tighter text-white leading-none">
              GANESHA
            </h1>
            <span className="text-[9px] font-black text-[#EA580C] uppercase tracking-[0.4em] mt-1 opacity-90">
              Intelligence System
            </span>
          </div>
        </div>
        
        {/* Company selector - desktop only */}
        <div className="hidden xl:flex items-center gap-2 border-l border-muted pl-4 ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all group outline-none">
              <Building2 className="w-4 h-4 text-primary opacity-70 group-hover:opacity-100" />
              <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">{currentCompany?.name || 'Empresa'}</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-card border-border shadow-2xl p-2 rounded-xl flex flex-col gap-1" align="start">
              <DropdownMenuLabel className="text-[9px] uppercase tracking-widest font-black text-muted-foreground px-2 py-2 border-border mb-1">Elegir Empresa Activa</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableCompanies?.length === 0 && (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">Logueate nuevamente para refrescar</div>
              )}
              {availableCompanies?.map(c => (
                <DropdownMenuItem 
                  key={c.id} 
                  onClick={() => handleCompanyChange(c.id)}
                  className="flex justify-between items-center px-2 py-3 cursor-pointer hover:bg-muted/30 rounded-lg outline-none"
                >
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-3 h-3 text-muted-foreground" />
                      <span className={`text-[10px] uppercase font-bold tracking-wide ${currentCompany?.id === c.id ? 'text-primary' : 'text-foreground'}`}>
                        {c.name}
                      </span>
                    </div>
                    {currentCompany?.id === c.id && <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button 
            onClick={() => navigate('companies')}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-all"
            title="Administrar Empresas"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTER: Search - hidden on mobile */}
      <div className="flex-1 flex justify-center max-w-md mx-2 hidden md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground font-bold" />
          <Input 
            placeholder="Buscar en el sistema... (Enter)" 
            className="pl-10 bg-muted/20 border-none text-foreground placeholder:text-muted-foreground h-9 rounded-xl focus-visible:ring-primary/10 transition-all focus:bg-muted/40 w-full"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate('search');
              }
            }}
          />
        </div>
      </div>

      {/* RIGHT: IA, Notifications, Profile */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {/* IA button */}
        <button 
          onClick={() => navigate('ai-chat')}
          className="relative overflow-hidden p-2 sm:px-5 sm:py-2.5 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] text-white shadow-[0_5px_15px_rgba(234,88,12,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group border-none"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
          <Bot className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden md:block">IA Ganesha</span>
        </button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 sm:p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all relative outline-none">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 sm:top-2.5 right-1.5 sm:right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background shadow-[0_0_10px_rgba(234,88,12,0.5)]" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[calc(100vw-1.5rem)] sm:w-80 p-2 bg-card border-border shadow-2xl rounded-2xl overflow-hidden" align="end" sideOffset={8}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 pointer-events-none" />
            <DropdownMenuLabel className="px-3 py-3 flex items-center justify-between relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Protocolos de Alerta</span>
              <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider">{unreadCount} Activos</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <div className="max-h-80 overflow-y-auto relative z-10 custom-scrollbar">
              {displayNotifications.length > 0 ? (
                displayNotifications.map((notif: any) => (
                  <DropdownMenuItem key={notif.id} className="p-3 cursor-pointer rounded-xl hover:bg-white/5 mb-1 flex gap-3 items-start border border-transparent hover:border-white/5 transition-all">
                    <div className={cn(
                      "mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg",
                      notif.type === 'WARNING' ? "bg-orange-500/10 text-orange-500" : "bg-primary/10 text-primary"
                    )}>
                      {notif.type === 'WARNING' ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-tight">{notif.type === 'WARNING' ? 'CRÍTICO' : 'IA SUGERENCIA'}</p>
                        <p className="text-xs font-bold text-foreground mt-0.5 leading-tight truncate">{notif.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed opacity-70">{notif.message}</p>
                        <div className="flex items-center gap-1 mt-2 opacity-40">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="text-[8px] font-bold uppercase">{notif.createdAt ? formatDate(notif.createdAt, 'HH:mm') : 'Sincronizado'}</span>
                        </div>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="py-12 px-4 text-center space-y-3 opacity-20">
                  <CheckCircle2 className="w-10 h-10 mx-auto" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]">Sistema Íntegro</p>
                </div>
              )}
            </div>
            {unreadCount > 0 && (
               <div className="p-2 border-t border-white/5 bg-white/[0.02] relative z-10">
                  <button onClick={() => navigate('notifications')} className="w-full py-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
                     Centro de Inteligencia
                  </button>
               </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-muted mx-1 sm:mx-2 hidden sm:block" />

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 sm:gap-3 p-1 rounded-2xl hover:bg-muted/30 transition-all outline-none border border-transparent">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden relative">
               <div className="w-full h-full bg-gradient-to-tr from-muted to-background flex items-center justify-center text-muted-foreground font-bold text-xs uppercase">
                 {user?.name?.substring(0, 1) || 'C'}
               </div>
            </div>
            <div className="hidden md:flex flex-col items-start mr-1">
              <span className="text-[11px] font-black text-foreground uppercase tracking-wider leading-none mb-1">{user?.name || 'Maestro'}</span>
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none opacity-60">Empresarial</span>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-[280px] sm:w-72 bg-card border-border text-muted-foreground p-2 shadow-2xl rounded-2xl max-h-[80vh] overflow-y-auto" align="end" sideOffset={8}>
            <DropdownMenuLabel className="px-3 py-3 sm:py-4">
              <div className="flex flex-col gap-1">
                <p className="text-foreground text-xs font-black uppercase tracking-widest">{user?.name}</p>
                <p className="text-[9px] text-muted-foreground font-bold tracking-widest lowercase">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />

            {/* Company selector - inline */}
            <div className="px-1 py-1">
              <button 
                onClick={() => setShowCompanies(!showCompanies)}
                className="flex items-center justify-between w-full gap-3 px-3 py-3 rounded-xl hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Mis Empresas</span>
                </div>
                <ChevronDown className={cn("w-3 h-3 transition-transform", showCompanies && "rotate-180")} />
              </button>
              {showCompanies && (
                <div className="pl-4 pr-1 pb-2 space-y-1">
                  {availableCompanies?.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => { handleCompanyChange(c.id); setShowCompanies(false); }}
                      className="flex justify-between items-center w-full px-3 py-2.5 cursor-pointer hover:bg-muted/30 rounded-lg transition-colors"
                    >
                       <div className="flex items-center gap-3">
                          <Briefcase className="w-3 h-3 text-muted-foreground" />
                          <span className={`text-[10px] uppercase font-bold ${currentCompany?.id === c.id ? 'text-primary' : 'text-muted-foreground'}`}>
                            {c.name}
                          </span>
                       </div>
                       {currentCompany?.id === c.id && <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <DropdownMenuSeparator />
            
            {/* Theme selector - inline */}
            <div className="px-1 py-1">
              <button 
                onClick={() => setShowThemes(!showThemes)}
                className="flex items-center justify-between w-full gap-3 px-3 py-3 rounded-xl hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Temas Maestro</span>
                </div>
                <ChevronDown className={cn("w-3 h-3 transition-transform", showThemes && "rotate-180")} />
              </button>
              {showThemes && (
                <div className="pl-4 pr-1 pb-2 space-y-1">
                  {themes.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => { setTheme(t.id); setShowThemes(false); }}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all ${theme === t.id ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'hover:bg-muted/30 text-muted-foreground'}`}
                    >
                      {t.icon}
                      <span className="text-[9px] font-black uppercase tracking-widest">{t.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <DropdownMenuItem 
              onClick={() => navigate('audit')}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/30 hover:text-foreground transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] font-black uppercase tracking-widest">Auditoría & Logs</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

