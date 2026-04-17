'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { DATA_MGMT } from '@/lib/api/endpoints';
import { toast } from 'sonner';

export interface ImportResponse {
  entityType: string;
  totalRequested: number;
  importedCount: number;
  skipped: number;
}

export function useDataMgmt() {
  const importMutation = useMutation({
    mutationFn: ({ entityType, data }: { entityType: string; data: any[] }) =>
      apiClient.post<ImportResponse>(DATA_MGMT.import, { entityType, data }),
    onSuccess: (res) => {
      toast.success(`${res.importedCount} registros de ${res.entityType} importados correctamente.`);
    },
    onError: () => {
      toast.error('Error al importar los datos. Verifique el formato del archivo.');
    },
  });

  const exportMutation = useMutation({
    mutationFn: ({ title, format }: { title: string; format: string }) =>
      apiClient.get(DATA_MGMT.export, { title, format }),
    onSuccess: () => {
      toast.success('Generando archivo para descarga...');
    },
    onError: () => {
      toast.error('Error al generar la exportación.');
    },
  });

  return {
    importData: importMutation.mutateAsync,
    exportData: exportMutation.mutateAsync,
    isImporting: importMutation.isPending,
    isExporting: exportMutation.isPending,
  };
}
