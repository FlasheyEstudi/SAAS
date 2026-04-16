import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { AUDIT } from '@/lib/api/endpoints';
import { toast } from 'sonner';

export interface AuditLog {
  id: string;
  userId: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface AuditStats {
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByEntity: Record<string, number>;
  topUsers: Array<{ user: string; count: number }>;
  recentActivity: number;
}

export function useAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(AUDIT.list);
      setLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('No se pudieron cargar los registros de auditoría');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get(AUDIT.stats);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    }
  }, []);

  const exportLogs = useCallback(async (format: 'csv' | 'pdf' = 'csv') => {
    try {
      setExporting(true);
      const response = await apiClient.get(`${AUDIT.export}?format=${format}`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Registros exportados correctamente`);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast.error('No se pudieron exportar los registros');
    } finally {
      setExporting(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  return {
    logs,
    stats,
    loading,
    exporting,
    refreshLogs: fetchLogs,
    exportLogs,
  };
}
