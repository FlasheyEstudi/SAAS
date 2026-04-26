import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { AUDIT } from '@/lib/api/endpoints';
import { toast } from 'sonner';

export interface AuditLog {
  id: string;
  userId: string;
  companyId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  action: string;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  changes?: any;
  previousData?: any;
  createdAt: string;
}

export interface AuditStats {
  totalActions: number;
  byAction: Record<string, number>;
  byUser: Array<{ userId: string; userName: string; count: number }>;
  byDayLast30: Record<string, number>;
}

export function useAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>(AUDIT.list);
      // Handle paginated response: { data: [...], pagination: {...} }
      const data = response?.data || response || [];
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('No se pudieron cargar los registros de auditoría');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<any>(AUDIT.stats);
      setStats(response?.data || response || null);
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    }
  }, []);

  const fetchLogDetail = useCallback(async (id: string) => {
    try {
      setDetailLoading(true);
      const response = await apiClient.get<AuditLog>(AUDIT.get(id));
      setSelectedLog(response as AuditLog);
      return response;
    } catch (error) {
      console.error('Error fetching audit detail:', error);
      toast.error('No se pudo cargar el detalle');
      return null;
    } finally {
      setDetailLoading(false);
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
    selectedLog,
    detailLoading,
    refreshLogs: fetchLogs,
    fetchLogDetail,
    setSelectedLog,
  };
}
