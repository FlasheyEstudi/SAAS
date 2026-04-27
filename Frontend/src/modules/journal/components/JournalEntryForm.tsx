'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Save,
  Send,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Search,
} from 'lucide-react';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { useAppStore } from '@/lib/stores/useAppStore';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput, FloatingSelect } from '@/components/ui/floating-input';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { JournalEntryLine } from '@/lib/api/types';
import { journalEntrySchema } from '@/lib/schemas/journal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface FormLine {
  _uid: string;
  accountId: string;
  costCenterId: string;
  description: string;
  debit: number;
  credit: number;
}

function generateUid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyLine(): FormLine {
  return { _uid: generateUid(), accountId: '', costCenterId: '', description: '', debit: 0, credit: 0 };
}

const entryTypeOptions = [
  { value: 'DIARIO', label: 'Diario' },
  { value: 'EGRESO', label: 'Egreso' },
  { value: 'INGRESO', label: 'Ingreso' },
  { value: 'TRASPASO', label: 'Traspaso' },
];

export function JournalEntryForm() {
  const { viewParams, navigate } = useAppStore();
  const entryId = viewParams?.id;
  const { 
    accounts, 
    costCenters, 
    periods, 
    createEntry, 
    updateEntry,
    validateEntry,
    getEntry 
  } = useJournalEntries();

  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [entryType, setEntryType] = useState<'DIARIO' | 'EGRESO' | 'INGRESO' | 'TRASPASO'>('DIARIO');
  const [periodId, setPeriodId] = useState(periods.length > 0 ? periods[periods.length - 1].id : '');

  const [lines, setLines] = useState<FormLine[]>([emptyLine(), emptyLine()]);
  const [isLoading, setIsLoading] = useState(!!entryId);

  useEffect(() => {
    if (entryId) {
      const existing = getEntry(entryId);
      if (existing) {
        setDescription(existing.description);
        setEntryDate(new Date(existing.entryDate).toISOString().split('T')[0]);
        setEntryType(existing.entryType);
        setPeriodId(existing.periodId);
        setLines(existing.lines.map((l: any) => ({
          _uid: generateUid(),
          accountId: l.accountId,
          costCenterId: l.costCenterId || '',
          description: l.description,
          debit: Number(l.debit),
          credit: Number(l.credit)
        })));
        setIsLoading(false);
      }
    }
  }, [entryId, getEntry]);

  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationShown, setValidationShown] = useState(false);

  // Account search
  const [accountSearch, setAccountSearch] = useState('');
  const [activeLineUid, setActiveLineUid] = useState<string | null>(null);

  // Filtered accounts for search
  const filteredAccounts = useMemo(() => {
    if (!accountSearch.trim()) return accounts.filter((a) => !a.isGroup).slice(0, 20);
    const q = accountSearch.toLowerCase();
    return accounts.filter(
      (a) => !a.isGroup && (a.name.toLowerCase().includes(q) || a.code.includes(q))
    ).slice(0, 20);
  }, [accountSearch, accounts]);

  // Totals
  const totalDebit = useMemo(() => lines.reduce((s, l) => s + Number(l.debit || 0), 0), [lines]);
  const totalCredit = useMemo(() => lines.reduce((s, l) => s + Number(l.credit || 0), 0), [lines]);
  const difference = useMemo(() => Math.abs(totalDebit - totalCredit), [totalDebit, totalCredit]);
  const isBalanced = difference <= 0.01;
  const hasLines = lines.some((l) => l.accountId && (l.debit > 0 || l.credit > 0));

  // ─── Line management ────────────────────────────────────────────
  const addLine = useCallback(() => {
    setLines((prev) => [...prev, emptyLine()]);
  }, []);

  const removeLine = useCallback((uid: string) => {
    setLines((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((l) => l._uid !== uid);
    });
  }, []);

  const updateLine = useCallback((uid: string, field: keyof FormLine, value: string | number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l._uid !== uid) return l;
        const updated = { ...l, [field]: value };
        // If setting debit, clear credit, and vice versa
        if (field === 'debit' && typeof value === 'number' && value > 0) {
          updated.credit = 0;
        }
        if (field === 'credit' && typeof value === 'number' && value > 0) {
          updated.debit = 0;
        }
        return updated;
      })
    );
  }, []);

  // ─── Handle account select ──────────────────────────────────────
  const handleAccountSelect = useCallback((lineUid: string, accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    updateLine(lineUid, 'accountId', accountId);
    if (account && !account.isGroup && account.code) {
      updateLine(lineUid, 'description', account.name);
    }
    setActiveLineUid(null);
    setAccountSearch('');
  }, [accounts, updateLine]);



  // ─── Validation ─────────────────────────────────────────────────
  const handleValidate = useCallback(async () => {
    setValidating(true);
    setValidationShown(true);
    setValidationErrors([]);

    const companyId = useAppStore.getState().companyId;
    const dataToValidate: any = {
      companyId: companyId || '',
      description,
      entryDate,
      entryType,
      periodId,
      lines: lines.map(l => ({
        accountId: l.accountId,
        costCenterId: l.costCenterId || null,
        description: l.description,
        debit: l.debit,
        credit: l.credit
      }))
    };

    // 1. Client-side Zod Validation
    const zodResult = journalEntrySchema.safeParse(dataToValidate);
    if (!zodResult.success) {
      const errors = zodResult.error.issues.map(i => i.message);
      setValidationErrors(errors);
      toast.error('Errores en la estructura de la póliza');
      setValidating(false);
      return { valid: false, errors };
    }

    try {
      // 2. Server-side Business Logic Validation
      const result = await validateEntry(dataToValidate);
      if (result.valid) {
        toast.success('✓ Póliza válida. Lista para guardar o publicar.');
        setValidationErrors([]);
        return { valid: true };
      } else {
        toast.error('Póliza con errores de negocio');
        const errors = result.errors || ['La póliza no está cuadrada'];
        setValidationErrors(errors);
        return { valid: false, errors };
      }
    } catch {
      toast.error('Error al validar la póliza');
      return { valid: false };
    } finally {
      setValidating(false);
    }
  }, [lines, description, entryDate, entryType, periodId, validateEntry]);

  // ─── Save as draft ──────────────────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    if (!description.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }
    if (!entryDate) {
      toast.error('La fecha es obligatoria');
      return;
    }
    if (!hasLines) {
      toast.error('Debe agregar al menos una línea con cuenta y monto');
      return;
    }

    setSaving(true);
    try {
      const lineData: Omit<JournalEntryLine, 'id' | 'journalEntryId'>[] = lines.map((l) => ({
        accountId: l.accountId,
        account: accounts.find((a) => a.id === l.accountId),
        costCenterId: l.costCenterId || undefined,
        costCenter: l.costCenterId ? costCenters.find((c) => c.id === l.costCenterId) : undefined,
        description: l.description,
        debit: l.debit,
        credit: l.credit,
      }));

      if (entryId) {
        await updateEntry({
          id: entryId,
          description,
          entryDate,
          entryType,
          periodId,
          lines: lineData as any,
          status: 'DRAFT'
        });
      } else {
        await createEntry({
          description,
          entryDate,
          entryType,
          periodId,
          lines: lineData,
          status: 'DRAFT',
        });
      }

      toast.success('Póliza guardada como borrador');
      navigate('journal');
    } catch {
      toast.error('Error al guardar la póliza');
    } finally {
      setSaving(false);
    }
  }, [description, entryDate, entryType, periodId, lines, hasLines, accounts, costCenters, createEntry, navigate]);

  // ─── Save & post ────────────────────────────────────────────────
  const handleSaveAndPost = useCallback(async () => {
    if (!isBalanced) {
      toast.error('La póliza no está cuadrada. No se puede publicar.');
      return;
    }
    if (!description.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }
    if (!hasLines) {
      toast.error('Debe agregar al menos una línea con cuenta y monto');
      return;
    }

    setPosting(true);
    try {
      const lineData: Omit<JournalEntryLine, 'id' | 'journalEntryId'>[] = lines.map((l) => ({
        accountId: l.accountId,
        account: accounts.find((a) => a.id === l.accountId),
        costCenterId: l.costCenterId || undefined,
        costCenter: l.costCenterId ? costCenters.find((c) => c.id === l.costCenterId) : undefined,
        description: l.description,
        debit: l.debit,
        credit: l.credit,
      }));

      if (entryId) {
        await updateEntry({
          id: entryId,
          description,
          entryDate,
          entryType,
          periodId,
          lines: lineData as any,
          status: 'POSTED'
        });
      } else {
        await createEntry({
          description,
          entryDate,
          entryType,
          periodId,
          lines: lineData,
          status: 'POSTED',
        });
      }

      toast.success('Póliza creada y publicada correctamente');
      navigate('journal');
    } catch {
      toast.error('Error al publicar la póliza');
    } finally {
      setPosting(false);
    }
  }, [description, entryDate, entryType, periodId, lines, hasLines, isBalanced, accounts, costCenters, createEntry, navigate]);

  const handleBack = useCallback(() => {
    navigate('journal');
  }, [navigate]);

  // Close account search dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setActiveLineUid(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl border border-vintage-200 text-vintage-600 hover:bg-vintage-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-playfair text-vintage-800">{entryId ? 'Editar Póliza' : 'Nueva Póliza'}</h1>
            <p className="text-sm text-vintage-500">{entryId ? 'Modifique los datos de la póliza' : 'Capture los datos de la póliza contable'}</p>
          </div>
        </div>
      </motion.div>

      {/* Form header */}
      <motion.div variants={itemVariants}>
        <VintageCard hover={false} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 lg:col-span-2">
              <FloatingInput
                label="Descripción de la póliza"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Pago de nómina quincenal"
              />
            </div>
            <FloatingInput
              label="Fecha"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
            <FloatingSelect
              label="Tipo de póliza"
              value={entryType}
              onChange={(e) => setEntryType(e.target.value as typeof entryType)}
            >
              <option value="">Seleccionar tipo</option>
              {entryTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </FloatingSelect>
            <div className="sm:col-span-2">
              <FloatingSelect
                label="Período contable"
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value)}
              >
                <option value="">Seleccionar período</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </FloatingSelect>
            </div>
          </div>
        </VintageCard>
      </motion.div>

      {/* Lines table */}
      <motion.div variants={itemVariants}>
        <VintageCard hover={false} className="p-0 overflow-hidden">
          {/* Lines header */}
          <div className="px-4 py-3 border-b border-vintage-200 bg-vintage-50/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-vintage-700 uppercase tracking-wider">
              Partidas de la póliza
            </h3>
            <PastelButton variant="outline" size="sm" onClick={addLine} className="gap-1.5 text-xs h-8">
              <Plus className="w-3.5 h-3.5" />
              Agregar línea
            </PastelButton>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-vintage-200">
                  <th className="px-3 py-2.5 text-xs font-semibold text-vintage-600 text-left w-[40px]">#</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-vintage-600 text-left min-w-[220px]">Cuenta</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-vintage-600 text-left min-w-[160px]">Centro de Costo</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-vintage-600 text-left min-w-[180px]">Descripción</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-vintage-600 text-right w-[130px]">Debe</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-vintage-600 text-right w-[130px]">Haber</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-vintage-600 text-center w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vintage-100">
                {lines.map((line, idx) => (
                  <motion.tr
                    key={line._uid}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="hover:bg-vintage-50/50 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <span className="text-xs text-vintage-400 font-mono">{idx + 1}</span>
                    </td>
                    {/* Account selector */}
                    <td className="px-3 py-2 relative">
                      <div
                        className="relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveLineUid(line._uid);
                          setAccountSearch('');
                        }}
                      >
                        <div className={cn(
                          'w-full px-2.5 py-2 text-sm border rounded-lg cursor-pointer transition-colors',
                          line.accountId ? 'border-vintage-200 bg-white' : 'border-vintage-200 bg-vintage-50 text-vintage-400'
                        )}>
                          {line.accountId
                            ? (() => {
                                const acc = accounts.find((a) => a.id === line.accountId);
                                return acc ? (
                                  <span className="text-vintage-700">
                                    <span className="text-vintage-400 font-mono mr-2">{acc.code}</span>
                                    {acc.name}
                                  </span>
                                ) : 'Seleccionar cuenta';
                              })()
                            : 'Seleccionar cuenta'}
                        </div>
                        {/* Dropdown */}
                        {activeLineUid === line._uid && (
                          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-vintage-200 rounded-xl shadow-lg max-h-64 overflow-hidden">
                            <div className="p-2 border-b border-vintage-100">
                              <div className="flex items-center gap-2 px-2 py-1.5 bg-vintage-50 rounded-lg">
                                <Search className="w-3.5 h-3.5 text-vintage-400" />
                                <input
                                  type="text"
                                  placeholder="Buscar cuenta..."
                                  value={accountSearch}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setAccountSearch(e.target.value);
                                  }}
                                  className="w-full bg-transparent text-sm outline-none text-vintage-700 placeholder:text-vintage-400"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            <div className="overflow-y-auto max-h-48">
                              {filteredAccounts.length === 0 ? (
                                <p className="px-3 py-4 text-sm text-vintage-400 text-center">No se encontraron cuentas</p>
                              ) : (
                                filteredAccounts.map((acc) => (
                                  <button
                                    key={acc.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAccountSelect(line._uid, acc.id);
                                    }}
                                    className={cn(
                                      'w-full text-left px-3 py-2 text-sm hover:bg-vintage-50 transition-colors flex items-center gap-2',
                                      line.accountId === acc.id && 'bg-vintage-50'
                                    )}
                                  >
                                    <span className="font-mono text-vintage-400 text-xs w-10 flex-shrink-0">{acc.code}</span>
                                    <span className="text-vintage-700 truncate">{acc.name}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Cost center */}
                    <td className="px-3 py-2">
                      <select
                        value={line.costCenterId}
                        onChange={(e) => updateLine(line._uid, 'costCenterId', e.target.value)}
                        className="w-full px-2.5 py-2 text-sm border border-vintage-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-vintage-400 text-vintage-700"
                      >
                        <option value="">Sin centro</option>
                        {costCenters.map((cc) => (
                          <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                        ))}
                      </select>
                    </td>
                    {/* Description */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(line._uid, 'description', e.target.value)}
                        placeholder="Descripción de la partida"
                        className="w-full px-2.5 py-2 text-sm border border-vintage-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-vintage-400 text-vintage-700 placeholder:text-vintage-400"
                      />
                    </td>
                    {/* Debit */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit || ''}
                        onChange={(e) => updateLine(line._uid, 'debit', Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0.00"
                        className="w-full px-2.5 py-2 text-sm border border-vintage-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-vintage-400 text-vintage-700 text-right font-mono placeholder:text-vintage-300"
                      />
                    </td>
                    {/* Credit */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit || ''}
                        onChange={(e) => updateLine(line._uid, 'credit', Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0.00"
                        className="w-full px-2.5 py-2 text-sm border border-vintage-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-vintage-400 text-vintage-700 text-right font-mono placeholder:text-vintage-300"
                      />
                    </td>
                    {/* Remove */}
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => removeLine(line._uid)}
                        disabled={lines.length <= 2}
                        className="p-1 rounded-lg text-vintage-400 hover:text-error hover:bg-error/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr className="bg-vintage-50/80 border-t-2 border-vintage-300">
                  <td colSpan={4} className="px-3 py-3 text-sm font-semibold text-vintage-700 text-right">
                    TOTALES
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-bold font-mono text-vintage-800">
                      {formatCurrency(totalDebit, 'NIO')}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-bold font-mono text-vintage-800">
                      {formatCurrency(totalCredit, 'NIO')}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Balance indicator */}
          <div className={cn(
            'px-4 py-3 border-t border-vintage-200 flex items-center justify-between',
            isBalanced ? 'bg-success/5' : 'bg-error/5'
          )}>
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <AlertCircle className="w-4 h-4 text-error" />
              )}
              <span className={cn(
                'text-sm font-medium',
                isBalanced ? 'text-success' : 'text-error'
              )}>
                {isBalanced ? 'Póliza cuadrada' : `Diferencia: ${formatCurrency(difference, 'NIO')}`}
              </span>
            </div>
            <span className={cn(
              'text-sm font-mono font-bold',
              isBalanced ? 'text-success' : 'text-error'
            )}>
              {formatCurrency(difference, 'NIO')}
            </span>
          </div>
        </VintageCard>
      </motion.div>

      {/* Validation errors */}
      {validationShown && validationErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error/5 border border-error/20 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-error" />
            <span className="text-sm font-semibold text-error">Errores de validación</span>
          </div>
          <ul className="space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i} className="text-sm text-error/80 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-error/50" />
                {err}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
        <PastelButton variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Cancelar
        </PastelButton>
        <div className="flex items-center gap-3">
          <PastelButton variant="outline" onClick={handleValidate} loading={validating} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Validar
          </PastelButton>
          <PastelButton onClick={handleSaveDraft} loading={saving} className="gap-2">
            <Save className="w-4 h-4" />
            Guardar Borrador
          </PastelButton>
          <PastelButton
            variant="success"
            onClick={handleSaveAndPost}
            loading={posting}
            disabled={!isBalanced}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            Publicar
          </PastelButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
