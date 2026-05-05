'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, TrendingDown, Calculator, History, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { StatusBadge, ConfirmDialog } from '@/components/ui/vintage-ui';
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { useFixedAssets, FixedAsset } from '../hooks/useFixedAssets';
import { exportAssetsExcel, exportAssetsPDF } from '@/lib/utils/export';
import { useAppStore } from '@/lib/stores/useAppStore';

export function AssetsView() {
  const { assets = [], summary: rawSummary, loading, depreciating, refreshAssets, depreciateAsset, bulkDepreciate, getAssetHistory, createAsset, updateAsset, deleteAsset } = useFixedAssets();
  const currentCompany = useAppStore(s => s.currentCompany);

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!assets.length) return;
    try {
      toast.loading(`Generando reporte ${format}...`, { id: 'export-loading', duration: 8000 });
      const name = currentCompany?.name || 'GANESHA';
      if (format === 'excel') {
        await exportAssetsExcel(assets, name);
      } else {
        await exportAssetsPDF(assets, name);
      }
      toast.success('Inventario de activos exportado', { id: 'export-loading' });
    } catch (error) {
      toast.error('Error al exportar activos', { id: 'export-loading' });
    }
  };

  // Compute summary from real data — prefer hook summary, fallback to computing from assets array
  const summary = {
    totalValue: Number(rawSummary?.totalPurchaseAmount ?? assets?.reduce((s: number, a: any) => s + Number(a.purchaseAmount || 0), 0) ?? 0),
    totalDepreciation: Number(rawSummary?.totalAccumulatedDepreciation ?? assets?.reduce((s: number, a: any) => s + Number(a.accumulatedDepreciation || 0), 0) ?? 0),
    bookValue: Number(rawSummary?.totalBookValue ?? assets?.reduce((s: number, a: any) => s + Number(a.currentBookValue || 0), 0) ?? 0),
    totalAssets: Number(rawSummary?.totalAssets ?? assets?.length ?? 0),
    activeAssets: Number(rawSummary?.activeAssets ?? assets?.filter(a => a.status === 'ACTIVE').length ?? 0),
    fullyDepreciated: Number(rawSummary?.fullyDepreciated ?? assets?.filter(a => a.status === 'FULLY_DEPRECIATED').length ?? 0),
  };

  const companyId = useAppStore((state) => state.companyId);
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDepreciateModal, setShowDepreciateModal] = useState<'single' | 'bulk' | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FixedAsset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [depParams, setDepParams] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [form, setForm] = useState<Partial<FixedAsset>>({
    name: '',
    assetType: 'OTHER',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseAmount: 0,
    salvageValue: 0,
    usefulLifeMonths: 60,
    depreciationMethod: 'STRAIGHT_LINE',
    status: 'ACTIVE',
    location: '',
  });

  const handleBulkDepreciate = () => {
    if (!companyId) {
      toast.error('Seleccione una empresa primero');
      return;
    }
    setShowDepreciateModal('bulk');
  };

  const handleShowHistory = async (assetId: string) => {
    const history = await getAssetHistory(assetId);
    if (history) {
      setViewingHistory(assetId);
      toast.info(`Historial de ${assets.find(a => a.id === assetId)?.name}`);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      assetType: 'OTHER',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseAmount: 0,
      salvageValue: 0,
      usefulLifeMonths: 60,
      depreciationMethod: 'STRAIGHT_LINE',
      status: 'ACTIVE',
      location: '',
    });
    setShowForm(true);
  };

  const openEdit = (asset: FixedAsset) => {
    setEditing(asset);
    setForm({
      name: asset.name,
      assetType: asset.assetType,
      purchaseDate: asset.purchaseDate.split('T')[0],
      purchaseAmount: asset.purchaseAmount,
      salvageValue: asset.salvageValue,
      usefulLifeMonths: asset.usefulLifeMonths,
      depreciationMethod: asset.depreciationMethod,
      status: asset.status,
      location: asset.location || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.assetType || !form.purchaseAmount) {
      toast.error('Nombre, categoría y costo son obligatorios');
      return;
    }

    let success = false;
    if (editing) {
      success = await updateAsset(editing.id, form);
    } else {
      success = await createAsset(form);
    }

    if (success) setShowForm(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      const success = await deleteAsset(deleteId);
      if (success) setDeleteId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Activos Fijos</h2><p className="text-sm text-vintage-600 mt-1">Control de activos fijos y depreciación</p></div>
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={() => handleExport('pdf')} className="gap-2">
            <Calculator className="w-4 h-4" />
            PDF
          </PastelButton>
          <PastelButton variant="outline" onClick={() => handleExport('excel')} className="gap-2">
            <History className="w-4 h-4" />
            Excel
          </PastelButton>
          <PastelButton variant="outline" onClick={handleBulkDepreciate} disabled={depreciating}><Calculator className="w-4 h-4 mr-2" />Depreciar Todos</PastelButton>
          <PastelButton onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nuevo Activo</PastelButton>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <VintageCard><p className="text-xs text-vintage-500">Costo Total</p><p className="text-lg font-bold text-vintage-800">{formatCurrency(summary.totalValue)}</p></VintageCard>
          <VintageCard><p className="text-xs text-vintage-500">Valor en Libros</p><p className="text-lg font-bold text-success">{formatCurrency(summary.bookValue)}</p></VintageCard>
          <VintageCard><p className="text-xs text-vintage-500">Depreciación Acumulada</p><p className="text-lg font-bold text-error">{formatCurrency(summary.totalDepreciation)}</p></VintageCard>
          <VintageCard><p className="text-xs text-vintage-500">Total Activos</p><p className="text-lg font-bold text-vintage-800">{summary.totalAssets}</p></VintageCard>
          <VintageCard><p className="text-xs text-vintage-500">Activos</p><p className="text-lg font-bold text-success">{summary.activeAssets}</p></VintageCard>
          <VintageCard><p className="text-xs text-vintage-500">Depreciados</p><p className="text-lg font-bold text-info">{summary.fullyDepreciated}</p></VintageCard>
        </div>

      <VintageCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-vintage-200 bg-vintage-50/50">
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Activo</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Categoría</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-right">Costo</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-right">Valor en Libros</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-right">Depreciación</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vintage-100">
              {(!assets || assets.length === 0) ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-vintage-500">No hay activos registrados</td></tr>
              ) : (
                (assets || []).map((a: FixedAsset, i: number) => (
                  <motion.tr key={a.id} className="hover:bg-vintage-50 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td className="px-4 py-3"><div><p className="text-sm font-medium text-vintage-800">{a.name}</p><p className="text-xs text-vintage-500">Adq: {formatDate(a.purchaseDate)}</p></div></td>
                    <td className="px-4 py-3 text-sm text-vintage-600">{a.assetType}</td>
                    <td className="px-4 py-3 text-sm text-vintage-700 text-right font-mono">{formatCurrency(a.purchaseAmount)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-success">{formatCurrency(a.currentBookValue)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-error">{formatCurrency(a.accumulatedDepreciation)}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        status={a.status === 'ACTIVE' ? 'success' : a.status === 'FULLY_DEPRECIATED' ? 'info' : 'neutral'}
                        label={getStatusLabel(a.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setSelectedAssetId(a.id); setShowDepreciateModal('single'); }} disabled={a.status !== 'ACTIVE'} className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-600 disabled:opacity-30" title="Calcular depreciación"><TrendingDown className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-600" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleShowHistory(a.id)} className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-600" title="Ver historial"><History className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded-lg hover:bg-error/10 text-vintage-500 hover:text-error" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </VintageCard>

      {showForm && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <motion.div className="relative bg-card rounded-2xl p-6 max-w-2xl w-full shadow-xl border border-vintage-200 overflow-y-auto max-h-[90vh]" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <h3 className="text-lg font-playfair font-bold text-vintage-800 mb-4">{editing ? 'Editar' : 'Nuevo'} Activo Fijo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <FloatingInput label="Nombre del Activo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <div className="relative">
                  <select value={form.assetType} onChange={(e) => setForm({ ...form, assetType: e.target.value as any })} className="peer w-full px-3 pt-5 pb-2 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 appearance-none">
                    <option value="BUILDING">Edificio</option>
                    <option value="FURNITURE">Mobiliario</option>
                    <option value="COMPUTER">Equipo de Cómputo</option>
                    <option value="VEHICLE">Vehículo</option>
                    <option value="MACHINERY">Maquinaria</option>
                    <option value="OTHER">Otro</option>
                  </select>
                  <label className="absolute left-3 top-1.5 text-xs text-vintage-500 font-medium pointer-events-none">Categoría</label>
                </div>
                <FloatingInput label="Costo de Adquisición" type="number" value={form.purchaseAmount} onChange={(e) => setForm({ ...form, purchaseAmount: Number(e.target.value) })} />
                <FloatingInput label="Valor Residual / de Salvamento" type="number" value={form.salvageValue} onChange={(e) => setForm({ ...form, salvageValue: Number(e.target.value) })} />
              </div>
              <div className="space-y-4">
                <FloatingInput label="Fecha de Adquisición" type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
                <FloatingInput label="Vida Útil (Meses)" type="number" value={form.usefulLifeMonths} onChange={(e) => setForm({ ...form, usefulLifeMonths: Number(e.target.value) })} />
                <div className="relative">
                  <select value={form.depreciationMethod} onChange={(e) => setForm({ ...form, depreciationMethod: e.target.value as any })} className="peer w-full px-3 pt-5 pb-2 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 appearance-none">
                    <option value="STRAIGHT_LINE">Línea Recta</option>
                    <option value="DECLINING">Saldos Decrecientes</option>
                  </select>
                  <label className="absolute left-3 top-1.5 text-xs text-vintage-500 font-medium pointer-events-none">Método de Depreciación</label>
                </div>
                <FloatingInput label="Ubicación / Notas" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-vintage-100">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-xl border border-vintage-200 text-vintage-700 hover:bg-vintage-50">Cancelar</button>
              <PastelButton onClick={handleSave}>{editing ? 'Guardar Cambios' : 'Crear Activo'}</PastelButton>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar activo" description="¿Está seguro de eliminar este activo? Esta acción no se puede deshacer y puede afectar los estados financieros." variant="destructive" />

      {showDepreciateModal && (
        <ConfirmDialog
          open={!!showDepreciateModal}
          onClose={() => { setShowDepreciateModal(null); setSelectedAssetId(null); }}
          onConfirm={async () => {
            if (showDepreciateModal === 'single' && selectedAssetId) {
              await depreciateAsset(selectedAssetId, depParams);
            } else if (showDepreciateModal === 'bulk' && companyId) {
              await bulkDepreciate({ ...depParams, companyId });
            }
            setShowDepreciateModal(null);
            setSelectedAssetId(null);
          }}
          title={showDepreciateModal === 'bulk' ? 'Depreciación Masiva' : 'Calcular depreciación'}
          description=""
          variant={showDepreciateModal === 'bulk' ? 'default' : 'default'}
          loading={depreciating}
        >
          <div className="space-y-4 pt-2">
            <p className="text-sm text-vintage-600">
              {showDepreciateModal === 'bulk' 
                ? '¿Está seguro de calcular la depreciación para TODOS los activos activos en el período seleccionado?' 
                : `Seleccione el período para calcular la depreciación de ${assets.find(a => a.id === selectedAssetId)?.name}.`
              }
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FloatingInput 
                label="Año" 
                type="number" 
                value={depParams.year} 
                onChange={(e) => setDepParams({ ...depParams, year: Number(e.target.value) })} 
              />
              <div className="relative">
                <select 
                  value={depParams.month} 
                  onChange={(e) => setDepParams({ ...depParams, month: Number(e.target.value) })} 
                  className="peer w-full px-3 pt-5 pb-2 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 appearance-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es', { month: 'long' })}</option>
                  ))}
                </select>
                <label className="absolute left-3 top-1.5 text-xs text-vintage-500 font-medium pointer-events-none">Mes</label>
              </div>
            </div>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
