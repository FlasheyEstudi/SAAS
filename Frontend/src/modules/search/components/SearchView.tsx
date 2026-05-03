'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Receipt, Users, BookOpen } from 'lucide-react';
import { useAppStore } from '@/lib/stores/useAppStore';
import { VintageCard } from '@/components/ui/vintage-card';
import { formatCurrency, formatDate } from '@/lib/utils/format';

import { useSearch } from '../hooks/useSearch';

const getIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'póliza': case 'journal': return <FileText className="w-4 h-4 text-vintage-400" />;
    case 'factura': case 'invoice': return <Receipt className="w-4 h-4 text-vintage-400" />;
    case 'tercero': case 'third-party': return <Users className="w-4 h-4 text-vintage-400" />;
    case 'cuenta': case 'account': return <BookOpen className="w-4 h-4 text-vintage-400" />;
    default: return <FileText className="w-4 h-4 text-vintage-400" />;
  }
};

export function SearchView() {
  const { globalSearch, setGlobalSearch, navigate } = useAppStore();
  const [query, setQuery] = useState(globalSearch);
  const { results, isLoading } = useSearch(query);

  const handleSearchChange = (val: string) => {
    setQuery(val);
    setGlobalSearch(val);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Búsqueda Global</h2><p className="text-sm text-vintage-600 mt-1">Busca pólizas, facturas, terceros y cuentas</p></div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-vintage-400" />
        <input
          value={query} 
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Escribe para buscar en todo el sistema..."
          className="w-full pl-12 pr-4 py-4 text-lg bg-card border border-vintage-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-vintage-400 shadow-sm"
          autoFocus
        />
      </div>

      {query.length < 2 && (
        <VintageCard>
          <p className="text-sm text-vintage-500 text-center py-8">Escribe al menos 2 caracteres para buscar</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
            {['Pólizas', 'Facturas', 'Terceros', 'Cuentas'].map(s => (
              <button key={s} onClick={() => setQuery(s.toLowerCase())} className="px-3 py-2 text-xs rounded-lg bg-vintage-100 text-vintage-600 hover:bg-vintage-200 transition-colors">{s}</button>
            ))}
          </div>
        </VintageCard>
      )}

      {query.length >= 2 && results.length === 0 && (
        <VintageCard><p className="text-sm text-vintage-500 text-center py-8">No se encontraron resultados para &quot;{query}&quot;</p></VintageCard>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {isLoading && <p className="text-xs text-vintage-500 py-2 text-center">Buscando...</p>}
          {!isLoading && <p className="text-xs text-vintage-500">{results.length} resultado(s)</p>}
          {!isLoading && results.map((r: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(r.view as any, r.params)}
              className="flex items-center gap-4 p-4 bg-card rounded-xl border border-vintage-200 hover:border-vintage-300 hover:shadow-sm cursor-pointer transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-vintage-100 flex items-center justify-center">{getIcon(r.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-[10px] font-medium text-vintage-400 uppercase">{r.type}</span></div>
                <p className="text-sm font-medium text-vintage-800 truncate">{r.title}</p>
                <p className="text-xs text-vintage-500 truncate">{r.subtitle}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {r.amount !== undefined && <p className="text-sm font-medium text-vintage-700">{formatCurrency(r.amount)}</p>}
                {r.date && <p className="text-[10px] text-vintage-400">{formatDate(r.date)}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
