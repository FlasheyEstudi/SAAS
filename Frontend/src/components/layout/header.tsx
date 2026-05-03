'use client';

import { useState } from 'react';
import { 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Shield, 
  Database, 
  Palette, 
  Moon, 
  Sun, 
  Building2, 
  PlusCircle, 
  Briefcase,
  ChevronDown,
  Sparkles,
  Bot,
  FileDown,
  Waves,
  Snowflake,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useAppStore, type ThemeType } from '@/lib/stores/useAppStore';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

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
    notifications = []
  } = useAppStore();

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

  // Notificaciones reales del sistema
  const displayNotifications = notifications;

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-3xl px-6 grid grid-cols-3 items-center sticky top-0 z-40 transition-colors duration-500">
      {/* SECCIÓN IZQUIERDA: Logo y Empresa */}
      <div className="flex items-center gap-4">
        <div 
          onClick={() => navigate('dashboard')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <img 
              src="/GaneshaLogo.png" 
              alt="Ganesha Logo"
              className="w-10 h-10 object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 drop-shadow-xl relative z-10"
            />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <h1 className="text-xl font-black uppercase tracking-tighter text-foreground dark:text-zinc-100 leading-none">
              GANESHA
            </h1>
            <span className="text-[9px] font-bold text-primary uppercase tracking-[0.4em] mt-1 opacity-80">
              Soberanía Financiera
            </span>
          </div>
        </div>
        
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

      {/* SECCIÓN CENTRAL: Buscador Centrado */}
      <div className="flex justify-center w-full">
        <div className="relative max-w-md w-full hidden lg:block">
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

      {/* SECCIÓN DERECHA: IA, Notificaciones y Perfil */}
      <div className="flex items-center justify-end gap-3 sm:gap-4">
        {/* IA Assistant Quick access (Mejorado) */}
        <button 
          onClick={() => navigate('ai-chat')}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-600/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center gap-2 group shadow-sm shadow-amber-500/5"
        >
          <Bot className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">IA Ganesha</span>
        </button>

        {/* NOTIFICATIONS DROPDOWN */}
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all relative outline-none">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-2 bg-card border-border shadow-2xl rounded-2xl" align="end">
            <DropdownMenuLabel className="px-3 py-3 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-foreground">Avisos Recientes</span>
              <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{displayNotifications.length} Avisos</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {displayNotifications.length > 0 ? (
                displayNotifications.map((notif) => (
                  <DropdownMenuItem key={notif.id} className="p-3 cursor-pointer rounded-xl hover:bg-muted/30 mb-1 flex gap-3 items-start">
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      notif.type === 'SUCCESS' ? 'bg-green-500/10 text-green-500' :
                      notif.type === 'ERROR' ? 'bg-red-500/10 text-red-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {notif.type === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                        <p className="text-[11px] font-black text-foreground uppercase tracking-wide leading-tight">{notif.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                        <div className="flex items-center gap-1 mt-1.5 opacity-50">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="text-[8px] font-bold uppercase">{notif.createdAt ? formatDate(notif.createdAt, 'HH:mm') : 'Ahora'}</span>
                        </div>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="py-8 px-4 text-center">
                  <p className="text-xs text-muted-foreground">No tienes notificaciones pendientes</p>
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-muted mx-2" />

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 p-1 rounded-2xl hover:bg-muted/30 transition-all outline-none border border-transparent">
            <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden relative">
               <div className="w-full h-full bg-gradient-to-tr from-muted to-background flex items-center justify-center text-muted-foreground font-bold text-xs uppercase">
                 {user?.name?.substring(0, 1) || 'C'}
               </div>
            </div>
            <div className="hidden md:flex flex-col items-start mr-1">
              <span className="text-[11px] font-black text-foreground uppercase tracking-wider leading-none mb-1">{user?.name || 'Maestro'}</span>
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none opacity-60">Empresarial</span>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-72 bg-card border-border text-muted-foreground p-2 shadow-2xl rounded-2xl" align="end">
            <DropdownMenuLabel className="px-3 py-4">
              <div className="flex flex-col gap-1">
                <p className="text-foreground text-xs font-black uppercase tracking-widest">{user?.name}</p>
                <p className="text-[9px] text-muted-foreground font-bold tracking-widest lowercase">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />

            {/* GESTIÓN DE EMPRESAS */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/30 hover:text-foreground transition-colors cursor-pointer">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">Mis Empresas</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-card border-border shadow-2xl p-2 min-w-[220px] rounded-xl">
                <DropdownMenuLabel className="text-[9px] uppercase tracking-widest font-black text-muted-foreground px-2 py-2 border-b border-border mb-1">Elegir Empresa</DropdownMenuLabel>
                {availableCompanies?.map(c => (
                  <DropdownMenuItem 
                    key={c.id} 
                    onClick={() => handleCompanyChange(c.id)}
                    className="flex justify-between items-center px-2 py-3 cursor-pointer hover:bg-muted/30 rounded-lg"
                  >
                     <div className="flex items-center gap-3">
                        <Briefcase className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-[10px] uppercase font-bold ${currentCompany?.id === c.id ? 'text-primary' : 'text-muted-foreground'}`}>
                          {c.name}
                        </span>
                     </div>
                     {currentCompany?.id === c.id && <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            
            {/* PERSONALIZACIÓN */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/30 hover:text-foreground transition-colors cursor-pointer">
                <Palette className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">Temas Maestro</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-card border-border shadow-2xl p-2 rounded-xl">
                <div className="px-2 py-2 mb-2 flex flex-col gap-2">
                   <div className="grid grid-cols-1 gap-1">
                      {themes.map(t => (
                        <button 
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all ${theme === t.id ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'hover:bg-muted/30 text-muted-foreground'}`}
                        >
                          {t.icon}
                          <span className="text-[9px] font-black uppercase tracking-widest">{t.name}</span>
                        </button>
                      ))}
                   </div>
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

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
