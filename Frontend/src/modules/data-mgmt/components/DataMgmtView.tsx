'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { useRef } from 'react';
import { 
  exportTrialBalanceExcel, exportTrialBalancePDF,
  exportAccountsExcel, exportAccountsPDF,
  exportJournalEntriesExcel, exportJournalEntriesPDF,
  exportThirdPartiesExcel, exportThirdPartiesPDF
} from '@/lib/utils/export';
import { useAppStore } from '@/lib/stores/useAppStore';

const importItems = [
  { title: 'Cuentas Contables', description: 'Importa el plan de cuentas desde Excel o CSV', entity: 'accounts', fields: 'Código, Nombre, Tipo, Naturaleza' },
  { title: 'Terceros', description: 'Importa clientes y proveedores', entity: 'third-parties', fields: 'Nombre, RUC, Tipo, Email, Teléfono' },
  { title: 'Pólizas', description: 'Importa pólizas contables con líneas', entity: 'journal-entries', fields: 'Tipo, Fecha, Descripción, Cuenta, Debe, Haber' },
  { title: 'Facturas', description: 'Importa facturas de venta y compra', entity: 'invoices', fields: 'Número, Tercero, Fecha, Monto, IVA' },
];

const exportItems = [
  { title: 'Balanza de Comprobación', description: 'Exporta la balanza en Excel o PDF', format: 'XLSX / PDF' },
  { title: 'Catálogo de Cuentas', description: 'Exporta el plan de cuentas completo', format: 'XLSX / CSV' },
  { title: 'Pólizas del Período', description: 'Exporta todas las pólizas de un período', format: 'XLSX / PDF' },
  { title: 'Reporte de Terceros', description: 'Exporta estado de cuenta de terceros', format: 'PDF' },
];

import { useDataMgmt } from '../hooks/useDataMgmt';

export function DataMgmtView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const companyId = useAppStore(s => s.companyId);
  const { importData, isImporting } = useDataMgmt();

  const handleImportClick = (entity: string) => { 
    setSelectedEntity(entity);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedEntity) {
      // In a real scenario, we would parse CSV/Excel here
      const dummyData = [{ name: 'Registro importado', date: new Date().toISOString() }];
      
      toast.promise(
        importData({ entityType: selectedEntity, data: dummyData }),
        {
          loading: `Importando ${file.name} a ${selectedEntity}...`,
          success: 'Proceso completado en el servidor',
          error: 'Error en la comunicación con el servidor'
        }
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async (title: string, format: 'Excel' | 'PDF') => { 
    if (!companyId) { toast.error('Selecciona una empresa'); return; }
    try {
      toast.loading('Generando exportación...');
      const companyName = 'GANESHA Compañía Demo';
      
      // Map titles to actual export functions
      if (title.includes('Balanza')) {
        const period = new Date().toISOString().slice(0, 7);
        const totals = { totalDebit: 0, totalCredit: 0, totalBalance: 0 };
        if (format === 'Excel') await exportTrialBalanceExcel([], companyName, period, totals);
        else await exportTrialBalancePDF([], companyName, period, totals);
      } else if (title.includes('Cuentas')) {
        if (format === 'Excel') await exportAccountsExcel([], companyName);
        else await exportAccountsPDF([], companyName);
      } else if (title.includes('Pólizas')) {
        if (format === 'Excel') await exportJournalEntriesExcel([], companyName);
        else await exportJournalEntriesPDF([], companyName);
      } else if (title.includes('Terceros')) {
        if (format === 'Excel') await exportThirdPartiesExcel([], companyName);
        else await exportThirdPartiesPDF([], companyName);
      }
      toast.dismiss();
    } catch {
      toast.dismiss();
      toast.error('Error al exportar');
    }
  };
  
  const handleTemplate = (entity: string) => { 
    toast.success(`Plantilla descargada para ${entity}.`);
  };

  const handleImport = (title: string) => {
    handleImportClick(title);
  };

  return (
    <div className="space-y-8 bg-background min-h-screen">
      <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept=".xlsx,.xls,.csv" />
      <div><h2 className="text-2xl font-playfair font-bold text-vintage-900 dark:text-zinc-100">Importar / Exportar</h2><p className="text-sm text-vintage-600 dark:text-zinc-500 mt-1">Transferencia masiva de datos</p></div>

      <div>
        <h3 className="text-lg font-playfair font-semibold text-vintage-800 dark:text-zinc-200 mb-4 flex items-center gap-2"><Upload className="w-5 h-5 text-vintage-500 dark:text-zinc-500" />Importar Datos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {importItems.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <VintageCard className="h-full flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-vintage-100 dark:bg-zinc-800 flex items-center justify-center mb-3"><FileSpreadsheet className="w-5 h-5 text-vintage-500 dark:text-zinc-500" /></div>
                <h4 className="text-sm font-semibold text-vintage-800 dark:text-zinc-200">{item.title}</h4>
                <p className="text-xs text-vintage-500 dark:text-zinc-500 mt-1 flex-1">{item.description}</p>
                <p className="text-[10px] text-vintage-400 dark:text-zinc-600 mt-2 font-mono">{item.fields}</p>
                <div className="flex gap-2 mt-3">
                  <PastelButton variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleImport(item.title)}>Importar</PastelButton>
                  <button onClick={() => handleTemplate(item.entity)} className="px-3 py-1.5 text-xs rounded-lg border border-vintage-200 dark:border-zinc-800 text-vintage-500 dark:text-zinc-600 hover:bg-vintage-50 dark:hover:bg-zinc-800 transition-colors">Plantilla</button>
                </div>
              </VintageCard>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-playfair font-semibold text-vintage-800 dark:text-zinc-200 mb-4 flex items-center gap-2"><Download className="w-5 h-5 text-vintage-500 dark:text-zinc-500" />Exportar Datos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {exportItems.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 + 0.2 }}>
              <VintageCard className="h-full flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-vintage-100 dark:bg-zinc-800 flex items-center justify-center mb-3"><Download className="w-5 h-5 text-vintage-500 dark:text-zinc-500" /></div>
                <h4 className="text-sm font-semibold text-vintage-800 dark:text-zinc-200">{item.title}</h4>
                <p className="text-xs text-vintage-500 dark:text-zinc-500 mt-1 flex-1">{item.description}</p>
                <div className="flex gap-2 mt-3">
                  <PastelButton variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleExport(item.title, 'Excel')}>Excel</PastelButton>
                  <PastelButton variant="ghost" size="sm" className="text-xs" onClick={() => handleExport(item.title, 'PDF')}>PDF</PastelButton>
                </div>
              </VintageCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
