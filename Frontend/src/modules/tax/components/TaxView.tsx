'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Percent, 
  Plus, 
  X, 
  Save, 
  Trash2, 
  Info, 
  ShieldCheck, 
  Calendar,
  AlertCircle,
  Receipt,
  TrendingUp,
  Filter,
  History as HistoryIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { useTaxes } from '../hooks/useTaxes';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ConfirmDialog, VintageTabs } from '@/components/ui/vintage-ui';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const taxTypes = [
  { value: 'IVA', label: 'IVA (Ventas/Compras)', color: 'bg-lavender/30 text-vintage-700' },
  { value: 'ISR', label: 'ISR (Renta)', color: 'bg-peach/30 text-vintage-800' },
  { value: 'RET_IVA', label: 'Retención IVA', color: 'bg-error/10 text-error' },
  { value: 'RET_ISR', label: 'Retención ISR', color: 'bg-error/10 text-error' },
  { value: 'IEPS', label: 'IEPS', color: 'bg-success/15 text-success' },
  { value: 'CEDULAR', label: 'Impuesto Cedular', color: 'bg-vintage-100 text-vintage-600' },
];

export function TaxView() {
  const { 
    rates, entries, isLoading, 
    createRate, updateRate, deleteRate,
    isCreating, isUpdating, isDeleting 
  } = useTaxes();

  const [activeTab, setActiveTab] = useState('rates');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    taxType: 'IVA',
    rate: 0,
    name: '',
    description: '',
    isRetention: false,
    effectiveFrom: new Date().toISOString().split('T')[0],
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      taxType: 'IVA',
      rate: 0,
      name: '',
      description: '',
      isRetention: false,
      effectiveFrom: new Date().toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const handleOpenEdit = (rate: any) => {
    setEditingId(rate.id);
    setFormData({
      taxType: rate.taxType,
      rate: rate.rate,
      name: rate.name,
      description: rate.description || '',
      isRetention: rate.isRetention,
      effectiveFrom: new Date(rate.effectiveFrom).toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.name?.trim()) return toast.error('El nombre es obligatorio');

    try {
      if (editingId) {
        await updateRate({ id: editingId, data: formData });
        toast.success('Impuesto actualizado');
      } else {
        await createRate(formData);
        toast.success('Nuevo impuesto registrado');
      }
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar impuesto');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRate(deleteId);
      toast.success('Impuesto eliminado');
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo eliminar');
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lavender/30 flex items-center justify-center">
            <Percent className="w-5 h-5 text-vintage-700" />
          </div>
          <div>
            <h1 className="text-2xl font-playfair font-bold text-vintage-800 tracking-tight">Impuestos y Tasas</h1>
            <p className="text-sm text-vintage-500">Configuración fiscal y registro histórico de impuestos</p>
          </div>
        </div>
        <div className="flex gap-2">
            <PastelButton variant="outline" className="gap-2 hidden md:flex">
              <HistoryIcon className="w-4 h-4" />
              Reporte DIOT
            </PastelButton>
            <PastelButton onClick={handleOpenCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva Tasa
            </PastelButton>
        </div>
      </div>

      <VintageTabs
        tabs={[
          { id: 'rates', label: 'Catálogo de Tasas', icon: <Percent className="w-4 h-4" /> },
          { id: 'entries', label: 'Libro de Impuestos', icon: <Receipt className="w-4 h-4" /> },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'rates' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rates.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-vintage-400 border-2 border-dashed border-vintage-200 rounded-2xl">
              <Percent className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium italic">No se han configurado tasas impositivas</p>
              <PastelButton variant="outline" size="sm" onClick={handleOpenCreate} className="mt-4">Registrar la primera</PastelButton>
            </div>
          ) : (
            rates.map((tr: any) => (
              <motion.div key={tr.id} variants={itemVariants}>
                <VintageCard className="p-5 h-full flex flex-col relative group hover:shadow-lg transition-shadow">
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 backdrop-blur rounded-lg p-1 border border-vintage-100">
                    <button onClick={() => handleOpenEdit(tr)} className="p-1.5 hover:bg-vintage-100 rounded-md text-vintage-500"><Info className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(tr.id)} className="p-1.5 hover:bg-error/10 rounded-md text-error"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                        taxTypes.find(t => t.value === tr.taxType)?.color || 'bg-vintage-100'
                      )}>
                        {tr.taxType}
                      </span>
                      <h3 className="text-lg font-playfair font-bold text-vintage-800 mt-1">{tr.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-mono font-bold text-vintage-900 leading-none">{Number(tr.rate).toFixed(2)}%</p>
                      {tr.isRetention && <p className="text-[10px] text-error font-bold tracking-tighter mt-1">RETENCIÓN</p>}
                    </div>
                  </div>

                  <p className="text-sm text-vintage-600 line-clamp-2 mb-4 italic leading-relaxed">
                     {tr.description || 'Sin descripción adicional para este impuesto.'}
                  </p>

                  <div className="mt-auto pt-4 border-t border-vintage-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-vintage-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Vigente desde {formatDate(tr.effectiveFrom)}</span>
                    </div>
                    {tr.isActive ? (
                        <span className="flex items-center gap-1 text-[10px] text-success font-bold"><ShieldCheck className="w-3 h-3" /> ACTIVO</span>
                    ) : (
                        <span className="bg-error/10 text-error px-2 py-0.5 rounded text-[10px] font-bold">INACTIVO</span>
                    )}
                  </div>
                </VintageCard>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <VintageCard className="p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-vintage-100 flex justify-between items-center bg-vintage-50/30">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <h3 className="text-sm font-bold text-vintage-800">Causas de Impuestos Recientes</h3>
                </div>
                <PastelButton variant="outline" size="sm" className="h-8 gap-1.5">
                    <Filter className="w-3 h-3" />
                    Filtrar Período
                </PastelButton>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-vintage-50/50">
                            <th className="px-5 py-3 text-[10px] font-bold text-vintage-500 uppercase tracking-wider">Fecha Operación</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-vintage-500 uppercase tracking-wider">Tasa Aplicada</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-vintage-500 uppercase tracking-wider text-right">Base Gravable</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-vintage-500 uppercase tracking-wider text-right">Monto Impuesto</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-vintage-500 uppercase tracking-wider">Referencia</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-vintage-100 italic">
                        {entries.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-vintage-400 text-sm">No se han registrado movimientos impositivos en este período</td>
                            </tr>
                        ) : (
                            entries.map((entry: any) => (
                                <tr key={entry.id} className="hover:bg-vintage-50 transition-colors">
                                    <td className="px-5 py-4 text-xs text-vintage-600 font-mono italic">
                                        {formatDate(entry.createdAt)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-vintage-800">{entry.taxRate?.name}</span>
                                            <span className="text-[10px] text-vintage-400 uppercase font-bold">{entry.taxRate?.taxType} ({entry.taxRate?.rate}%)</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <span className="text-sm font-mono text-vintage-600">{formatCurrency(entry.taxableBase || 0)}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <span className={cn(
                                            "text-sm font-mono font-bold",
                                            entry.taxRate?.isRetention ? "text-error" : "text-vintage-900"
                                        )}>
                                            {entry.taxRate?.isRetention ? '-' : ''}{formatCurrency(entry.taxAmount)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-xs text-vintage-500 bg-vintage-100 px-2 py-1 rounded font-mono">
                                            DOC-{entry.invoiceId.substring(0, 8).toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </VintageCard>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-vintage-200 overflow-hidden" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
              <div className="p-6 border-b border-vintage-100 flex items-center justify-between bg-vintage-50/20">
                <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-vintage-500" />
                    <h3 className="text-lg font-playfair font-bold text-vintage-800">{editingId ? 'Editar Tasa Impositiva' : 'Nueva Configuración de Impuesto'}</h3>
                </div>
                <button onClick={() => setShowForm(false)} className="text-vintage-400 hover:bg-vintage-100 p-1.5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-vintage-500 uppercase tracking-widest px-1">Tipo de Gravamen</label>
                    <select 
                      value={formData.taxType} 
                      onChange={e => setFormData({...formData, taxType: e.target.value as any})}
                      className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 outline-none transition-shadow italic"
                    >
                      {taxTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-vintage-500 uppercase tracking-widest px-1">Porcentaje Aplicable</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.rate} 
                        onChange={e => setFormData({...formData, rate: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 font-mono italic" 
                      />
                      <Percent className="absolute right-3 top-2.5 w-4 h-4 text-vintage-300" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-vintage-500 uppercase tracking-widest px-1">Nombre Descriptivo</label>
                  <input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej. IVA General 15%"
                    className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 italic" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-vintage-500 uppercase tracking-widest px-1">Notas y Observaciones</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Especifique conceptos de aplicación..."
                    className="w-full px-3 py-3 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 min-h-[90px] italic" 
                  />
                </div>

                <div className="flex items-center gap-6 p-4 bg-vintage-50 rounded-xl border border-vintage-100">
                  <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setFormData({...formData, isRetention: !formData.isRetention})}>
                    <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0", formData.isRetention ? "bg-error border-error text-white" : "border-vintage-300 bg-white")}>
                      {formData.isRetention && <AlertCircle className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                        <span className="text-xs font-bold text-vintage-800 block">Es una Retención Legal</span>
                        <span className="text-[10px] text-vintage-500 italic block">Se resta del subtotal en documentos</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-vintage-500 uppercase tracking-widest px-1">Vigencia Fiscal Desde</label>
                    <input 
                      type="date"
                      value={formData.effectiveFrom} 
                      onChange={e => setFormData({...formData, effectiveFrom: e.target.value})}
                      className="w-full px-3 py-3 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 font-mono italic" 
                    />
                </div>
              </div>

              <div className="p-6 bg-vintage-50/40 flex justify-end gap-3 border-t border-vintage-100">
                <PastelButton variant="outline" onClick={() => setShowForm(false)}>Cancelar</PastelButton>
                <PastelButton onClick={handleSubmit} loading={isCreating || isUpdating} className="gap-2 min-w-[140px]">
                  <Save className="w-4 h-4" />
                  {editingId ? 'Actualizar Tasa' : 'Crear Registro'}
                </PastelButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Registro Fiscal"
        description="Esta acción es irreversible y podría causar inconsistencias en reportes históricos."
        loading={isDeleting}
        variant="destructive"
      />
    </motion.div>
  );
}
