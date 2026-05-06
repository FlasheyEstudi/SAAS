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
    pagination: { total: number, totalPages: number },
    stats: { POSTED: number, DRAFT: number, totalDebit: number, totalCredit: number }
  }>({
    queryKey: ['journal-entries', 'list', companyId, page, search, typeFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        companyId: companyId || '',
        includeLines: 'true', // We'll include lines for now to fix reports easily
      });
      if (search) params.append('search', search);
      if (typeFilter) params.append('entryType', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      return apiClient.get<{ data: JournalEntry[], pagination: { total: number, totalPages: number }, stats: any }>(
        `${JOURNAL.list}?${params.toString()}`
      );
    },
    enabled: !!companyId,
    retry: false,
    staleTime: 30000, // 30 seconds cache
  });

  // Fetch flat accounts list for selection
  const { data: accountsData, isLoading: accountsLoading } = useQuery<any>({
    queryKey: ['accounts', 'list', companyId],
    queryFn: () => apiClient.get<any>(`${ACCOUNTS.list}?companyId=${companyId}&limit=1000`),
    enabled: !!companyId,
  });

  const { data: costCentersData, isLoading: costCentersLoading } = useQuery<any>({
    queryKey: ['cost-centers', 'list', companyId],
    queryFn: () => apiClient.get<any>(`${COST_CENTERS.list}?companyId=${companyId}`),
    enabled: !!companyId,
  });

  const { data: periodsData, isLoading: periodsLoading } = useQuery<any>({
    queryKey: ['periods', 'list', companyId],
    queryFn: () => apiClient.get<any>(`${PERIODS.list}?companyId=${companyId}`),
    enabled: !!companyId,
  });

  // Mutations (unchanged but ensured they invalidate correct keys)
  const createMutation = useMutation({
    mutationFn: async (data: CreateJournalEntryData) => {
      const finalData = { ...data, companyId: data.companyId || companyId || '' };
      const res = await apiClient.post<any>(JOURNAL.create, finalData);
      return res?.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateJournalEntryData) => {
      const finalData = { ...data, companyId: data.companyId || companyId || '' };
      return apiClient.put<JournalEntry>(JOURNAL.update(data.id), finalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(JOURNAL.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
    },
  });

  const postMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<any>(JOURNAL.post(id), {});
      return res?.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
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
    stats: entriesData?.stats || { POSTED: 0, DRAFT: 0, totalDebit: 0, totalCredit: 0 },
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
    accounts: (Array.isArray(accountsData?.data?.data) ? accountsData.data.data : (Array.isArray(accountsData?.data) ? accountsData.data : [])) as Account[],
    costCenters: (Array.isArray(costCentersData?.data?.data) ? costCentersData.data.data : (Array.isArray(costCentersData?.data) ? costCentersData.data : [])) as CostCenter[],
    periods: (Array.isArray(periodsData?.data?.data) ? periodsData.data.data : (Array.isArray(periodsData?.data) ? periodsData.data : [])) as Period[],
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

  const { data: entryData, isLoading, error } = useQuery<any>({
    queryKey: ['journal-entries', id],
    queryFn: async () => {
      const res = await apiClient.get<any>(JOURNAL.get(id));
      return res?.data || res;
    },
    enabled: !!id,
    retry: false,
  });

  return {
    entry: entryData,
    isLoading,
    error,
  };
}
