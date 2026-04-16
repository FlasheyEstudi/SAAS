'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';

const importItems = [
  { title: 'Cuentas Contables', description: 'Importa el plan de cuentas desde Excel o CSV', entity: 'accounts', fields: 'Código, Nombre, Tipo, Naturaleza' },
  { title: 'Terceros', description: 'Importa clientes y proveedores', entity: 'third-parties', fields: 'Nombre, RFC, Tipo, Email, Teléfono' },
  { title: 'Pólizas', description: 'Importa pólizas contables con líneas', entity: 'journal-entries', fields: 'Tipo, Fecha, Descripción, Cuenta, Debe, Haber' },
  { title: 'Facturas', description: 'Importa facturas de venta y compra', entity: 'invoices', fields: 'Número, Tercero, Fecha, Monto, IVA' },
];

const exportItems = [
  { title: 'Balanza de Comprobación', description: 'Exporta la balanza en Excel o PDF', format: 'XLSX / PDF' },
  { title: 'Catálogo de Cuentas', description: 'Exporta el plan de cuentas completo', format: 'XLSX / CSV' },
  { title: 'Pólizas del Período', description: 'Exporta todas las pólizas de un período', format: 'XLSX / PDF' },
  { title: 'Reporte de Terceros', description: 'Exporta estado de cuenta de terceros', format: 'PDF' },
];

export function DataMgmtView() {
  const handleImport = (entity: string) => { toast.info(`Importar ${entity}: función próximamente disponible`); };
  const handleExport = (title: string) => { toast.info(`Exportar ${title}: función próximamente disponible`); };
  const handleTemplate = (entity: string) => { toast.info(`Descargando plantilla para ${entity}...`); };

  return (
    <div className="space-y-8">
      <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Importar / Exportar</h2><p className="text-sm text-vintage-600 mt-1">Transferencia masiva de datos</p></div>

      <div>
        <h3 className="text-lg font-playfair font-semibold text-vintage-800 mb-4 flex items-center gap-2"><Upload className="w-5 h-5 text-vintage-500" />Importar Datos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {importItems.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <VintageCard className="h-full flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-vintage-100 flex items-center justify-center mb-3"><FileSpreadsheet className="w-5 h-5 text-vintage-500" /></div>
                <h4 className="text-sm font-semibold text-vintage-800">{item.title}</h4>
                <p className="text-xs text-vintage-500 mt-1 flex-1">{item.description}</p>
                <p className="text-[10px] text-vintage-400 mt-2 font-mono">{item.fields}</p>
                <div className="flex gap-2 mt-3">
                  <PastelButton variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleImport(item.title)}>Importar</PastelButton>
                  <button onClick={() => handleTemplate(item.entity)} className="px-3 py-1.5 text-xs rounded-lg border border-vintage-200 text-vintage-500 hover:bg-vintage-50 transition-colors">Plantilla</button>
                </div>
              </VintageCard>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-playfair font-semibold text-vintage-800 mb-4 flex items-center gap-2"><Download className="w-5 h-5 text-vintage-500" />Exportar Datos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {exportItems.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 + 0.2 }}>
              <VintageCard className="h-full flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-vintage-100 flex items-center justify-center mb-3"><Download className="w-5 h-5 text-vintage-500" /></div>
                <h4 className="text-sm font-semibold text-vintage-800">{item.title}</h4>
                <p className="text-xs text-vintage-500 mt-1 flex-1">{item.description}</p>
                <div className="flex gap-2 mt-3">
                  <PastelButton variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleExport(item.title)}>Excel</PastelButton>
                  <PastelButton variant="ghost" size="sm" className="text-xs" onClick={() => handleExport(item.title)}>PDF</PastelButton>
                </div>
              </VintageCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
