import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { JOURNAL, ACCOUNTS, COST_CENTERS, PERIODS } from '@/lib/api/endpoints';
import type { JournalEntry, JournalEntryLine, Account, CostCenter, Period, ValidationResponse } from '@/lib/api/types';
import { useAppStore } from '@/lib/stores/useAppStore';

export interface CreateJournalEntryData {
  description: string;
  entryDate: string;
  entryType: string;
  periodId: string;
  companyId?: string; // Optional in UI, hook will inject it
  status?: 'DRAFT' | 'POSTED';
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
 * Hook for journal entries - consumes real Backend APIs with Pagination and Filters
 */
export function useJournalEntries() {
  const queryClient = useQueryClient();
  const companyId = useAppStore(s => s.companyId);

  // Filter and Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch journal entries list with pagination and filters
  const { data: entriesData, isLoading: entriesLoading, error: entriesError } = useQuery<{ 
    data: JournalEntry[], 
    pagination: { total: number, totalPages: number } 
  }>({
    queryKey: ['journal-entries', 'list', companyId, page, search, typeFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        companyId: companyId || '',
      });
      if (search) params.append('search', search);
      if (typeFilter) params.append('entryType', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      return apiClient.get<{ data: JournalEntry[], pagination: { total: number, totalPages: number } }>(
        `${JOURNAL.list}?${params.toString()}`
      );
    },
    enabled: !!companyId,
    retry: false,
    staleTime: 30000, // 30 seconds cache
  });

  // Fetch accounts tree (static-ish, high cache)
  const { data: accountsData, isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['accounts', 'tree', companyId],
    queryFn: () => apiClient.get<Account[]>(`${ACCOUNTS.tree}?companyId=${companyId}`),
    enabled: !!companyId,
    staleTime: 300000, // 5 minutes
  });

  const { data: costCentersData, isLoading: costCentersLoading } = useQuery<{ data: CostCenter[] }>({
    queryKey: ['cost-centers', 'list', companyId],
    queryFn: () => apiClient.get<{ data: CostCenter[] }>(`${COST_CENTERS.list}?companyId=${companyId}`),
    enabled: !!companyId,
  });

  const { data: periodsData, isLoading: periodsLoading } = useQuery<{ data: Period[] }>({
    queryKey: ['periods', 'list', companyId],
    queryFn: () => apiClient.get<{ data: Period[] }>(`${PERIODS.list}?companyId=${companyId}`),
    enabled: !!companyId,
  });

  // Mutations (unchanged but ensured they invalidate correct keys)
  const createMutation = useMutation({
    mutationFn: (data: CreateJournalEntryData) => {
      const finalData = { ...data, companyId: data.companyId || companyId || '' };
      return apiClient.post<JournalEntry>(JOURNAL.create, finalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateJournalEntryData) => {
      const finalData = { ...data, companyId: data.companyId || companyId || '' };
      return apiClient.put<JournalEntry>(JOURNAL.update(data.id), finalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(JOURNAL.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });

  const postMutation = useMutation({
    mutationFn: (id: string) => apiClient.post<JournalEntry>(JOURNAL.post(id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });

  const validateMutation = useMutation({
    mutationFn: (data: CreateJournalEntryData) => apiClient.post<ValidationResponse>(JOURNAL.validate, data),
  });

  return {
    entries: entriesData?.data || [],
    pagination: entriesData?.pagination,
    total: entriesData?.pagination?.total || 0,
    totalPages: entriesData?.pagination?.totalPages || 1,
    page,
    limit,
    search,
    typeFilter,
    statusFilter,
    setPage,
    setSearch,
    setTypeFilter,
    setStatusFilter,
    clearFilters: () => {
      setSearch('');
      setTypeFilter('');
      setStatusFilter('');
      setPage(1);
    },
    accounts: accountsData || [],
    costCenters: costCentersData?.data || [],
    periods: periodsData?.data || [],
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
    getEntry: useCallback((id: string) => entriesData?.data?.find(e => e.id === id), [entriesData]),
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
