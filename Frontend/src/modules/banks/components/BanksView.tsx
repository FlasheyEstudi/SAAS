'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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
  Edit2,
  Trash2,
  Settings,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { exportBanksExcel, exportBanksPDF } from '@/lib/utils/export';
import { useBanks } from '../hooks/useBanks';
import { useAppStore } from '@/lib/stores/useAppStore';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { AnimatedTable, Pagination, FilterBar } from '@/components/tables/animated-table';
import { AnimatedCounter, ConfirmDialog } from '@/components/ui/vintage-ui';
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { GaneshaLoader } from '@/components/ui/ganesha-loader';

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
    case 'DEPOSIT':
    case 'CREDIT': 
      return <ArrowDownCircle className="w-5 h-5 text-success" />;
    case 'WITHDRAWAL':
    case 'DEBIT': 
      return <ArrowUpCircle className="w-5 h-5 text-error" />;
    case 'TRANSFER': return <ArrowLeftRight className="w-5 h-5 text-vintage-500" />;
    default: return null;
  }
}

export function BanksView() {
  const {
    bankAccounts: accounts = [], movements = [], isLoading, total: rawTotal = 0, totalPages = 1, page = 1, limit = 20,
    search = '', accountFilter = '', typeFilter = '',
    setSearch, setAccountFilter, setTypeFilter, setPage, clearFilters,
    createMovement, reconcileMovement,
    createAccount, updateAccount, deleteAccount,
    totalBalance: hookBalance = 0, totalDeposits: hookDeposits = 0, totalWithdrawals: hookWithdrawals = 0,
    isCreatingAccount, isUpdatingAccount, isDeletingAccount,
  } = useBanks() as any;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Compute summary from real data — prefer hook values, fallback to computing from arrays
  const totalBalance = Number(hookBalance || accounts.reduce((s: number, a: any) => s + (Number(a.currentBalance || a.initialBalance) || 0), 0));
  const totalDeposits = Number(hookDeposits || movements.filter((m: any) => m.movementType === 'DEPOSIT' || m.movementType === 'CREDIT').reduce((s: number, m: any) => s + Math.abs(Number(m.amount) || 0), 0));
  const totalWithdrawals = Number(hookWithdrawals || movements.filter((m: any) => m.movementType === 'WITHDRAWAL' || m.movementType === 'DEBIT').reduce((s: number, m: any) => s + Math.abs(Number(m.amount) || 0), 0));
  const total = rawTotal || movements.length;


  const [showForm, setShowForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);

  // Account form state
  const [accName, setAccName] = useState('');
  const [accBankName, setAccBankName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [accType, setAccType] = useState('CHECKING');
  const [accInitialBalance, setAccInitialBalance] = useState('0');

  const [formAccountId, setFormAccountId] = useState(accounts?.[0]?.id || '');
  const [formType, setFormType] = useState<'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'>('DEPOSIT');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formReference, setFormReference] = useState('');
  const [saving, setSaving] = useState(false);


  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      toast.loading('Generando estado de cuenta...', { id: 'export-loading', duration: 8000 });
      const currentCompany = useAppStore.getState().currentCompany;
      const companyName = currentCompany?.name || 'GANESHA Compañía';
      
      const selectedAcc = accounts.find((a: any) => a.id === accountFilter);
      const accNameStr = selectedAcc ? `${selectedAcc.bankName} - ${selectedAcc.accountNumber}` : 'Todas las Cuentas';

      if (format === 'excel') {
        await exportBanksExcel(movements, companyName, accNameStr);
      } else {
        await exportBanksPDF(movements, companyName, accNameStr);
      }
      toast.success(`Movimientos exportados en ${format.toUpperCase()}`, { id: 'export-loading' });
    } catch {
      toast.error('Error al exportar movimientos', { id: 'export-loading' });
    }
  };

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

  const resetForm = useCallback(() => {
    setFormAccountId(accounts?.[0]?.id || '');
    setFormType('DEPOSIT');
    setFormDescription('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormReference('');
  }, [accounts]);

  const handleCreateAccount = useCallback(async () => {
    if (!accName.trim()) { toast.error('Ingresa un nombre'); return; }
    if (!accBankName.trim()) { toast.error('Ingresa el nombre del banco'); return; }
    if (!accNumber.trim()) { toast.error('Ingresa el número de cuenta'); return; }

    const data = {
      name: accName,
      bankName: accBankName,
      accountNumber: accNumber,
      accountType: accType,
      initialBalance: parseFloat(accInitialBalance),
      currency: 'NIO',
    };

    try {
      if (editingAccount) {
        await updateAccount({ id: editingAccount.id, data });
        toast.success('Cuenta actualizada');
      } else {
        await createAccount(data);
        toast.success('Cuenta creada');
      }
      setShowAccountForm(false);
      resetAccountForm();
    } catch {
      toast.error('Error al guardar la cuenta');
    }
  }, [accName, accBankName, accNumber, accType, accInitialBalance, editingAccount, createAccount, updateAccount]);

  const handleDeleteAccount = useCallback(async () => {
    if (!deleteAccountId) return;
    try {
      await deleteAccount(deleteAccountId);
      toast.success('Cuenta eliminada');
      setDeleteAccountId(null);
    } catch {
      toast.error('No se pudo eliminar la cuenta');
    }
  }, [deleteAccountId, deleteAccount]);

  const resetAccountForm = () => {
    setAccName('');
    setAccBankName('');
    setAccNumber('');
    setAccType('CHECKING');
    setAccInitialBalance('0');
    setEditingAccount(null);
  };

  const handleReconcile = useCallback(async (bankAccountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!bankAccountId) return toast.error('No se pudo identificar la cuenta bancaria');
    
    try {
      const res = await reconcileMovement(bankAccountId);
      if (res?.reconciled > 0) {
        toast.success(`Se conciliaron ${res.reconciled} movimientos automáticamente`);
      } else {
        toast.info(res?.message || 'No se encontraron coincidencias automáticas');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al conciliar');
    }
  }, [reconcileMovement]);

  const accountFilterOptions = useMemo(() => (accounts || []).map((a: any) => ({
    value: a.id,
    label: `${a.bankName} (${a.accountNumber.slice(-4)})`,
  })), [accounts]);

  if (loading) return <GaneshaLoader variant="compact" message="Sincronizando Bancos..." />;

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
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={() => handleExport('pdf')} className="gap-2">
            <Download className="w-4 h-4" />
            PDF
          </PastelButton>
          <PastelButton variant="outline" onClick={() => handleExport('excel')} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </PastelButton>
          <PastelButton variant="outline" onClick={() => { resetAccountForm(); setShowAccountForm(true); }}>
            <Landmark className="w-4 h-4 mr-2" />
            Gestionar Cuentas
          </PastelButton>
          <PastelButton onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Movimiento
          </PastelButton>
        </div>
      </motion.div>

      {/* Account cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(accounts || []).map((acc: any) => {
          const colors = accountColors[acc.accountType] || accountColors.CHECKING;
          const depositTotal = movements
            .filter((m) => m.bankAccountId === acc.id && (m.movementType === 'DEPOSIT' || m.movementType === 'CREDIT'))
            .reduce((s, m) => s + (Number(m.amount) || 0), 0);
          const withdrawalTotal = movements
            .filter((m) => m.bankAccountId === acc.id && (m.movementType === 'WITHDRAWAL' || m.movementType === 'DEBIT'))
            .reduce((s, m) => s + Math.abs(Number(m.amount) || 0), 0);
          return (
            <VintageCard key={acc.id} className="p-4 relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => {
                    setEditingAccount(acc);
                    setAccName(acc.name);
                    setAccBankName(acc.bankName);
                    setAccNumber(acc.accountNumber);
                    setAccType(acc.accountType);
                    setAccInitialBalance(acc.initialBalance.toString());
                    setShowAccountForm(true);
                  }}
                  className="p-1 hover:bg-vintage-100 rounded text-vintage-500"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteAccountId(acc.id)}
                  className="p-1 hover:bg-vintage-100 rounded text-error"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
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
                  {formatCurrency(acc.currentBalance, 'NIO')}
                </span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-success">
                  +{formatCurrency(depositTotal, 'NIO')}
                </span>
                <span className="text-error">
                  -{formatCurrency(withdrawalTotal, 'NIO')}
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
            {formatCurrency(totalBalance, 'NIO')}
          </p>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownCircle className="w-4 h-4 text-success" />
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Depósitos</p>
          </div>
          <p className="text-xl font-playfair text-success mt-1">{formatCurrency(totalDeposits, 'NIO')}</p>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpCircle className="w-4 h-4 text-error" />
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Retiros</p>
          </div>
          <p className="text-xl font-playfair text-error mt-1">{formatCurrency(totalWithdrawals, 'NIO')}</p>
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
                    (row.movementType === 'DEPOSIT' || row.movementType === 'CREDIT') ? 'text-success' : 'text-error',
                  )}>
                    {(row.movementType === 'DEPOSIT' || row.movementType === 'CREDIT') ? '+' : '-'}{formatCurrency(row.amount, 'NIO')}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {row.reconciled ? (
                    <button
                      onClick={(e) => handleReconcile(row.bankAccountId, e)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success"
                      title="Conciliado"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Conciliado
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleReconcile(row.bankAccountId, e)}
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
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" onClick={() => setShowForm(false)} />
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
                    <label className="block text-xs font-medium text-vintage-600 mb-1.5">Monto (NIO)</label>
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
      {/* Bank Account Modal */}
      <AnimatePresence>
        {showAccountForm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-[1px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-vintage-200 overflow-hidden" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="p-6 border-b border-vintage-100 flex items-center justify-between">
                <h3 className="text-lg font-playfair font-bold text-vintage-800">{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta Bancaria'}</h3>
                <button onClick={() => setShowAccountForm(false)} className="text-vintage-400 hover:bg-vintage-50 p-1 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-vintage-600 mb-1.5 ml-1">Nombre Identificador</label>
                    <input value={accName} onChange={e => setAccName(e.target.value)} placeholder="Ej. Principal" className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-vintage-600 mb-1.5 ml-1">Banco</label>
                    <input value={accBankName} onChange={e => setAccBankName(e.target.value)} placeholder="Ej. BANPRO" className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-vintage-600 mb-1.5 ml-1">Número de Cuenta</label>
                  <input value={accNumber} onChange={e => setAccNumber(e.target.value)} placeholder="000-000-0000" className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-vintage-600 mb-1.5 ml-1">Tipo</label>
                    <select value={accType} onChange={e => setAccType(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400">
                      <option value="CHECKING">Corriente</option>
                      <option value="SAVINGS">Ahorros</option>
                      <option value="CREDIT">Tarjeta de Crédito</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-vintage-600 mb-1.5 ml-1">Saldo Inicial (NIO)</label>
                    <input type="number" value={accInitialBalance} onChange={e => setAccInitialBalance(e.target.value)} disabled={!!editingAccount} className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400" />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-vintage-50/50 flex justify-end gap-3">
                <PastelButton variant="outline" onClick={() => setShowAccountForm(false)}>Cancelar</PastelButton>
                <PastelButton onClick={handleCreateAccount} loading={isCreatingAccount || isUpdatingAccount}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingAccount ? 'Guardar Cambios' : 'Crear Cuenta'}
                </PastelButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteAccountId}
        onClose={() => setDeleteAccountId(null)}
        onConfirm={handleDeleteAccount}
        title="Eliminar Cuenta Bancaria"
        description="¿Estás seguro de que deseas eliminar esta cuenta? Se eliminarán todos los movimientos asociados."
        loading={isDeletingAccount}
      />
    </motion.div>
  );
}
