'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { REPORTS } from '@/lib/api/endpoints';

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
export function useReports() {
  // Trial Balance report
  const { data: trialBalance, isLoading: trialBalanceLoading } = useQuery({
    queryKey: ['reports', 'trial-balance'],
    queryFn: () => apiClient.get(REPORTS.trialBalance),
    retry: false,
  });

  // Balance Sheet report
  const { data: balanceSheet, isLoading: balanceSheetLoading } = useQuery({
    queryKey: ['reports', 'balance-sheet'],
    queryFn: () => apiClient.get(REPORTS.balanceSheet),
    retry: false,
  });

  // Income Statement report
  const { data: incomeStatement, isLoading: incomeStatementLoading } = useQuery({
    queryKey: ['reports', 'income-statement'],
    queryFn: () => apiClient.get(REPORTS.incomeStatement),
    retry: false,
  });

  // Cash Flow report
  const { data: cashFlow, isLoading: cashFlowLoading } = useQuery({
    queryKey: ['reports', 'cash-flow'],
    queryFn: () => apiClient.get(REPORTS.cashFlow),
    retry: false,
  });

  // General Ledger report
  const { data: generalLedger, isLoading: generalLedgerLoading } = useQuery({
    queryKey: ['reports', 'general-ledger'],
    queryFn: () => apiClient.get(REPORTS.generalLedger),
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
