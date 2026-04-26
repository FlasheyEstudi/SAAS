'use client';

import { useAppStore } from '@/lib/stores/useAppStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, X, Sparkles, Monitor, Layout, Type, Plus, Moon, Shield } from 'lucide-react';
import { useState } from 'react';

const PRESET_COLORS = [
  '#FFB6C1', // Vintage Pink
  '#A8B5A2', // Olive Green
  '#87CEEB', // Sky Blue
  '#C4B5FD', // Lavender
  '#FB923C', // Orange
  '#4ADE80', // Emerald
  '#6366F1', // Indigo
  '#F472B6', // Pink
  '#2DD4BF', // Teal
  '#FCD34D', // Amber
];

const THEMES = [
  { id: 'vintage', label: 'Vintage', icon: <Sparkles className="w-4 h-4" />, desc: 'Warm and nostalgic' },
  { id: 'modern', label: 'Modern', icon: <Monitor className="w-4 h-4" />, desc: 'Clean and cool' },
  { id: 'minimal', label: 'Minimal', icon: <Layout className="w-4 h-4" />, desc: 'High contrast' },
  { id: 'glass', label: 'Glass', icon: <Type className="w-4 h-4" />, desc: 'Translucent and airy' },
  { id: 'onyx', label: 'Onyx', icon: <Moon className="w-4 h-4" />, desc: 'Pure black & violet' },
  { id: 'midnight', label: 'Midnight', icon: <Shield className="w-4 h-4" />, desc: 'Professional navy' },
];

export function ThemePicker({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { accentColor, setAccentColor, theme, setTheme } = useAppStore();
  const [customColor, setCustomColor] = useState(accentColor);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm bg-card border border-vintage-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 pointer-events-auto mx-4"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-playfair font-bold text-foreground">Personalización</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-vintage-50 dark:hover:bg-zinc-800 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Color section */}
            <section>
              <label className="text-[10px] font-bold text-vintage-400 dark:text-zinc-500 uppercase tracking-widest mb-3 block">Color de Acento</label>
              <div className="grid grid-cols-5 gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => { setAccentColor(color); setCustomColor(color); }}
                    className={cn(
                      "w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center shadow-inner",
                      accentColor === color && "ring-2 ring-offset-2 ring-primary dark:ring-offset-zinc-900"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {accentColor === color && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </button>
                ))}
                <div className="relative w-8 h-8 rounded-full border border-dashed border-vintage-300 dark:border-zinc-700 overflow-hidden flex items-center justify-center hover:bg-vintage-50 transition-colors">
                  <input 
                    type="color" 
                    value={customColor} 
                    onChange={(e) => { setCustomColor(e.target.value); setAccentColor(e.target.value); }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {!PRESET_COLORS.includes(customColor) && <div className="w-full h-full" style={{ backgroundColor: customColor }} />}
                  {PRESET_COLORS.includes(customColor) && <Plus className="w-4 h-4 text-vintage-300" />}
                </div>
              </div>
            </section>

            {/* Theme section */}
            <section>
              <label className="text-[10px] font-bold text-vintage-400 dark:text-zinc-500 uppercase tracking-widest mb-3 block">Estilo Visual</label>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={cn(
                      "flex flex-col gap-2 p-3 rounded-2xl border text-left transition-all",
                      theme === t.id 
                        ? "bg-primary/5 border-primary shadow-sm" 
                        : "bg-vintage-50/50 dark:bg-zinc-800/30 border-vintage-100 dark:border-zinc-800 hover:border-vintage-300 dark:hover:border-zinc-600"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      theme === t.id ? "bg-primary text-white" : "bg-vintage-100 dark:bg-zinc-800 text-vintage-500"
                    )}>
                      {t.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{t.label}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-8">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-foreground text-background font-bold text-sm shadow-lg hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              Aplicar Cambios
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
