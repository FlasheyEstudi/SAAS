'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { JOURNAL, ACCOUNTS, COST_CENTERS, PERIODS } from '@/lib/api/endpoints';
import type { JournalEntry, JournalEntryLine, Account, CostCenter, Period, ValidationResponse } from '@/lib/api/types';

export interface CreateJournalEntryData {
  description: string;
  entryDate: string;
  entryType: string;
  periodId: string;
  lines: Array<{
    accountId: string;
    costCenterId?: string;
    description: string;
    debit: number;
    credit: number;
  }>;
}

export interface UpdateJournalEntryData extends CreateJournalEntryData {
  id: string;
}

/**
 * Hook for journal entries - consumes real Backend APIs
 */
export function useJournalEntries() {
  const queryClient = useQueryClient();

  // Fetch journal entries list
  const { data: entriesData, isLoading: entriesLoading, error: entriesError } = useQuery<{ entries: JournalEntry[] }>({
    queryKey: ['journal-entries', 'list'],
    queryFn: () => apiClient.get<{ entries: JournalEntry[] }>(JOURNAL.list),
    retry: false,
  });

  // Fetch accounts tree
  const { data: accountsData, isLoading: accountsLoading } = useQuery<{ accounts: Account[] }>({
    queryKey: ['accounts', 'tree'],
    queryFn: () => apiClient.get<{ accounts: Account[] }>(ACCOUNTS.tree),
    retry: false,
  });

  // Fetch cost centers
  const { data: costCentersData, isLoading: costCentersLoading } = useQuery<{ costCenters: CostCenter[] }>({
    queryKey: ['cost-centers', 'list'],
    queryFn: () => apiClient.get<{ costCenters: CostCenter[] }>(COST_CENTERS.list),
    retry: false,
  });

  // Fetch periods
  const { data: periodsData, isLoading: periodsLoading } = useQuery<{ periods: Period[] }>({
    queryKey: ['periods', 'list'],
    queryFn: () => apiClient.get<{ periods: Period[] }>(PERIODS.list),
    retry: false,
  });

  // Create journal entry mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateJournalEntryData) => apiClient.post<JournalEntry>(JOURNAL.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });

  // Update journal entry mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateJournalEntryData) => apiClient.put<JournalEntry>(JOURNAL.update(data.id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });

  // Delete journal entry mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(JOURNAL.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });

  // Post journal entry mutation
  const postMutation = useMutation({
    mutationFn: (id: string) => apiClient.post<JournalEntry>(JOURNAL.post(id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });

  // Validate journal entry mutation
  const validateMutation = useMutation({
    mutationFn: (data: CreateJournalEntryData) => apiClient.post<ValidationResponse>(JOURNAL.validate, data),
  });

  return {
    entries: entriesData?.entries || [],
    accounts: accountsData?.accounts || [],
    costCenters: costCentersData?.costCenters || [],
    periods: periodsData?.periods || [],
    isLoading: entriesLoading || accountsLoading || costCentersLoading || periodsLoading,
    error: entriesError,
    createEntry: createMutation.mutateAsync,
    updateEntry: updateMutation.mutateAsync,
    deleteEntry: deleteMutation.mutateAsync,
    postEntry: postMutation.mutateAsync,
    validateEntry: validateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPosting: postMutation.isPending,
    isValidating: validateMutation.isPending,
  };
}

/**
 * Hook for single journal entry detail
 */
export function useJournalEntry(id: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<JournalEntry>({
    queryKey: ['journal-entries', id],
    queryFn: () => apiClient.get<JournalEntry>(JOURNAL.get(id)),
    enabled: !!id,
    retry: false,
  });

  return {
    entry: data,
    isLoading,
    error,
  };
}
