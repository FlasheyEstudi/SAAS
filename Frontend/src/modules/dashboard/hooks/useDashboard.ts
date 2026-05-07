'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { DASHBOARD, JOURNAL, INVOICES, NOTIFICATIONS } from '@/lib/api/endpoints';
import type { DashboardKPIs, JournalEntry, Invoice } from '@/lib/api/types';

export interface RevenueTrendItem {
  month: string;
  ingresos: number;
  egresos: number;
  utilidad: number;
}

export interface ExpenseCategoryItem {
  categoria: string;
  monto: number;
  color: string;
}

export interface TopClientItem {
  id: string;
  nombre: string;
  totalFacturado: number;
  facturasPagadas: number;
  facturasPendientes: number;
  initials: string;
  color: string;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  revenueTrend: RevenueTrendItem[];
  expenseCategories: ExpenseCategoryItem[];
  recentJournalEntries: JournalEntry[];
  recentInvoices: Invoice[];
  topClients: TopClientItem[];
  unreadNotifications: any[];
}

import { useAppStore } from '@/lib/stores/useAppStore';

/**
 * Dashboard hook - consumes real Backend APIs
 */
export function useDashboard(consolidated = false, year?: number, month?: number) {
  const companyId = useAppStore(s => s.companyId);

  const queryParams = { 
    consolidated,
    ...(companyId ? { companyId } : {}),
    ...(year ? { year } : {}),
    ...(month ? { month } : {})
  };

  // Fetch KPIs from backend
  const { data: kpisData, isLoading: kpisLoading, error: kpisError } = useQuery<DashboardKPIs>({
    queryKey: ['dashboard', 'kpis', queryParams],
    queryFn: () => apiClient.get<DashboardKPIs>(DASHBOARD.kpis, queryParams),
    retry: false,
  });

  // Fetch recent journal entries
  const { data: journalData, isLoading: journalLoading } = useQuery<{ entries: JournalEntry[] }>({
    queryKey: ['journal-entries', 'list', { limit: 5, ...queryParams }],
    queryFn: () => apiClient.get<{ entries: JournalEntry[] }>(JOURNAL.list, { limit: 5, ...queryParams }),
    retry: false,
  });

  // Fetch recent invoices
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery<{ invoices: Invoice[] }>({
    queryKey: ['invoices', 'list', { limit: 5, ...queryParams }],
    queryFn: () => apiClient.get<{ invoices: Invoice[] }>(INVOICES.list, { limit: 5, ...queryParams }),
    retry: false,
  });

  // Fetch period overview for trends
  const { data: periodData, isLoading: periodLoading } = useQuery<any>({
    queryKey: ['dashboard', 'period-overview', queryParams],
    queryFn: () => apiClient.get(DASHBOARD.periodOverview, queryParams),
    retry: false,
  });

  // Fetch cash positions
  const { data: cashData, isLoading: cashLoading } = useQuery<any>({
    queryKey: ['dashboard', 'cash-positions', queryParams],
    queryFn: () => apiClient.get(DASHBOARD.cashPositions, queryParams),
    retry: false,
  });

  // Fetch receivables summary
  const { data: receivablesData, isLoading: receivablesLoading } = useQuery<any>({
    queryKey: ['dashboard', 'receivables-summary', queryParams],
    queryFn: () => apiClient.get(DASHBOARD.receivablesSummary, queryParams),
    retry: false,
  });

  // Fetch payables summary
  const { data: payablesData, isLoading: payablesLoading } = useQuery<any>({
    queryKey: ['dashboard', 'payables-summary', queryParams],
    queryFn: () => apiClient.get(DASHBOARD.payablesSummary, queryParams),
    retry: false,
  });

  // Fetch top customers
  const { data: customersData, isLoading: customersLoading } = useQuery<any>({
    queryKey: ['dashboard', 'top-customers', queryParams],
    queryFn: () => apiClient.get(DASHBOARD.topCustomers, queryParams),
    retry: false,
  });

  // Fetch unread notifications for "Smart Alerts"
  const { data: notificationsData } = useQuery<any>({
    queryKey: ['notifications', 'unread', { companyId, isRead: false }],
    queryFn: () => apiClient.get(NOTIFICATIONS.list, { companyId, isRead: 'false', limit: 3, sortBy: 'createdAt', sortOrder: 'desc' }),
    enabled: !!companyId,
    refetchInterval: 60000, 
  });

  const isLoading = kpisLoading || journalLoading || invoicesLoading || periodLoading || cashLoading || receivablesLoading || payablesLoading || customersLoading;
  const error = kpisError;

  // Transform backend data to frontend format
  const data: DashboardData | undefined = kpisData ? {
    kpis: kpisData,
    revenueTrend: periodData?.trends || [],
    expenseCategories: periodData?.expenseCategories || [],
    recentJournalEntries: (journalData as any)?.data || [],
    recentInvoices: (invoicesData as any)?.data || [],
    topClients: customersData?.customers || [],
    unreadNotifications: (notificationsData as any)?.data || [],
  } : undefined;

  return {
    data,
    isLoading,
    error: error ? (error as any).error || 'Error al cargar dashboard' : null,
  };
}
