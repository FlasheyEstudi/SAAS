'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, MapPin, Phone, Mail, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { StatusBadge, ConfirmDialog, EmptyState } from '@/components/ui/vintage-ui';
import { formatCurrency } from '@/lib/utils/format';

import { useCompanies } from '../hooks/useCompanies';
import { useAppStore } from '@/lib/stores/useAppStore';

export function CompaniesView() {
  const { currentCompany, setCurrentCompany, setSidebarCollapsed } = useAppStore();
  const { companies, isLoading: loading, createCompany, updateCompany, deleteCompany, isCreating, isUpdating, isDeleting } = useCompanies();
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', taxId: '', address: '', phone: '', email: '', currency: 'MXN', parentId: '' });

  const openCreate = () => { setEditingCompany(null); setForm({ name: '', taxId: '', address: '', phone: '', email: '', currency: 'MXN', parentId: '' }); setShowForm(true); };
  const openEdit = (c: any) => { setEditingCompany(c); setForm({ name: c.name, taxId: c.taxId, address: c.address, phone: c.phone, email: c.email, currency: c.currency, parentId: c.parentId || '' }); setShowForm(true); };
  const handleSave = () => {
    if (!form.name || !form.taxId) { 
      toast.error('Nombre y RUC son obligatorios'); 
      return; 
    }
    
    const companyData = {
      name: form.name,
      taxId: form.taxId,
      address: form.address || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      currency: form.currency,
      parentId: form.parentId || undefined,
    };
    
    if (editingCompany) {
      updateCompany({ id: editingCompany.id, data: companyData });
    } else {
      createCompany(companyData);
    }
    
    setShowForm(false);
  };
  const handleDelete = () => {
    if (deleteId) { 
      deleteCompany(deleteId);
      setDeleteId(null); 
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-vintage-900">Empresas</h2>
          <p className="text-sm text-vintage-600 mt-1">Gestión de empresas del sistema</p>
        </div>
        <PastelButton onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nueva Empresa</PastelButton>
      </div>

      {companies.length === 0 ? (
        <EmptyState icon={<Building2 className="w-8 h-8" />} title="Sin empresas" description="Crea tu primera empresa para comenzar" action={<PastelButton onClick={openCreate}>Crear empresa</PastelButton>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
          {companies.map((company) => (
            <VintageCard key={company.id} className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vintage-300 to-vintage-400 flex items-center justify-center text-white shadow-sm">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-vintage-800 text-sm">{company.name}</h3>
                      {company.parentId && <span className="bg-vintage-100 text-[10px] px-1.5 py-0.5 rounded-full text-vintage-500 font-medium">Sucursal</span>}
                    </div>
                    <p className="text-xs text-vintage-500 font-mono">{company.taxId}</p>
                    {company.parentId && companies.find(p => p.id === company.parentId) && (
                      <p className="text-[10px] text-vintage-400 mt-0.5">Padre: {companies.find(p => p.id === company.parentId)?.name}</p>
                    )}
                  </div>
                </div>
                <StatusBadge status={currentCompany?.id === company.id ? 'success' : 'neutral'} label={currentCompany?.id === company.id ? 'Actual' : 'Disponible'} size="sm" />
              </div>
              <div className="space-y-2 text-xs text-vintage-600 mb-4">
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-vintage-400" />{company.address}</div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-vintage-400" />{company.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-vintage-400" />{company.email}</div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-vintage-100">
                <span className="text-xs font-medium text-vintage-500">Moneda: {company.currency}</span>
                <div className="flex gap-1">
                  {currentCompany?.id !== company.id && (
                    <button
                      onClick={() => {
                        setCurrentCompany(company);
                        toast.success(`Estás ahora en: ${company.name}`);
                      }}
                      className="px-2 py-1 mr-2 text-[10px] uppercase font-bold tracking-widest rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      Elegir
                    </button>
                  )}
                  <button
                  onClick={() => openEdit(company)}
                  title="Editar empresa"
                  aria-label="Editar empresa"
                  className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-500 hover:text-vintage-700 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteId(company.id)}
                  title="Eliminar empresa"
                  aria-label="Eliminar empresa"
                  className="p-1.5 rounded-lg hover:bg-error/10 text-vintage-500 hover:text-error transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                </div>
              </div>
            </VintageCard>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <motion.div className="relative bg-card rounded-2xl p-6 max-w-lg w-full shadow-xl border border-vintage-200" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <h3 className="text-lg font-playfair font-bold text-vintage-800 mb-4">{editingCompany ? 'Editar' : 'Nueva'} Empresa</h3>
            <div className="space-y-4">
              <FloatingInput label="Nombre de la empresa" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <FloatingInput label="RUC" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
              <FloatingInput label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <FloatingInput label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <FloatingInput label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <FloatingSelect label="Moneda" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
              </FloatingSelect>
              
              <FloatingSelect label="Empresa Padre (Opcional)" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <option value="">Ninguna (Empresa Principal)</option>
                {companies.filter(c => c.id !== editingCompany?.id && !c.parentId).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </FloatingSelect>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-xl border border-vintage-200 text-vintage-700 hover:bg-vintage-50">Cancelar</button>
              <PastelButton onClick={handleSave} disabled={isCreating || isUpdating}>
                {isCreating ? 'Creando...' : isUpdating ? 'Guardando...' : editingCompany ? 'Guardar' : 'Crear'}
              </PastelButton>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar empresa" description="¿Estás seguro de eliminar esta empresa? Esta acción no se puede deshacer." variant="destructive" />
    </div>
  );
}

function FloatingSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className="peer w-full px-3 pt-5 pb-2 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 appearance-none"
      >
        {children}
      </select>
      <label className="absolute left-3 top-1.5 text-xs text-vintage-500 font-medium pointer-events-none">{label}</label>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-vintage-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
    </div>
  );
}
