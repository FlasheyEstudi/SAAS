'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { SYSTEM } from '@/lib/api/endpoints';

export interface SystemStats {
  entities: {
    companies: number;
    periods: number;
    accounts: number;
    costCenters: number;
    journalEntries: number;
    invoices: number;
    bankAccounts: number;
    bankMovements: number;
    thirdParties: number;
    users: number;
    auditLogs: number;
    fixedAssets: number;
    budgets: number;
    notifications: number;
    attachments: number;
    exchangeRates: number;
  };
  accounting: {
    draftEntries: number;
    postedEntries: number;
    openPeriods: number;
    draftRatio: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  notifications: {
    total: number;
    unread: number;
  };
  lastUpdated: string;
}

export interface SystemHealth {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  checks: {
    name: string;
    status: 'ok' | 'warning' | 'error';
    detail: string;
  }[];
  timestamp: string;
}

export function useSystem() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<SystemStats>({
    queryKey: ['system', 'stats'],
    queryFn: () => apiClient.get<SystemStats>(SYSTEM.stats),
  });

  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery<SystemHealth>({
    queryKey: ['system', 'health'],
    queryFn: () => apiClient.get<SystemHealth>(SYSTEM.health),
    refetchInterval: 60000, // Every minute
  });

  return {
    stats,
    health,
    isLoading: statsLoading || healthLoading,
    refresh: () => {
      refetchStats();
      refetchHealth();
    },
  };
}
