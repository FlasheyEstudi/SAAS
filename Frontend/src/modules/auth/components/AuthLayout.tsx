'use client';

import { motion } from 'framer-motion';
import { Sparkles, Bot, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px]"
        />
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent/20 blur-[120px]"
        />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 z-0 pointer-events-none hidden lg:block">
        <motion.div 
          animate={{ y: [0, -20, 0] }} 
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 p-4 rounded-2xl bg-card border border-border shadow-xl"
        >
          <Bot className="w-6 h-6 text-primary" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 20, 0] }} 
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 p-4 rounded-2xl bg-card border border-border shadow-xl"
        >
          <Shield className="w-6 h-6 text-success" />
        </motion.div>
        <motion.div 
          animate={{ x: [0, 15, 0] }} 
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/3 right-1/3 p-4 rounded-2xl bg-card border border-border shadow-xl"
        >
          <Zap className="w-6 h-6 text-warning" />
        </motion.div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {children}
        
        {/* Trusted By */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Confianza por empresas en Nicaragua</p>
          <div className="flex items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            <span className="text-sm font-black italic">BANPRO</span>
            <span className="text-sm font-black italic">BAC</span>
            <span className="text-sm font-black italic">LAFISE</span>
            <span className="text-sm font-black italic">FICOHSA</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
