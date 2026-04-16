import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { ASSETS } from '@/lib/api/endpoints';
import { toast } from 'sonner';

export interface FixedAsset {
  id: string;
  name: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  residualValue: number;
  usefulLifeMonths: number;
  depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
  currentBookValue: number;
  accumulatedDepreciation: number;
  status: 'ACTIVE' | 'DISPOSED' | 'FULLY_DEPRECIATED';
  serialNumber?: string;
  location?: string;
  notes?: string;
}

export interface AssetSummary {
  totalAssets: number;
  totalCost: number;
  totalBookValue: number;
  totalAccumulatedDepreciation: number;
  activeAssets: number;
  fullyDepreciated: number;
  disposedAssets: number;
  depreciationByCategory: Record<string, number>;
}

export function useFixedAssets() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [depreciating, setDepreciating] = useState(false);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(ASSETS.list);
      setAssets(response.data || []);
    } catch (error) {
      console.error('Error fetching fixed assets:', error);
      toast.error('No se pudieron cargar los activos fijos');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await apiClient.get(ASSETS.summary);
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching asset summary:', error);
    }
  }, []);

  const depreciateAsset = useCallback(async (assetId: string) => {
    try {
      await apiClient.post(ASSETS.depreciate(assetId));
      toast.success('Depreciación calculada correctamente');
      fetchAssets();
      fetchSummary();
    } catch (error) {
      console.error('Error depreciating asset:', error);
      toast.error('No se pudo calcular la depreciación');
    }
  }, [fetchAssets, fetchSummary]);

  const bulkDepreciate = useCallback(async () => {
    try {
      setDepreciating(true);
      await apiClient.post(ASSETS.bulkDepreciate);
      toast.success('Depreciación masiva aplicada correctamente');
      fetchAssets();
      fetchSummary();
    } catch (error) {
      console.error('Error in bulk depreciation:', error);
      toast.error('No se pudo aplicar la depreciación masiva');
    } finally {
      setDepreciating(false);
    }
  }, [fetchAssets, fetchSummary]);

  const getAssetHistory = useCallback(async (assetId: string) => {
    try {
      const response = await apiClient.get(ASSETS.history(assetId));
      return response.data;
    } catch (error) {
      console.error('Error fetching asset history:', error);
      toast.error('No se pudo cargar el historial del activo');
      return null;
    }
  }, []);

  useEffect(() => {
    fetchAssets();
    fetchSummary();
  }, [fetchAssets, fetchSummary]);

  return {
    assets,
    summary,
    loading,
    depreciating,
    refreshAssets: fetchAssets,
    depreciateAsset,
    bulkDepreciate,
    getAssetHistory,
  };
}
