'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, ChevronDown, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { StatusBadge, EmptyState } from '@/components/ui/vintage-ui';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface Account {
  id: string; code: string; name: string; accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  nature: 'DEBIT' | 'CREDIT'; isGroup: boolean; isActive: boolean; currentBalance: number;
  children?: Account[]; level: number; parentId?: string;
}

const mockAccounts: Account[] = [
  { id: '1', code: '1000', name: 'ACTIVO', accountType: 'ASSET', nature: 'DEBIT', isGroup: true, isActive: true, currentBalance: 5420000, level: 0, children: [
    { id: '1.1', code: '1100', name: 'Activo Circulante', accountType: 'ASSET', nature: 'DEBIT', isGroup: true, isActive: true, currentBalance: 2180000, level: 1, parentId: '1', children: [
      { id: '1.1.1', code: '1101', name: 'Caja y Bancos', accountType: 'ASSET', nature: 'DEBIT', isGroup: false, isActive: true, currentBalance: 1250000, level: 2, parentId: '1.1' },
      { id: '1.1.2', code: '1103', name: 'Cuentas por Cobrar', accountType: 'ASSET', nature: 'DEBIT', isGroup: false, isActive: true, currentBalance: 450000, level: 2, parentId: '1.1' },
      { id: '1.1.3', code: '1105', name: 'Inventarios', accountType: 'ASSET', nature: 'DEBIT', isGroup: false, isActive: true, currentBalance: 380000, level: 2, parentId: '1.1' },
      { id: '1.1.4', code: '1106', name: 'IVA Acreditable', accountType: 'ASSET', nature: 'DEBIT', isGroup: false, isActive: true, currentBalance: 100000, level: 2, parentId: '1.1' },
    ]},
    { id: '1.2', code: '1200', name: 'Activo Fijo', accountType: 'ASSET', nature: 'DEBIT', isGroup: true, isActive: true, currentBalance: 3240000, level: 1, parentId: '1', children: [
      { id: '1.2.1', code: '1201', name: 'Edificios', accountType: 'ASSET', nature: 'DEBIT', isGroup: false, isActive: true, currentBalance: 2500000, level: 2, parentId: '1.2' },
      { id: '1.2.2', code: '1202', name: 'Equipo de Transporte', accountType: 'ASSET', nature: 'DEBIT', isGroup: false, isActive: true, currentBalance: 480000, level: 2, parentId: '1.2' },
      { id: '1.2.3', code: '1203', name: 'Mobiliario y Equipo', accountType: 'ASSET', nature: 'DEBIT', isGroup: false, isActive: true, currentBalance: 260000, level: 2, parentId: '1.2' },
    ]},
  ]},
  { id: '2', code: '2000', name: 'PASIVO', accountType: 'LIABILITY', nature: 'CREDIT', isGroup: true, isActive: true, currentBalance: 2100000, level: 0, children: [
    { id: '2.1', code: '2100', name: 'Pasivo Circulante', accountType: 'LIABILITY', nature: 'CREDIT', isGroup: true, isActive: true, currentBalance: 1580000, level: 1, parentId: '2', children: [
      { id: '2.1.1', code: '2101', name: 'Proveedores', accountType: 'LIABILITY', nature: 'CREDIT', isGroup: false, isActive: true, currentBalance: 680000, level: 2, parentId: '2.1' },
      { id: '2.1.2', code: '2102', name: 'Impuestos por Pagar', accountType: 'LIABILITY', nature: 'CREDIT', isGroup: false, isActive: true, currentBalance: 320000, level: 2, parentId: '2.1' },
      { id: '2.1.3', code: '2103', name: 'Acreedores Diversos', accountType: 'LIABILITY', nature: 'CREDIT', isGroup: false, isActive: true, currentBalance: 280000, level: 2, parentId: '2.1' },
      { id: '2.1.4', code: '2105', name: 'IVA Trasladado', accountType: 'LIABILITY', nature: 'CREDIT', isGroup: false, isActive: true, currentBalance: 300000, level: 2, parentId: '2.1' },
    ]},
    { id: '2.2', code: '2200', name: 'Pasivo Largo Plazo', accountType: 'LIABILITY', nature: 'CREDIT', isGroup: true, isActive: true, currentBalance: 520000, level: 1, parentId: '2', children: [
      { id: '2.2.1', code: '2201', name: 'Préstamos Bancarios', accountType: 'LIABILITY', nature: 'CREDIT', isGroup: false, isActive: true, currentBalance: 520000, level: 2, parentId: '2.2' },
    ]},
  ]},
  { id: '3', code: '3000', name: 'CAPITAL', accountType: 'EQUITY', nature: 'CREDIT', isGroup: true, isActive: true, currentBalance: 3320000, level: 0, children: [
    { id: '3.1', code: '3100', name: 'Capital Social', accountType: 'EQUITY', nature: 'CREDIT', isGroup: false, isActive: true, currentBalance: 2500000, level: 1, parentId: '3' },
    { id: '3.2', code: '3200', name: 'Reservas', accountType: 'EQUITY', nature: 'CREDIT', isGroup: false, isActive: true, currentBalance: 500000, level: 1, parentId: '3' },
    { id: '3.3', code: '3300', name: 'Resultado del Ejercicio', accountType: 'EQUITY', nature: 'CREDIT', isGroup: false, isActive: true, currentBalance: 320000, level: 1, parentId: '3' },
  ]},
  { id: '4', code: '4000', name: 'INGRESO', accountType: 'INCOME', nature: 'CREDIT', isGroup: true, isActive: true, currentBalance: 2850000, level: 0, children: [
    { id: '4.1', code: '4100', name: 'Ingresos por Servicios', accountType: 'INCOME', nature: 'CREDIT', isGroup: false, isActive: true, currentBalance: 2200000, level: 1, parentId: '4' },
    { id: '4.2', code: '4200', name: 'Ingresos por Ventas', accountType: 'INCOME', nature: 'CREDIT', isGroup: false, isActive: true, currentBalance: 450000, level: 1, parentId: '4' },
    { id: '4.3', code: '4300', name: 'Ingresos Financieros', accountType: 'INCOME', nature: 'CREDIT', isGroup: false, isActive: true, currentBalance: 200000, level: 1, parentId: '4' },
  ]},
  { id: '5', code: '5000', name: 'GASTO', accountType: 'EXPENSE', nature: 'DEBIT', isGroup: true, isActive: true, currentBalance: 1920000, level: 0, children: [
    { id: '5.1', code: '5100', name: 'Nóminas', accountType: 'EXPENSE', nature: 'DEBIT', isGroup: false, isActive: true, currentBalance: 850000, level: 1, parentId: '5' },
    { id: '5.2', code: '5200', name: 'Servicios Profesionales', accountType: 'EXPENSE', nature: 'DEBIT', isGroup: false, isActive: true, currentBalance: 320000, level: 1, parentId: '5' },
    { id: '5.3', code: '5300', name: 'Arrendamiento', accountType: 'EXPENSE', nature: 'DEBIT', isGroup: false, isActive: true, currentBalance: 240000, level: 1, parentId: '5' },
    { id: '5.4', code: '5400', name: 'Depreciación', accountType: 'EXPENSE', nature: 'DEBIT', isGroup: false, isActive: true, currentBalance: 180000, level: 1, parentId: '5' },
    { id: '5.5', code: '5500', name: 'Impuestos', accountType: 'EXPENSE', nature: 'DEBIT', isGroup: false, isActive: true, currentBalance: 150000, level: 1, parentId: '5' },
    { id: '5.6', code: '5600', name: 'Gastos Administrativos', accountType: 'EXPENSE', nature: 'DEBIT', isGroup: false, isActive: true, currentBalance: 180000, level: 1, parentId: '5' },
  ]},
];

