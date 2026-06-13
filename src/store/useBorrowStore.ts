import { create } from 'zustand';
import type { BorrowRecord, GetBorrowRecordsRequest, CreateBorrowRequest, ReturnBookRequest } from '../types';
import { useIPC } from '../hooks/useIPC';

interface BorrowStore {
  records: BorrowRecord[];
  loading: boolean;
  error: string | null;
  activeCount: number;
  overdueCount: number;
  soonDueCount: number;

  fetchRecords: (status?: GetBorrowRecordsRequest['status']) => Promise<void>;
  createRecord: (data: CreateBorrowRequest) => Promise<BorrowRecord>;
  returnBook: (recordId: string, actualReturnDate: string) => Promise<BorrowRecord>;
  deleteRecord: (recordId: string) => Promise<void>;
  checkOverdue: () => Promise<BorrowRecord[]>;
  calculateStats: () => void;
}

export const useBorrowStore = create<BorrowStore>((set, get) => ({
  records: [],
  loading: false,
  error: null,
  activeCount: 0,
  overdueCount: 0,
  soonDueCount: 0,

  fetchRecords: async (status) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const result = await ipc.borrow.getAll({ status });
      set({ records: result.records });
      get().calculateStats();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  createRecord: async (data) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const record = await ipc.borrow.create(data);
      set((state) => ({ records: [record, ...state.records] }));
      get().calculateStats();
      return record;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  returnBook: async (recordId, actualReturnDate) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const record = await ipc.borrow.return({ recordId, actualReturnDate });
      set((state) => ({
        records: state.records.map((r) => (r.id === recordId ? record : r)),
      }));
      get().calculateStats();
      return record;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteRecord: async (recordId) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      await ipc.borrow.delete(recordId);
      set((state) => ({
        records: state.records.filter((r) => r.id !== recordId),
      }));
      get().calculateStats();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  checkOverdue: async () => {
    try {
      const ipc = useIPC();
      const records = await ipc.borrow.checkOverdue();
      return records;
    } catch (error) {
      console.error('Failed to check overdue:', error);
      return [];
    }
  },

  calculateStats: () => {
    const { records } = get();
    const today = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const active = records.filter((r) => !r.actualReturnDate);
    const overdue = active.filter((r) => r.expectedReturnDate < today);
    const soonDue = active.filter(
      (r) => r.expectedReturnDate >= today && r.expectedReturnDate <= threeDaysLater
    );

    set({
      activeCount: active.length,
      overdueCount: overdue.length,
      soonDueCount: soonDue.length,
    });
  },
}));
