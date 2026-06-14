import { create } from 'zustand';
import type { GetStatsResponse, ExportDataRequest, ImportDataRequest } from '../types';
import { useIPC } from '../hooks/useIPC';

interface ImportResult {
  importedCount: number;
  failedCount: number;
  details: string;
}

interface StatsStore {
  stats: GetStatsResponse | null;
  loading: boolean;
  error: string | null;

  fetchStats: () => Promise<void>;
  exportData: (req: ExportDataRequest) => Promise<string>;
  saveExportFile: (data: string, defaultName: string) => Promise<string>;
  selectImportFile: () => Promise<string>;
  importData: (req: ImportDataRequest) => Promise<ImportResult>;
}

export const useStatsStore = create<StatsStore>((set) => ({
  stats: null,
  loading: false,
  error: null,

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const stats = await ipc.stats.get();
      set({ stats });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  exportData: async (req) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const data = await ipc.stats.export(req);
      return data;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  saveExportFile: async (data, defaultName) => {
    try {
      const ipc = useIPC();
      const filePath = await ipc.stats.saveExportFile(data, defaultName);
      return filePath;
    } catch (error) {
      throw error;
    }
  },

  selectImportFile: async () => {
    try {
      const ipc = useIPC();
      const filePath = await ipc.stats.selectImportFile();
      return filePath;
    } catch (error) {
      throw error;
    }
  },

  importData: async (req): Promise<ImportResult> => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const result = await ipc.stats.import(req) as unknown as ImportResult;
      return result;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
