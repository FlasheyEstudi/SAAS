import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { ASSETS } from '@/lib/api/endpoints';
import { toast } from 'sonner';

export interface FixedAsset {
  id: string;
  name: string;
  description?: string;
  assetType: 'BUILDING' | 'FURNITURE' | 'COMPUTER' | 'VEHICLE' | 'MACHINERY' | 'OTHER';
  purchaseDate: string;
  purchaseAmount: number;
  salvageValue: number;
  usefulLifeMonths: number;
  depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING';
  currentBookValue: number;
  accumulatedDepreciation: number;
  status: 'ACTIVE' | 'DISPOSED' | 'FULLY_DEPRECIATED';
  location?: string;
  accountId?: string;
}

export interface AssetSummary {
  totalAssets: number;
  totalPurchaseAmount: number;
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
      const companyId = localStorage.getItem('current_company_id');
      const response = await apiClient.get(ASSETS.list, { companyId: companyId || undefined });
      const data = response?.data || response || [];
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const companyId = localStorage.getItem('current_company_id');
      const response = await apiClient.get(ASSETS.summary, { companyId: companyId || undefined });
      const data = response?.data || response || {};
      setSummary(data);
    } catch (error) {

      setSummary({
        totalAssets: 0,
        totalPurchaseAmount: 0,
        totalBookValue: 0,
        totalAccumulatedDepreciation: 0,
        activeAssets: 0,
        fullyDepreciated: 0,
        disposedAssets: 0,
        depreciationByCategory: {},
      } as any);
    }
  }, []);

  const depreciateAsset = useCallback(async (assetId: string, params?: { year: number, month: number }) => {
    try {
      const now = new Date();
      const payload = params || {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      };
      await apiClient.post(ASSETS.depreciate(assetId), payload);
      toast.success('Depreciación calculada correctamente');
      fetchAssets();
      fetchSummary();
    } catch (error: any) {

      toast.error(error?.error || 'No se pudo calcular la depreciación');
    }
  }, [fetchAssets, fetchSummary]);

  const bulkDepreciate = useCallback(async (params: { companyId: string, year: number, month: number }) => {
    try {
      setDepreciating(true);
      await apiClient.post(ASSETS.bulkDepreciate, params);
      toast.success('Depreciación masiva aplicada correctamente');
      fetchAssets();
      fetchSummary();
    } catch (error) {

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

      toast.error('No se pudo cargar el historial del activo');
      return null;
    }
  }, []);

  const createAsset = useCallback(async (data: Partial<FixedAsset>) => {
    try {
      const companyId = localStorage.getItem('current_company_id');
      await apiClient.post(ASSETS.create, { ...data, companyId });
      toast.success('Activo creado correctamente');
      fetchAssets();
      fetchSummary();
      return true;
    } catch (error: any) {

      toast.error(error.error || 'No se pudo crear el activo');
      return false;
    }
  }, [fetchAssets, fetchSummary]);

  const updateAsset = useCallback(async (id: string, data: Partial<FixedAsset>) => {
    try {
      const companyId = localStorage.getItem('current_company_id');
      await apiClient.put(ASSETS.update(id), { ...data, companyId });
      toast.success('Activo actualizado correctamente');
      fetchAssets();
      fetchSummary();
      return true;
    } catch (error: any) {

      toast.error(error.error || 'No se pudo actualizar el activo');
      return false;
    }
  }, [fetchAssets, fetchSummary]);

  const deleteAsset = useCallback(async (id: string) => {
    try {
      await apiClient.delete(ASSETS.delete(id));
      toast.success('Activo eliminado correctamente');
      fetchAssets();
      fetchSummary();
      return true;
    } catch (error: any) {

      toast.error(error.error || 'No se pudo eliminar el activo');
      return false;
    }
  }, [fetchAssets, fetchSummary]);

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
    createAsset,
    updateAsset,
    deleteAsset,
  };
}