const typeColors: Record<string, string> = { ASSET: 'bg-info/15 text-info', LIABILITY: 'bg-warning/15 text-warning', EQUITY: 'bg-lavender/50 text-vintage-800', INCOME: 'bg-success/15 text-success', EXPENSE: 'bg-error/15 text-error' };
const typeLabels: Record<string, string> = { ASSET: 'Activo', LIABILITY: 'Pasivo', EQUITY: 'Patrimonio', INCOME: 'Ingreso', EXPENSE: 'Gasto' };

function AccountRow({ account, expanded, onToggle, level }: { account: Account; expanded: Set<string>; onToggle: (id: string) => void; level: number }) {
  const hasChildren = account.children && account.children.length > 0;
  const isExpanded = expanded.has(account.id);

  return (
    <>
      <motion.tr className={cn('hover:bg-vintage-50 transition-colors', account.isGroup && 'font-medium bg-vintage-50/30')} layout>
        <td className="px-4 py-2.5" style={{ paddingLeft: `${12 + level * 24}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button onClick={() => onToggle(account.id)} className="p-0.5 rounded hover:bg-vintage-200 transition-colors">
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-vintage-500" /> : <ChevronRight className="w-3.5 h-3.5 text-vintage-500" />}
              </button>
            ) : <span className="w-4" />}
            <span className={cn('font-mono text-xs', account.isGroup ? 'font-bold text-vintage-800' : 'text-vintage-600')}>{account.code}</span>
          </div>
        </td>
        <td className="px-4 py-2.5 text-sm text-vintage-700">{account.name}</td>
        <td className="px-4 py-2.5 text-center"><span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', typeColors[account.accountType])}>{typeLabels[account.accountType]}</span></td>
        <td className="px-4 py-2.5 text-sm text-vintage-700 text-right font-mono">{formatCurrency(account.currentBalance)}</td>
        <td className="px-4 py-2.5 text-center"><StatusBadge status={account.isActive ? 'success' : 'neutral'} label={account.isActive ? 'Activa' : 'Inactiva'} /></td>
      </motion.tr>
      {hasChildren && isExpanded && account.children!.map(child => (
        <AccountRow key={child.id} account={child} expanded={expanded} onToggle={onToggle} level={level + 1} />
      ))}
    </>
  );
}

export function AccountsView() {
  const [accounts] = useState<Account[]>(mockAccounts);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1', '2', '3', '4', '5']));
  const [loading, setLoading] = useState(true);

  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);

  const toggle = (id: string) => setExpanded(prev => {
    const n = new Set(prev);
    if (n.has(id)) { n.delete(id); } else { n.add(id); }
    return n;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-vintage-900">Plan de Cuentas</h2>
          <p className="text-sm text-vintage-600 mt-1">Catálogo de cuentas contables</p>
        </div>
        <PastelButton><Plus className="w-4 h-4 mr-2" />Nueva Cuenta</PastelButton>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vintage-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código o nombre..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400" />
      </div>

      <VintageCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-vintage-200 bg-vintage-50/50">
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left w-1/4">Código</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Nombre</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-right">Saldo</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vintage-100">
              {accounts.map(acc => (
                <AccountRow key={acc.id} account={acc} expanded={expanded} onToggle={toggle} level={0} />
              ))}
            </tbody>
          </table>
        </div>
      </VintageCard>
    </div>
  );
}
