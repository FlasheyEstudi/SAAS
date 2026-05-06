'use client';

import { motion } from 'framer-motion';
import { 
  BookMarked, ArrowLeft, ChevronRight, Hash, Code, Terminal, Layers, 
  ShieldCheck, Zap, Globe, Cpu, Database, Server, Key, Lock,
  FileCode, Workflow, Braces, Binary, Activity, Sparkles,
  Search, Code2, AlertTriangle, Fingerprint, Network, GitBranch,
  Shield, Cog
} from 'lucide-react';
import { useAppStore } from '@/lib/stores/useAppStore';
import { VintageCard } from '@/components/ui/vintage-card';
import { cn } from '@/lib/utils';

export function DocumentationView() {
  const navigate = useAppStore((s) => s.navigate);

  const sidebarItems = [
    { id: 'intro', label: 'Introducción' },
    { id: 'stack', label: 'Stack Tecnológico' },
    { id: 'arch', label: 'Arquitectura Núcleo' },
    { id: 'db', label: 'Modelo de Datos' },
    { id: 'security', label: 'Seguridad Blindada' },
    { id: 'audit', label: 'Auditoría Forense' },
    { id: 'ai', label: 'Cerebro IA (TAG)' },
    { id: 'infra', label: 'Infraestructura' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background text-foreground pb-40 selection:bg-primary selection:text-black"
    >
      {/* Cabecera Cinemática */}
      <div className="sticky top-0 z-50 w-full backdrop-blur-3xl bg-background/80 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate('landing')}
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all group"
          >
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary/40 transition-colors">
               <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            </div>
            Protocolo de Salida
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(234,88,12,0.1)]">
               <BookMarked className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-tighter leading-none">Documentación de Ingeniería</span>
              <span className="text-[9px] text-primary font-bold uppercase tracking-[0.3em]">Versión Blindada v2.5</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[9px] font-black uppercase text-zinc-400">Núcleo Activo</span>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-24 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-20">
        
        {/* Sidebar de Navegación Avanzada */}
        <aside className="hidden lg:block sticky top-36 h-fit space-y-12">
          <div className="space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary px-4">Directorio</h4>
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <a 
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-tight text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all group border border-transparent hover:border-primary/10"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-primary transition-colors" />
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <VintageCard className="p-8 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
             <div className="flex items-center gap-3 mb-6">
                <Cpu className="w-5 h-5 text-primary" />
                <span className="text-[11px] font-black uppercase tracking-widest">Estado del Kernel</span>
             </div>
             <div className="space-y-4">
                {[
                  { l: 'Latencia Núcleo', v: '8ms', c: 'text-success' },
                  { l: 'Optimización DB', v: '98%', c: 'text-primary' },
                  { l: 'Seguridad Hilos', v: 'Activo', c: 'text-success' }
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-center text-[9px] uppercase font-black">
                     <span className="text-muted-foreground">{stat.l}</span>
                     <span className={stat.c}>{stat.v}</span>
                  </div>
                ))}
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: '92%' }}
                     className="h-full bg-primary" 
                   />
                </div>
             </div>
          </VintageCard>
        </aside>

        {/* Contenido Técnico */}
        <article className="space-y-48">
          
          {/* INTRO: Visión de Ingeniería */}
          <section id="intro" className="space-y-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-zinc-950 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-10 shadow-2xl">
                <Shield className="w-4 h-4" /> Estándar Empresarial Blindado
              </div>
              <h1 className="text-7xl lg:text-9xl font-black tracking-tighter leading-[0.8] uppercase">
                Arquitectura <br/><span className="text-primary italic">Soberana.</span>
              </h1>
              <p className="text-2xl text-muted-foreground leading-relaxed max-w-3xl mt-12 font-medium">
                Ganesha ERP ha sido diseñado bajo los principios de inmutabilidad, trazabilidad forense 
                y aislamiento de multi-tenencia absoluto, garantizando que la información financiera 
                sea el activo más seguro de la organización.
              </p>
            </motion.div>
          </section>

          {/* PHILOSOPHY: The Remover of Obstacles */}
          <section className="py-20 border-y border-white/5 relative overflow-hidden">
             <div className="absolute inset-0 bg-primary/5 blur-[120px] opacity-20" />
             <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-8">
                   <h2 className="text-4xl font-black uppercase tracking-tighter">Filosofía de <span className="text-primary">Ganesha.</span></h2>
                   <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                      En el desarrollo de este ecosistema, adoptamos la figura de Ganesha no solo como identidad visual, 
                      sino como un **estándar de ingeniería**. 
                   </p>
                   <div className="space-y-4">
                      <div className="flex gap-4">
                         <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                            <Zap className="w-5 h-5" />
                         </div>
                         <div>
                            <div className="text-[11px] font-black uppercase tracking-widest text-white">Remoción de Fricción</div>
                            <p className="text-xs text-zinc-500 mt-1">El backend debe eliminar cualquier obstáculo técnico entre el usuario y su rentabilidad.</p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                            <Binary className="w-5 h-5" />
                         </div>
                         <div>
                            <div className="text-[11px] font-black uppercase tracking-widest text-white">Sabiduría Determinística</div>
                            <p className="text-xs text-zinc-500 mt-1">Cada algoritmo es un camino trazado con precisión matemática, sin espacio para el error.</p>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="p-10 rounded-[3rem] bg-zinc-950 border border-primary/20 shadow-2xl relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                      <img src="/logo_backend.png" className="w-24 h-24 drop-shadow-[0_0_30px_rgba(234,88,12,0.2)]" onError={(e) => e.currentTarget.src = "/logo_ganesha.png"} />
                      <div className="space-y-2">
                         <h4 className="text-xl font-black uppercase tracking-tighter">Backend Sovereign Core</h4>
                         <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">El Corazón que nunca se detiene</p>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* STACK: El Núcleo Moderno */}
          <section id="stack" className="space-y-16">
            <div className="flex items-center gap-6">
              <h2 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4 shrink-0">
                <Code2 className="text-primary w-8 h-8" /> Stack Tecnológico
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
            </div>
            
            <div className="grid sm:grid-cols-2 gap-8">
              {[
                { title: 'Next.js 15.1 + React 19', desc: 'Renderizado híbrido con Server Actions para una comunicación segura y ultra-rápida entre cliente y servidor.', icon: <Zap />, color: 'text-yellow-500' },
                { title: 'TypeScript 5.7 Estricto', desc: 'Validación estática de tipos en el 100% de la base de código, eliminando errores en tiempo de ejecución.', icon: <Fingerprint />, color: 'text-blue-500' },
                { title: 'Prisma 6 + SQLite', desc: 'Persistencia ACID optimizada para despliegues rápidos y soberanos, escalable a PostgreSQL en un solo comando.', icon: <Database />, color: 'text-emerald-500' },
                { title: 'Tailwind 4 + Framer', desc: 'Motor visual de alto rendimiento que garantiza una experiencia de usuario fluida y cinemática.', icon: <Sparkles />, color: 'text-cyan-500' },
              ].map((item, i) => (
                <VintageCard key={i} className="p-10 space-y-6 hover:border-primary/40 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                     {item.icon}
                  </div>
                  <div className={cn("w-14 h-14 rounded-2xl bg-card border border-primary/10 flex items-center justify-center transition-transform group-hover:scale-110", item.color)}>
                    {item.icon}
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight">{item.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                </VintageCard>
              ))}
            </div>
          </section>

          {/* CORE: Integridad Estructural */}
          <section id="arch" className="space-y-16">
            <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Integridad <br/><span className="text-primary italic">Estructural.</span></h2>
            
            <div className="grid lg:grid-cols-2 gap-16">
               <div className="space-y-8">
                  <div className="p-10 rounded-[3rem] bg-zinc-950 border border-white/5 space-y-6">
                     <h4 className="text-sm font-black uppercase text-primary flex items-center gap-3">
                        <Network className="w-5 h-5" /> Topología de Datos
                     </h4>
                     <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                        Cada petición HTTP pasa por un túnel de validación de tres capas antes de interactuar 
                        con la base de datos persistente.
                     </p>
                     <div className="space-y-4 pt-4">
                        {[
                          { l: 'Capa 01: Auth HMAC', d: 'Validación de firma y marca de tiempo.' },
                          { l: 'Capa 02: Esquema Zod', d: 'Validación de estructura de datos.' },
                          { l: 'Capa 03: Aislamiento de Tenant', d: 'Inyección forzada de companyId.' }
                        ].map((layer, i) => (
                          <div key={i} className="flex gap-4 items-start">
                             <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-black text-primary">
                                {i+1}
                             </div>
                             <div>
                                <div className="text-[10px] font-black uppercase text-white">{layer.l}</div>
                                <div className="text-[9px] text-zinc-500 font-bold uppercase mt-1">{layer.d}</div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
               
               <div className="space-y-12">
                  <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                     Nuestra arquitectura permite que el sistema se comporte como una aplicación nativa, 
                     minimizando el uso de memoria en el servidor mediante el procesamiento reactivo de eventos financieros.
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                        <div className="text-2xl font-black text-primary">0%</div>
                        <div className="text-[9px] font-black uppercase text-zinc-500">Riesgo de Fuga de Datos</div>
                     </div>
                     <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                        <div className="text-2xl font-black text-primary">100%</div>
                        <div className="text-[9px] font-black uppercase text-zinc-500">Cumplimiento ACID</div>
                     </div>
                  </div>
               </div>
            </div>
          </section>

          {/* MODELO DE DATOS: El Grafo Financiero */}
          <section id="db" className="space-y-16">
            <h2 className="text-4xl font-black uppercase tracking-tight flex items-center gap-4">
              <GitBranch className="text-primary w-8 h-8" /> El Grafo Financiero
            </h2>
            <div className="bg-zinc-950 border border-primary/20 rounded-[4rem] p-16 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.05)_0%,transparent_60%)]" />
               <div className="grid lg:grid-cols-[1fr_400px] gap-20 relative z-10">
                  <div className="space-y-10">
                     <div className="space-y-4">
                        <h4 className="text-lg font-black uppercase text-white">Relacionalismo Estricto</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                           El núcleo de Ganesha utiliza un esquema de 22 modelos relacionales optimizados 
                           donde la multi-tenencia no es un parche, sino la base del diseño.
                        </p>
                     </div>
                     <div className="grid sm:grid-cols-2 gap-4 font-mono text-[10px]">
                        {[
                          { m: 'Company', f: 'Raíz del Tenant' },
                          { m: 'JournalEntry', f: 'Átomo Financiero' },
                          { m: 'Invoice', f: 'Lógica de Crédito' },
                          { m: 'AuditLog', f: 'Traza de Seguridad' }
                        ].map((node, i) => (
                          <div key={i} className="p-4 rounded-xl bg-black/50 border border-white/10 flex justify-between items-center group cursor-crosshair hover:border-primary/50 transition-all">
                             <span className="text-primary font-black">model {node.m}</span>
                             <span className="text-zinc-600 uppercase">{node.f}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                     <h4 className="text-[10px] font-black uppercase text-primary mb-6 tracking-widest">Esquema de Validación Zod</h4>
                     <pre className="font-mono text-[9px] text-zinc-500 leading-relaxed">
{`export const invoiceSchema = z.object({
  id: z.string().cuid(),
  type: z.enum(['SALE', 'PURCHASE']),
  total: z.number().positive(),
  companyId: z.string().cuid(),
  lines: z.array(lineSchema).min(1),
  posted: z.boolean().default(false)
});`}
                     </pre>
                  </div>
               </div>
            </div>
          </section>

          {/* IA: El Motor TAG */}
          <section id="ai" className="space-y-16">
            <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">El Cerebro <br/><span className="text-primary italic">Cognitivo.</span></h2>
            <div className="p-16 rounded-[4rem] bg-card border border-primary/10 space-y-12 relative group">
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <div className="flex flex-col lg:flex-row gap-16 items-center relative z-10">
                  <div className="w-48 h-48 rounded-[3rem] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-[0_0_50px_rgba(234,88,12,0.1)]">
                     <Binary className="w-24 h-24 text-primary" />
                  </div>
                  <div className="space-y-6">
                     <h3 className="text-3xl font-black uppercase tracking-tight">TAG: Generación Aumentada por Herramientas</h3>
                     <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                        A diferencia del RAG tradicional que puede alucinar datos, el motor TAG de Ganesha 
                        ejecuta funciones financieras determinísticas en el servidor y entrega resultados 
                        matemáticamente exactos al modelo Llama 3.2.
                     </p>
                     <div className="flex flex-wrap gap-3">
                        {['Contexto Aislado', 'Lógica Deductiva', 'Cero Fugas', 'Baja Latencia'].map(tag => (
                          <div key={tag} className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black uppercase text-primary">
                             {tag}
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </section>

          {/* SEGURIDAD: Defensa Blindada */}
          <section id="security" className="space-y-16">
            <h2 className="text-4xl font-black tracking-tight uppercase flex items-center gap-4">
              <ShieldCheck className="text-primary w-8 h-8" /> Defensa Profunda
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
               {[
                 { t: 'Cifrado en Reposo', d: 'AES-256-GCM para todos los datos sensibles almacenados en disco.', i: <Lock /> },
                 { t: 'Tránsito TLS 1.3', d: 'Protocolo de transporte forzado con HSTS y terminación SSL automatizada.', i: <Globe /> },
                 { t: 'Blindaje de Sesión', d: 'Tokens JWT con rotación obligatoria y validación de huella digital del dispositivo.', i: <Key /> }
               ].map((item, i) => (
                 <div key={i} className="space-y-6 p-8 rounded-3xl border border-white/5 bg-zinc-900/50 hover:border-primary/30 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                       {item.i}
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-white">{item.t}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{item.d}</p>
                 </div>
               ))}
            </div>
          </section>

          {/* INFRAESTRUCTURA: DevOps Soberano */}
          <section id="infra" className="space-y-16 pb-20">
            <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-4">
              <Cog className="text-primary w-8 h-8" /> Infraestructura & DevOps
            </h2>
            <div className="grid lg:grid-cols-2 gap-12">
               <VintageCard className="p-12 space-y-8 bg-zinc-950 border-primary/10">
                  <div className="flex items-center gap-4">
                     <div className="w-2 h-2 rounded-full bg-primary" />
                     <h4 className="text-sm font-black uppercase text-white">Proxy Inverso Soberano</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Implementamos Caddy como orquestador de tráfico por su manejo automático de certificados 
                    SSL y su bajo consumo de recursos comparado con Nginx o Apache.
                  </p>
                  <pre className="p-6 rounded-2xl bg-black border border-white/5 font-mono text-[9px] text-primary/70">
{`ganesha.local {
  reverse_proxy localhost:3000
  tls internal
  header {
    Strict-Transport-Security max-age=31536000
  }
}`}
                  </pre>
               </VintageCard>
               <div className="flex flex-col justify-center space-y-10">
                  <div className="space-y-4">
                     <h4 className="text-lg font-black uppercase">Despliegue Independiente</h4>
                     <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                        El sistema puede ser empaquetado como una unidad aislada capaz de correr en servidores 
                        con recursos limitados (Raspberry Pi 4+, Mini PCs) sin perder rendimiento contable.
                     </p>
                  </div>
                  <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/20 text-center space-y-4">
                     <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Soberanía Total</h5>
                     <p className="text-xs text-muted-foreground font-bold italic">"No dependemos de la nube, nosotros somos la nube."</p>
                  </div>
               </div>
            </div>
          </section>

          {/* Pie de Página Final */}
          <footer className="pt-40 border-t border-white/5 text-center space-y-12">
             <div className="flex justify-center gap-10">
                <GithubIcon className="w-6 h-6 text-zinc-800 hover:text-white transition-colors cursor-pointer" />
                <Globe className="w-6 h-6 text-zinc-800 hover:text-white transition-colors cursor-pointer" />
                <Workflow className="w-6 h-6 text-zinc-800 hover:text-white transition-colors cursor-pointer" />
             </div>
             <div className="space-y-2">
                <div className="text-2xl font-black uppercase tracking-tighter">GANESHA<span className="text-primary">.</span> INGENIERÍA</div>
                <p className="text-[8px] font-black uppercase tracking-[1.5em] text-zinc-700">El Poder de la Elección • Soberanía • Control</p>
             </div>
          </footer>

        </article>

      </div>
    </motion.div>
  );
}

// Missing icons for Documentation
const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);
