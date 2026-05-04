'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Calendar,
  FileText,
  User,
  Clock,
  Hash,
  Tag,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useJournalEntries, useJournalEntry } from '../hooks/useJournalEntries';
import { useAppStore } from '@/lib/stores/useAppStore';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { StatusBadge, PageLoader } from '@/components/ui/vintage-ui';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusLabel,
  getEntryTypeColor,
} from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

import { exportJournalEntryPDF } from '@/lib/utils/export';

export function JournalEntryDetail() {
  const { viewParams, navigate, currentCompany } = useAppStore();
  const entryId = viewParams?.id;
  const { postEntry, periods } = useJournalEntries();
  const { entry: initialEntry, isLoading: detailLoading } = useJournalEntry(entryId || '');

  const [entry, setEntry] = useState<any>(null);
  const [posting, setPosting] = useState(false);

  const handlePrint = async () => {
    if (!entry) return;
    toast.loading('Generando documento...', { id: 'export-loading', duration: 8000 });
    await exportJournalEntryPDF(entry, currentCompany?.name || 'GANESHA');
    toast.dismiss(toastId);
    toast.success('Póliza exportada a PDF');
  };

  useEffect(() => {
    if (initialEntry) {
      setEntry(initialEntry);
    }
  }, [initialEntry]);

  useEffect(() => {
    if (!entryId && !detailLoading) {
      navigate('journal');
    }
  }, [entryId, detailLoading, navigate]);

  const handleBack = useCallback(() => {
    navigate('journal');
  }, [navigate]);

  const handleEdit = useCallback(() => {
    // Navigate to create form (in a real app, this would be journal-edit)
    navigate('journal-create');
  }, [navigate]);

  const handlePost = useCallback(async () => {
    if (!entryId) return;
    setPosting(true);
    try {
      const result = await postEntry(entryId);
      if (result) {
        setEntry(result);
        toast.success('Póliza publicada correctamente');
      } else {
        toast.error('No se pudo publicar la póliza');
      }
    } catch {
      toast.error('Error al publicar la póliza');
    } finally {
      setPosting(false);
    }
  }, [entryId, postEntry]);

  const getPeriodName = (periodId: string) => {
    const p = periods.find((per) => per.id === periodId);
    return p ? p.name : 'Desconocido';
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning'> = {
      POSTED: 'success',
      DRAFT: 'warning',
    };
    return (
      <StatusBadge status={map[status] || 'neutral'} label={getStatusLabel(status)} size="md" />
    );
  };

  if (detailLoading && !entry) {
    return <PageLoader text="Cargando póliza..." />;
  }

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <FileText className="w-12 h-12 text-vintage-300" />
        <p className="text-vintage-600">Póliza no encontrada</p>
        <PastelButton variant="outline" onClick={handleBack}>
          Volver al listado
        </PastelButton>
      </div>
    );
  }

  const isDraft = entry.status === 'DRAFT';

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
            <h1 className="text-2xl font-playfair text-vintage-800">
              {entry.entryNumber}
            </h1>
            <p className="text-sm text-vintage-500">Detalle de póliza contable</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(entry.status)}
          <PastelButton variant="outline" onClick={handlePrint} className="gap-2">
             <FileText className="w-4 h-4" />
             Imprimir
          </PastelButton>
          {isDraft && (
            <>
              <PastelButton variant="outline" onClick={handleEdit} className="gap-2">
                Editar
              </PastelButton>
              <PastelButton variant="success" onClick={handlePost} loading={posting} className="gap-2">
                <Send className="w-4 h-4" />
                Publicar
              </PastelButton>
            </>
          )}
        </div>
      </motion.div>

      {/* Entry metadata */}
      <motion.div variants={itemVariants}>
        <VintageCard hover={false} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Description */}
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-lavender/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-vintage-600" />
                </div>
                <div>
                  <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Descripción</p>
                  <p className="text-base text-vintage-800 mt-0.5">{entry.description}</p>
                </div>
              </div>
            </div>

            {/* Entry number */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-vintage-100 flex items-center justify-center flex-shrink-0">
                <Hash className="w-4 h-4 text-vintage-500" />
              </div>
              <div>
                <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Número</p>
                <p className="text-sm text-vintage-800 mt-0.5 font-mono">{entry.entryNumber}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-peach/30 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-vintage-600" />
              </div>
              <div>
                <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Fecha</p>
                <p className="text-sm text-vintage-800 mt-0.5">{formatDate(entry.entryDate)}</p>
              </div>
            </div>

            {/* Type */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-vintage-100 flex items-center justify-center flex-shrink-0">
                <Tag className="w-4 h-4 text-vintage-500" />
              </div>
              <div>
                <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Tipo</p>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full mt-0.5',
                  getEntryTypeColor(entry.entryType)
                )}>
                  {getStatusLabel(entry.entryType)}
                </span>
              </div>
            </div>

            {/* Period */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-vintage-100 flex items-center justify-center flex-shrink-0">
                <Layers className="w-4 h-4 text-vintage-500" />
              </div>
              <div>
                <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Período</p>
                <p className="text-sm text-vintage-800 mt-0.5">{getPeriodName(entry.periodId)}</p>
              </div>
            </div>

            {/* Created by */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-lavender/30 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-vintage-600" />
              </div>
              <div>
                <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Creado por</p>
                <p className="text-sm text-vintage-800 mt-0.5">{entry.createdBy || '—'}</p>
              </div>
            </div>

            {/* Created at */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-vintage-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-vintage-500" />
              </div>
              <div>
                <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Fecha de creación</p>
                <p className="text-sm text-vintage-800 mt-0.5">{formatDateTime(entry.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Posted at (if applicable) */}
          {entry.postedAt && (
            <div className="mt-4 pt-4 border-t border-vintage-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Publicada el</p>
                <p className="text-sm text-success mt-0.5">{formatDateTime(entry.postedAt)}</p>
              </div>
            </div>
          )}
        </VintageCard>
      </motion.div>

      {/* Totals cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VintageCard hover={false} className="p-4">
          <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Debe</p>
          <p className="text-xl font-playfair text-vintage-800 mt-1 font-mono">
            {formatCurrency(entry.totalDebit, 'NIO')}
          </p>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Haber</p>
          <p className="text-xl font-playfair text-vintage-800 mt-1 font-mono">
            {formatCurrency(entry.totalCredit, 'NIO')}
          </p>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Diferencia</p>
          <p className={cn(
            'text-xl font-playfair mt-1 font-mono',
            entry.difference <= 0.01 ? 'text-success' : 'text-error'
          )}>
            {formatCurrency(entry.difference, 'NIO')}
          </p>
        </VintageCard>
      </motion.div>

      {/* Lines table */}
      <motion.div variants={itemVariants}>
        <VintageCard hover={false} className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-vintage-200 bg-vintage-50/50">
            <h3 className="text-sm font-semibold text-vintage-700 uppercase tracking-wider">
              Partidas ({entry.lines?.length || 0})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-vintage-200">
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-600 text-left w-[40px]">#</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-600 text-left min-w-[200px]">Cuenta</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-600 text-left min-w-[140px]">Centro de Costo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-600 text-left">Descripción</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-600 text-right w-[140px]">Debe</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-600 text-right w-[140px]">Haber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vintage-100">
                {entry.lines && entry.lines.length > 0 ? (
                  entry.lines.map((line: any, idx: number) => (
                    <motion.tr
                      key={line.id || idx}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                      className="hover:bg-vintage-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs text-vintage-400 font-mono">{idx + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        {line.account ? (
                          <div>
                            <span className="text-xs text-vintage-400 font-mono">{line.account.code}</span>
                            <p className="text-sm text-vintage-800">{line.account.name}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-vintage-400">{line.accountId || '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-vintage-600">
                          {line.costCenter ? `${line.costCenter.code} - ${line.costCenter.name}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-vintage-700">{line.description || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          'text-sm font-mono',
                          line.debit > 0 ? 'text-vintage-800 font-medium' : 'text-vintage-300'
                        )}>
                          {line.debit > 0 ? formatCurrency(line.debit, 'NIO') : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          'text-sm font-mono',
                          line.credit > 0 ? 'text-vintage-800 font-medium' : 'text-vintage-300'
                        )}>
                          {line.credit > 0 ? formatCurrency(line.credit, 'NIO') : '—'}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-sm text-vintage-400">No hay partidas registradas</p>
                    </td>
                  </tr>
                )}
              </tbody>
              {/* Totals */}
              <tfoot>
                <tr className="bg-vintage-50/80 border-t-2 border-vintage-300">
                  <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-vintage-700 text-right">
                    TOTALES
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold font-mono text-vintage-800">
                      {formatCurrency(entry.totalDebit, 'NIO')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold font-mono text-vintage-800">
                      {formatCurrency(entry.totalCredit, 'NIO')}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </VintageCard>
      </motion.div>

      {/* Back button */}
      <motion.div variants={itemVariants}>
        <PastelButton variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver al listado de pólizas
        </PastelButton>
      </motion.div>
    </motion.div>
  );
}
