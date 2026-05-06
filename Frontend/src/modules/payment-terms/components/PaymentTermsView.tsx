'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { StatusBadge } from '@/components/ui/vintage-ui';
import { usePaymentTerms, PaymentTerm } from '../hooks/usePaymentTerms';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { exportPaymentTermsExcel } from '@/lib/utils/export';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useEffect } from 'react';
import { GaneshaLoader } from '@/components/ui/ganesha-loader';


export function PaymentTermsView() {
  const currentCompany = useAppStore(s => s.currentCompany);
  const { terms, isLoading, createTerm, updateTerm, isCreating } = usePaymentTerms();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PaymentTerm | null>(null);
  const [form, setForm] = useState({ name: '', days: 0, isDefault: false, isActive: true });

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (loading) return <GaneshaLoader variant="compact" message="Sincronizando Términos de Pago..." />;


  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', days: 0, isDefault: false, isActive: true });
    setShowForm(true);
  };

  const openEdit = (t: PaymentTerm) => {
    setEditing(t);
    setForm({ name: t.name, days: t.days, isDefault: t.isDefault, isActive: t.isActive });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || form.days === undefined) {
      toast.error('Nombre y días son obligatorios');
      return;
    }
    
    if (editing) {
      await updateTerm({ id: editing.id, data: form });
    } else {
      await createTerm(form);
    }
    setShowForm(false);
  };
  const handleExport = async () => {
    if (!terms.length) return;
    try {
      toast.loading('Generando reporte...', { id: 'export-loading', duration: 8000 });
      await exportPaymentTermsExcel(terms, currentCompany?.name || 'GANESHA');
      toast.success('Términos de pago exportados', { id: 'export-loading' });
    } catch {
      toast.error('Error al exportar términos', { id: 'export-loading' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-vintage-900">Términos de Pago</h2>
          <p className="text-sm text-vintage-600 mt-1">Configuración de plazos de crédito para clientes y proveedores</p>
        </div>
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={handleExport} className="gap-2">
            <Clock className="w-4 h-4" />
            Exportar Excel
          </PastelButton>
          <PastelButton onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Término
          </PastelButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {terms.map((t) => (
          <VintageCard key={t.id} className={cn("relative group border-2", t.isDefault ? "border-vintage-400" : "border-transparent")}>
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-lg bg-vintage-50 text-vintage-600">
                <Clock className="w-5 h-5" />
              </div>
              <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-vintage-800 mt-3">{t.name}</h3>
            <p className="text-3xl font-playfair font-bold text-vintage-900 mt-1">{t.days} <span className="text-xs text-vintage-400 font-sans uppercase">Días</span></p>
            
            <div className="flex items-center justify-between mt-4">
              <StatusBadge status={t.isActive ? 'success' : 'neutral'} label={t.isActive ? 'Activo' : 'Inactivo'} size="xs" />
              {t.isDefault && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-vintage-600 uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" /> Predeterminado
                </span>
              )}
            </div>
          </VintageCard>
        ))}
        {terms.length === 0 && (
          <div className="col-span-full py-12 text-center text-vintage-500">No hay términos de pago configurados</div>
        )}
      </div>

      {showForm && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" onClick={() => setShowForm(false)} />
          <motion.div className="relative bg-card rounded-2xl p-6 max-w-md w-full shadow-xl border border-vintage-200" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <h3 className="text-lg font-playfair font-bold text-vintage-800 mb-4">{editing ? 'Editar' : 'Nuevo'} Término de Pago</h3>
            <div className="space-y-4">
              <FloatingInput label="Nombre (ej: Contado, 30 Días)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <FloatingInput label="Días de crédito" type="number" value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} />
              
              <div className="flex flex-col gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4 rounded text-vintage-600 focus:ring-vintage-400 border-vintage-300" />
                  <span className="text-sm text-vintage-700 font-medium">Establecer como predeterminado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded text-vintage-600 focus:ring-vintage-400 border-vintage-300" />
                  <span className="text-sm text-vintage-700 font-medium">Término Activo</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-xl border border-vintage-200 text-vintage-700 hover:bg-vintage-50">Cancelar</button>
              <PastelButton onClick={handleSave} loading={isCreating}>{editing ? 'Guardar' : 'Crear'}</PastelButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
