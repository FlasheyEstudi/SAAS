'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Landmark,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  X,
  Save,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useBanks } from '../hooks/useBanks';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { AnimatedTable, Pagination, FilterBar } from '@/components/tables/animated-table';
import { AnimatedCounter } from '@/components/ui/vintage-ui';
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const accountColors: Record<string, { bg: string; icon: string }> = {
  CHECKING: { bg: 'bg-lavender/30', icon: 'text-vintage-700' },
  SAVINGS: { bg: 'bg-success/15', icon: 'text-success' },
  CREDIT: { bg: 'bg-error/15', icon: 'text-error' },
};

const typeFilterOptions = [
  { value: 'DEPOSIT', label: 'Depósito' },
  { value: 'WITHDRAWAL', label: 'Retiro' },
  { value: 'TRANSFER', label: 'Transferencia' },
];

function getMovementIcon(type: string) {
  switch (type) {
    case 'DEPOSIT': return <ArrowDownCircle className="w-5 h-5 text-success" />;
    case 'WITHDRAWAL': return <ArrowUpCircle className="w-5 h-5 text-error" />;
    case 'TRANSFER': return <ArrowLeftRight className="w-5 h-5 text-vintage-500" />;
    default: return null;
  }
}

export function BanksView() {
  const {
    bankAccounts: accounts = [], movements = [], isLoading, total = 0, totalPages = 1, page = 1, limit = 20,
    search = '', accountFilter = '', typeFilter = '',
    setSearch, setAccountFilter, setTypeFilter, setPage, clearFilters,
    createMovement, reconcileMovement,
    totalBalance = 0, totalDeposits = 0, totalWithdrawals = 0,
  } = useBanks() as any;

  const [showForm, setShowForm] = useState(false);
  const [formAccountId, setFormAccountId] = useState(accounts?.[0]?.id || '');
  const [formType, setFormType] = useState<'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'>('DEPOSIT');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formReference, setFormReference] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!formAccountId) { toast.error('Selecciona una cuenta'); return; }
    if (!formDescription.trim()) { toast.error('Ingresa la descripción'); return; }
    if (!formAmount || Number(formAmount) <= 0) { toast.error('Ingresa un monto válido'); return; }
    if (!formDate) { toast.error('Ingresa la fecha'); return; }

    setSaving(true);
    try {
      const mv = await createMovement({
        bankAccountId: formAccountId,
        description: formDescription,
        amount: Number(formAmount),
        movementType: formType,
        reference: formReference || undefined,
        movementDate: formDate,
      });
      if (mv) {
        toast.success('Movimiento registrado correctamente');
        setShowForm(false);
        resetForm();
      } else {
        toast.error('No se pudo registrar el movimiento');
      }
    } catch {
      toast.error('Error al registrar el movimiento');
    } finally {
      setSaving(false);
    }
  }, [formAccountId, formType, formDescription, formAmount, formDate, formReference, createMovement]);

  const resetForm = () => {
    setFormAccountId(accounts?.[0]?.id || '');
    setFormType('DEPOSIT');
    setFormDescription('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormReference('');
  };

  const handleReconcile = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await reconcileMovement(id);
    if (ok) toast.success('Movimiento conciliado');
    else toast.error('No se pudo conciliar');
  }, [reconcileMovement]);

  const accountFilterOptions = (accounts || []).map((a: any) => ({
    value: a.id,
    label: `${a.bankName} (${a.accountNumber.slice(-4)})`,
  }));

  const tableHeaders = [
    { key: 'date', label: 'Fecha', align: 'left' as const, className: 'w-[110px]' },
    { key: 'account', label: 'Cuenta', align: 'left' as const, className: 'w-[140px]' },
    { key: 'type', label: 'Tipo', align: 'center' as const, className: 'w-[110px]' },
    { key: 'description', label: 'Descripción', align: 'left' as const },
    { key: 'reference', label: 'Referencia', align: 'left' as const, className: 'w-[130px]' },
    { key: 'amount', label: 'Monto', align: 'right' as const, className: 'w-[130px]' },
    { key: 'status', label: 'Estado', align: 'center' as const, className: 'w-[100px]' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Page header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lavender/30 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-vintage-700" />
          </div>
          <div>
            <h1 className="text-2xl font-playfair text-vintage-800">Bancos</h1>
            <p className="text-sm text-vintage-500">Gestión de cuentas bancarias y movimientos</p>
          </div>
        </div>
        <PastelButton onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Movimiento
        </PastelButton>
      </motion.div>

      {/* Account cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(accounts || []).map((acc: any) => {
          const colors = accountColors[acc.accountType] || accountColors.CHECKING;
          const depositTotal = movements
            .filter((m) => m.bankAccountId === acc.id && m.movementType === 'DEPOSIT')
            .reduce((s, m) => s + m.amount, 0);
          const withdrawalTotal = movements
            .filter((m) => m.bankAccountId === acc.id && m.movementType === 'WITHDRAWAL')
            .reduce((s, m) => s + Math.abs(m.amount), 0);
          return (
            <VintageCard key={acc.id} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.bg)}>
                  <Landmark className={cn('w-4 h-4', colors.icon)} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-vintage-800">{acc.bankName}</p>
                  <p className="text-xs text-vintage-500">{acc.accountNumber}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-vintage-500">{getStatusLabel(acc.accountType)}</span>
                <span className={cn(
                  'text-lg font-playfair font-bold',
                  acc.currentBalance >= 0 ? 'text-vintage-800' : 'text-error',
                )}>
                  {formatCurrency(acc.currentBalance, 'MXN')}
                </span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-success">
                  +{formatCurrency(depositTotal, 'MXN')}
                </span>
                <span className="text-error">
                  -{formatCurrency(withdrawalTotal, 'MXN')}
                </span>
              </div>
            </VintageCard>
          );
        })}
      </motion.div>

      {/* Balance summary */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VintageCard hover={false} className="p-4">
          <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Saldo Total Consolidado</p>
          <p className={cn('text-xl font-playfair font-bold mt-1', totalBalance >= 0 ? 'text-vintage-800' : 'text-error')}>
            {formatCurrency(totalBalance, 'MXN')}
          </p>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownCircle className="w-4 h-4 text-success" />
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Depósitos</p>
          </div>
          <p className="text-xl font-playfair text-success mt-1">{formatCurrency(totalDeposits, 'MXN')}</p>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpCircle className="w-4 h-4 text-error" />
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Retiros</p>
          </div>
          <p className="text-xl font-playfair text-error mt-1">{formatCurrency(totalWithdrawals, 'MXN')}</p>
        </VintageCard>
      </motion.div>

      {/* Filter bar */}
      <motion.div variants={itemVariants}>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por descripción o referencia..."
          filters={[
            { key: 'account', label: 'Cuenta bancaria', options: accountFilterOptions },
            { key: 'type', label: 'Tipo de movimiento', options: typeFilterOptions },
          ]}
          activeFilters={{ account: accountFilter, type: typeFilter }}
          onFilterChange={(key, value) => {
            if (key === 'account') setAccountFilter(value);
            if (key === 'type') setTypeFilter(value);
          }}
          onClearFilters={clearFilters}
        />
      </motion.div>

      {/* Movements table */}
      <motion.div variants={itemVariants}>
        <AnimatedTable
          headers={tableHeaders}
          data={movements}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyMessage="No se encontraron movimientos"
          emptyIcon={<Landmark />}
          renderRow={(row) => {
            const acc = (accounts || []).find((a: any) => a.id === row.bankAccountId);
            return (
              <>
                <td className="px-4 py-3 text-sm text-vintage-600">{formatDate(row.movementDate)}</td>
                <td className="px-4 py-3">
                  <p className="text-sm text-vintage-700">{acc?.bankName || '—'}</p>
                  <p className="text-xs text-vintage-500">{acc?.accountNumber.slice(-4) || ''}</p>
                </td>
                <td className="px-4 py-3 text-center">{getMovementIcon(row.movementType)}</td>
                <td className="px-4 py-3">
                  <span className="text-sm text-vintage-700 line-clamp-1">{row.description}</span>
                </td>
                <td className="px-4 py-3 text-sm text-vintage-500 font-mono">{row.reference || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <span className={cn(
                    'text-sm font-mono font-semibold',
                    row.amount >= 0 ? 'text-success' : 'text-error',
                  )}>
                    {row.amount >= 0 ? '+' : ''}{formatCurrency(row.amount, 'MXN')}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {row.reconciled ? (
                    <button
                      onClick={(e) => handleReconcile(row.id, e)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success"
                      title="Conciliado"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Conciliado
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleReconcile(row.id, e)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-vintage-100 text-vintage-600 hover:bg-vintage-200 transition-colors"
                      title="Marcar como conciliado"
                    >
                      <Circle className="w-3 h-3" />
                      Pendiente
                    </button>
                  )}
                </td>
              </>
            );
          }}
        />
      </motion.div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <motion.div variants={itemVariants}>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} limit={limit} />
        </motion.div>
      )}

      {/* New movement modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <motion.div
              className="relative bg-card rounded-2xl p-6 max-w-lg w-full mx-4 shadow-xl border border-vintage-200 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-playfair text-vintage-800">Nuevo Movimiento</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-vintage-600 mb-1.5">Cuenta Bancaria</label>
                  <select
                    value={formAccountId}
                    onChange={(e) => setFormAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400"
                  >
                    {(accounts || []).map((a: any) => (
                      <option key={a.id} value={a.id}>{a.bankName} ({a.accountNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-vintage-600 mb-1.5">Tipo de Movimiento</label>
                  <div className="flex gap-2">
                    {([
                      { value: 'DEPOSIT', label: 'Depósito', color: 'border-success text-success bg-success/5' },
                      { value: 'WITHDRAWAL', label: 'Retiro', color: 'border-error text-error bg-error/5' },
                      { value: 'TRANSFER', label: 'Transferencia', color: 'border-vintage-400 text-vintage-700 bg-vintage-50' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFormType(opt.value)}
                        className={cn(
                          'flex-1 px-3 py-2 text-sm rounded-xl border-2 transition-all',
                          formType === opt.value ? opt.color : 'border-vintage-200 text-vintage-500',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-vintage-600 mb-1.5">Descripción</label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descripción del movimiento..."
                    className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-vintage-600 mb-1.5">Monto (MXN)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-vintage-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-vintage-600 mb-1.5">Fecha</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-vintage-600 mb-1.5">Referencia (opcional)</label>
                  <input
                    type="text"
                    value={formReference}
                    onChange={(e) => setFormReference(e.target.value)}
                    placeholder="Número de referencia..."
                    className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <PastelButton variant="outline" onClick={() => setShowForm(false)}>Cancelar</PastelButton>
                <PastelButton onClick={handleCreate} loading={saving} className="gap-2">
                  <Save className="w-4 h-4" />
                  Registrar Movimiento
                </PastelButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
