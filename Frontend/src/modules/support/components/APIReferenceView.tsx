'use client';

import { motion } from 'framer-motion';
import { 
  Terminal, ArrowLeft, Search, Copy, Check, ChevronRight, 
  Database, Shield, Globe, Zap, Cpu, Code2, Layers,
  ExternalLink, Info, AlertTriangle, Braces, Lock, Binary
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/lib/stores/useAppStore';
import { VintageCard } from '@/components/ui/vintage-card';
import { cn } from '@/lib/utils';

export function APIReferenceView() {
  const navigate = useAppStore((s) => s.navigate);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const categories = [
    {
      title: "🏢 Empresas & Tenants",
      endpoints: [
        { method: 'POST', path: '/api/companies', desc: 'Registrar nueva entidad corporativa.' },
        { method: 'GET', path: '/api/companies', desc: 'Listado global de empresas con filtros.' },
        { method: 'PUT', path: '/api/companies/[id]', desc: 'Actualizar metadata de la empresa.' },
      ]
    },
    {
      title: "📅 Contabilidad & Períodos",
      endpoints: [
        { method: 'POST', path: '/api/periods/batch', desc: 'Generación masiva de años fiscales.' },
        { method: 'POST', path: '/api/periods/[id]/close', desc: 'Cierre físico de período contable.' },
        { method: 'GET', path: '/api/accounts/tree', desc: 'Árbol jerárquico del catálogo de cuentas.' },
      ]
    },
    {
      title: "📝 Pólizas (Diario)",
      endpoints: [
        { method: 'POST', path: '/api/journal-entries', desc: 'Creación de póliza con validación de partida doble.' },
        { method: 'POST', path: '/api/journal-entries/[id]/post', desc: 'Publicación oficial (afecta saldos).' },
        { method: 'GET', path: '/api/journal-entries', desc: 'Historial de movimientos contables.' },
      ]
    },
    {
      title: "🧾 Facturación & Cartera",
      endpoints: [
        { method: 'POST', path: '/api/invoices', desc: 'Registrar factura de venta o compra.' },
        { method: 'POST', path: '/api/invoices/[id]/pay', desc: 'Aplicar abono o pago total.' },
        { method: 'GET', path: '/api/reports/aging', desc: 'Reporte de antigüedad de saldos.' },
      ]
    },
    {
      title: "🤖 Inteligencia Artificial",
      endpoints: [
        { method: 'POST', path: '/api/ai/chat', desc: 'Prompting con motor de auditoría AI.' },
        { method: 'GET', path: '/api/ai/status', desc: 'Estado del motor Ollama local.' },
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background text-foreground pb-40"
    >
      {/* Cabecera Fija */}
      <div className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-background/80 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate('landing')} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Terminal className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-black uppercase tracking-tighter">Referencia API Enterprise</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[9px] font-black uppercase text-zinc-400">v1.0.2 Estable</span>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-16 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-16">
        
        {/* Contenido Principal */}
        <div className="space-y-20">
          
          {/* Sección Hero */}
          <section className="space-y-6">
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
              Protocolo de <br/><span className="text-primary italic">Integración.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-medium">
              Expande Ganesha ERP mediante nuestra API RESTful modular. Diseñada para 
              desarrolladores que exigen velocidad, seguridad y precisión financiera.
            </p>
          </section>

          {/* Búsqueda y Filtro */}
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="BUSCAR ENDPOINT (EJ: FACTURAS, AUDITORÍA...)"
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
              className="w-full h-16 pl-16 pr-6 bg-card border border-primary/10 rounded-[1.5rem] text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-xl"
            />
          </div>

          {/* Lista de Endpoints */}
          <div className="space-y-16">
            {categories.map((cat, idx) => (
              <section key={idx} className="space-y-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black uppercase tracking-tight shrink-0">{cat.title}</h2>
                  <div className="h-px flex-1 bg-primary/10" />
                </div>
                <div className="grid gap-3">
                  {cat.endpoints.map((ep, i) => (
                    <div 
                      key={i} 
                      className="group p-6 rounded-[1.5rem] bg-card/40 border border-primary/5 hover:border-primary/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-5">
                        <span className={cn(
                          "text-[10px] font-black px-3 py-1.5 rounded-xl border shrink-0",
                          ep.method === 'POST' ? "bg-success/5 border-success/20 text-success" : 
                          ep.method === 'GET' ? "bg-info/5 border-info/20 text-info" : 
                          "bg-warning/5 border-warning/20 text-warning"
                        )}>{ep.method}</span>
                        <div>
                          <div className="text-sm font-black font-mono tracking-tight group-hover:text-primary transition-colors">{ep.path}</div>
                          <div className="text-[10px] text-muted-foreground uppercase mt-1 font-bold">{ep.desc}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyToClipboard(ep.path)}
                          className="p-3 bg-background border border-primary/10 rounded-xl hover:bg-primary/5 transition-all"
                        >
                          {copied === ep.path ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        <button className="p-3 bg-background border border-primary/10 rounded-xl hover:bg-primary/5 transition-all">
                           <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Sección de Detalles Profundos */}
          <section className="space-y-12">
            <h2 className="text-3xl font-black uppercase tracking-tight">Estándar de <span className="text-primary italic">Seguridad.</span></h2>
            <div className="grid md:grid-cols-2 gap-8">
               <VintageCard className="p-10 space-y-6 bg-zinc-950 border-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                     <Lock className="w-32 h-32" />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <h4 className="text-sm font-black uppercase text-primary">Autenticación HMAC</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                      Toda comunicación externa debe estar firmada mediante un hash HMAC-SHA256. 
                      El servidor rechazará cualquier petición que no incluya el timestamp y la firma válida.
                    </p>
                    <pre className="p-4 rounded-xl bg-black/50 border border-white/5 font-mono text-[9px] text-zinc-500">
{`header "X-Ganesha-Sig"
hash(timestamp + apiKey + secret)`}
                    </pre>
                  </div>
               </VintageCard>
               <VintageCard className="p-10 space-y-6">
                  <h4 className="text-sm font-black uppercase text-primary">Rate Limiting</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                    Protegemos la integridad del motor contable limitando las peticiones concurrentes. 
                    En modo Enterprise, los límites se ajustan dinámicamente según la carga.
                  </p>
                  <div className="flex gap-2">
                     <div className="flex-1 p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
                        <div className="text-[8px] uppercase text-zinc-500 mb-1">Ráfaga</div>
                        <div className="text-xs font-black">50/s</div>
                     </div>
                     <div className="flex-1 p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
                        <div className="text-[8px] uppercase text-zinc-500 mb-1">Sostenido</div>
                        <div className="text-xs font-black">2000/m</div>
                     </div>
                  </div>
               </VintageCard>
            </div>
          </section>

        </div>

        {/* Sidebar Informativo */}
        <aside className="space-y-8 sticky top-32 h-fit">
          
          <div className="p-8 rounded-[2rem] bg-zinc-900 border border-white/5 space-y-6">
             <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-primary" />
                <h4 className="text-[11px] font-black uppercase tracking-widest">Estado del Server</h4>
             </div>
             <div className="space-y-4">
                {[
                  { label: 'Latencia', value: '18ms', color: 'text-success' },
                  { label: 'Uptime', value: '99.98%', color: 'text-success' },
                  { label: 'Webhooks Activos', value: '12', color: 'text-primary' },
                  { label: 'Salud DB', value: 'Óptima', color: 'text-success' },
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                    <span className="text-zinc-500">{stat.label}</span>
                    <span className={stat.color}>{stat.value}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/20 space-y-6">
             <h4 className="text-[11px] font-black uppercase tracking-widest text-primary text-center">Estándar JSON</h4>
             <pre className="font-mono text-[9px] text-primary/70 leading-relaxed">
{`{
  "success": true,
  "data": {
    "id": "clt_12345",
    "status": "POSTED"
  },
  "meta": {
    "ts": 1714982400
  }
}`}
             </pre>
          </div>

          <VintageCard className="p-8 bg-warning/5 border-warning/20">
             <div className="flex items-center gap-3 mb-4 text-warning">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase">Advertencia</span>
             </div>
             <p className="text-[10px] text-warning/70 leading-relaxed uppercase font-bold">
                Las pólizas en estado "POSTED" son inmutables. Cualquier error debe corregirse mediante 
                pólizas de ajuste o reversión en el período abierto actual.
             </p>
          </VintageCard>

        </aside>

      </div>

      <footer className="pt-40 text-center opacity-30 group">
         <div className="flex items-center justify-center gap-10 mb-10">
            <Braces className="w-6 h-6" />
            <Binary className="w-6 h-6" />
            <Terminal className="w-6 h-6" />
         </div>
         <p className="text-[9px] font-black uppercase tracking-[1em]">Ingeniería Ganesha • API v1.0 • 2026</p>
      </footer>
    </motion.div>
  );
}
