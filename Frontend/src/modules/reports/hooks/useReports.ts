'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { REPORTS } from '@/lib/api/endpoints';

import { useAppStore } from '@/lib/stores/useAppStore';

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  thirdPartyId?: string;
  periodId?: string;
}

/**
 * Hook for reports - consumes real Backend APIs
 */
export function useReports(year?: number | string, month?: number | string) {
  const companyId = useAppStore(s => s.companyId);

  const queryParams = { 
    ...(companyId ? { companyId } : {}),
    ...(year ? { year } : {}),
    ...(month ? { month } : {})
  };

  // Trial Balance report
  const { data: trialBalance, isLoading: trialBalanceLoading } = useQuery({
    queryKey: ['reports', 'trial-balance', queryParams],
    queryFn: () => apiClient.get(REPORTS.trialBalance, queryParams),
    retry: false,
  });

  // Balance Sheet report
  const { data: balanceSheet, isLoading: balanceSheetLoading } = useQuery({
    queryKey: ['reports', 'balance-sheet', queryParams],
    queryFn: () => apiClient.get(REPORTS.balanceSheet, queryParams),
    retry: false,
  });

  // Income Statement report
  const { data: incomeStatement, isLoading: incomeStatementLoading } = useQuery({
    queryKey: ['reports', 'income-statement', queryParams],
    queryFn: () => apiClient.get(REPORTS.incomeStatement, queryParams),
    retry: false,
  });

  // Cash Flow report
  const { data: cashFlow, isLoading: cashFlowLoading } = useQuery({
    queryKey: ['reports', 'cash-flow', queryParams],
    queryFn: () => apiClient.get(REPORTS.cashFlow, queryParams),
    retry: false,
  });

  // General Ledger report
  const { data: generalLedger, isLoading: generalLedgerLoading } = useQuery({
    queryKey: ['reports', 'general-ledger', queryParams],
    queryFn: () => apiClient.get(REPORTS.generalLedger, queryParams),
    retry: false,
  });

  return {
    trialBalance,
    balanceSheet,
    incomeStatement,
    cashFlow,
    generalLedger,
    isLoading: trialBalanceLoading || balanceSheetLoading || incomeStatementLoading || cashFlowLoading || generalLedgerLoading,
  };
}
