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

import { useAccounts } from '../hooks/useAccounts';

interface Account {
  id: string; code: string; name: string; accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  nature: 'DEBIT' | 'CREDIT'; isGroup: boolean; isActive: boolean; currentBalance: number;
  children?: Account[]; level: number; parentId?: string;
}


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
  const { accounts, isLoading: loading, createAccount, isCreating } = useAccounts();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1', '2', '3', '4', '5']));
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    accountType: 'ASSET' as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE',
    nature: 'DEBIT' as 'DEBIT' | 'CREDIT',
    isGroup: false,
    parentId: ''
  });

  const toggle = (id: string) => setExpanded(prev => {
    const n = new Set(prev);
    if (n.has(id)) { n.delete(id); } else { n.add(id); }
    return n;
  });

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast.error('Código y nombre son obligatorios');
      return;
    }
    createAccount(formData, {
      onSuccess: () => setShowModal(false)
    });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-vintage-900">Plan de Cuentas</h2>
          <p className="text-sm text-vintage-600 mt-1">Catálogo de cuentas contables</p>
        </div>
        <PastelButton onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-2" />Nueva Cuenta</PastelButton>
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
              {accounts.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-vintage-500">No se encontraron cuentas</td></tr>
              ) : (
                accounts.map(acc => (
                  <AccountRow key={acc.id} account={acc} expanded={expanded} onToggle={toggle} level={0} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </VintageCard>

      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-vintage-200 overflow-hidden" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
              <div className="p-6 border-b border-vintage-100 flex items-center justify-between">
                <h3 className="text-xl font-playfair font-bold text-vintage-800">Nueva Cuenta Contable</h3>
                <button onClick={() => setShowModal(false)} className="text-vintage-400 hover:text-vintage-600">×</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-vintage-600 ml-1">Código</label>
                    <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="Ej: 1101.01" className="w-full px-3 py-2 text-sm bg-vintage-50 border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-vintage-600 ml-1">Nombre</label>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre de la cuenta" className="w-full px-3 py-2 text-sm bg-vintage-50 border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-vintage-600 ml-1">Tipo</label>
                    <select value={formData.accountType} onChange={e => setFormData({ ...formData, accountType: e.target.value as any })} className="w-full px-3 py-2 text-sm bg-vintage-50 border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400">
                      <option value="ASSET">Activo</option>
                      <option value="LIABILITY">Pasivo</option>
                      <option value="EQUITY">Patrimonio</option>
                      <option value="INCOME">Ingresos</option>
                      <option value="EXPENSE">Gastos</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-vintage-600 ml-1">Naturaleza</label>
                    <select value={formData.nature} onChange={e => setFormData({ ...formData, nature: e.target.value as any })} className="w-full px-3 py-2 text-sm bg-vintage-50 border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400">
                      <option value="DEBIT">Deudora</option>
                      <option value="CREDIT">Acreedora</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input type="checkbox" id="isGroup" checked={formData.isGroup} onChange={e => setFormData({ ...formData, isGroup: e.target.checked })} className="w-4 h-4 rounded border-vintage-300 text-vintage-500 focus:ring-vintage-400" />
                  <label htmlFor="isGroup" className="text-sm text-vintage-700">¿Es cuenta de grupo (mayor)?</label>
                </div>
              </div>
              <div className="p-6 bg-vintage-50 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-vintage-600 hover:text-vintage-800">Cancelar</button>
                <PastelButton onClick={handleSave} loading={isCreating}>Guardar Cuenta</PastelButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
