import { create } from 'zustand';
import type { WishItem, Budget, SaveWishItemRequest, SetBudgetRequest, MarkAsPurchasedRequest } from '../types';
import { useIPC } from '../hooks/useIPC';

interface WishlistStore {
  items: WishItem[];
  purchasedHistory: WishItem[];
  budget: Budget | null;
  loading: boolean;
  error: string | null;
  priorityFilter: 'all' | 'high' | 'medium' | 'low';

  fetchAll: () => Promise<void>;
  fetchPurchasedHistory: () => Promise<WishItem[]>;
  saveItem: (data: SaveWishItemRequest) => Promise<WishItem>;
  deleteItem: (itemId: string) => Promise<void>;
  setBudget: (data: SetBudgetRequest) => Promise<Budget>;
  markAsPurchased: (data: MarkAsPurchasedRequest) => Promise<void>;
  setPriorityFilter: (filter: 'all' | 'high' | 'medium' | 'low') => void;
  getFilteredItems: () => WishItem[];
  getMonthlySpent: () => number;
  getYearlySpent: () => number;
}

const currentYear = new Date().getFullYear();
const currentMonth = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  purchasedHistory: [],
  budget: null,
  loading: false,
  error: null,
  priorityFilter: 'all',

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const result = await ipc.wishlist.getAll();
      set({ items: result.items, budget: result.budget });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchPurchasedHistory: async () => {
    try {
      const ipc = useIPC();
      const history = await ipc.wishlist.getPurchasedHistory();
      set({ purchasedHistory: history });
      return history;
    } catch (error) {
      console.error('Failed to fetch purchased history:', error);
      return [];
    }
  },

  saveItem: async (data) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const item = await ipc.wishlist.saveItem(data);
      if (data.id) {
        set((state) => ({
          items: state.items.map((i) => (i.id === data.id ? item : i)),
        }));
      } else {
        await get().fetchAll();
      }
      return item;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteItem: async (itemId) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      await ipc.wishlist.deleteItem(itemId);
      set((state) => ({
        items: state.items.filter((i) => i.id !== itemId),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setBudget: async (data) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const budget = await ipc.wishlist.setBudget(data);
      set({ budget });
      return budget;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  markAsPurchased: async (data) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      await ipc.wishlist.markAsPurchased(data);
      await get().fetchAll();
      await get().fetchPurchasedHistory();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setPriorityFilter: (filter) => {
    set({ priorityFilter: filter });
  },

  getFilteredItems: () => {
    const { items, priorityFilter } = get();
    if (priorityFilter === 'all') return items;
    return items.filter((i) => i.priority === priorityFilter);
  },

  getMonthlySpent: () => {
    const { purchasedHistory } = get();
    return purchasedHistory
      .filter((i) => i.purchaseDate?.startsWith(currentMonth))
      .reduce((sum, i) => sum + (i.actualPrice || 0), 0);
  },

  getYearlySpent: () => {
    const { purchasedHistory } = get();
    return purchasedHistory
      .filter((i) => i.purchaseDate?.startsWith(String(currentYear)))
      .reduce((sum, i) => sum + (i.actualPrice || 0), 0);
  },
}));
