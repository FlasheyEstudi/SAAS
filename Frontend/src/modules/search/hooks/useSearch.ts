"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { SEARCH } from '@/lib/api/endpoints';

export interface SearchResultItem {
  id: string;
  type: 'journal' | 'invoice' | 'third-party' | 'account' | string;
  title: string;
  subtitle: string;
  amount?: number;
  date?: string;
  view: string;
  params: Record<string, string>;
}

export function useSearch(query: string) {
  const { data, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['search', 'global', query],
    queryFn: () => apiClient.get<any>(`${SEARCH.global}?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
    retry: false,
  });

  const transformResults = (backendData: any): SearchResultItem[] => {
    if (!backendData?.results || !Array.isArray(backendData.results)) return [];

    const finalResults: SearchResultItem[] = [];

    backendData.results.forEach((group: any) => {
      group.items.forEach((item: any) => {
        let transformed: SearchResultItem | null = null;

        switch (group.entityType) {
          case 'JournalEntry':
            transformed = {
              id: item.id,
              type: 'Póliza',
              title: item.description,
              subtitle: `Póliza #${item.entryNumber} · ${item.entryType}`,
              amount: item.totalDebit,
              date: item.entryDate,
              view: 'journal-detail',
              params: { id: item.id }
            };
            break;
          case 'Invoice':
            transformed = {
              id: item.id,
              type: 'Factura',
              title: item.description || `Factura ${item.number}`,
              subtitle: `${item.invoiceType === 'SALE' ? 'Venta' : 'Compra'} · ${item.status}`,
              amount: Number(item.totalAmount),
              date: item.issueDate,
              view: 'invoice-detail',
              params: { id: item.id }
            };
            break;
          case 'ThirdParty':
            transformed = {
              id: item.id,
              type: 'Tercero',
              title: item.name,
              subtitle: `${item.taxId} · ${item.type}`,
              view: 'third-parties',
              params: { id: item.id }
            };
            break;
          case 'Account':
            transformed = {
              id: item.id,
              type: 'Cuenta',
              title: `${item.code} - ${item.name}`,
              subtitle: item.accountType,
              view: 'accounts',
              params: { id: item.id }
            };
            break;
          case 'User':
            transformed = {
              id: item.id,
              type: 'Usuario',
              title: item.name,
              subtitle: `${item.email} · ${item.role}`,
              view: 'users',
              params: { id: item.id }
            };
            break;
        }

        if (transformed) finalResults.push(transformed);
      });
    });

    return finalResults;
  };

  return {
    results: transformResults(data),
    isLoading,
    error: error ? (error as any).error || 'Error al buscar' : null,
    refetch,
  };
}
