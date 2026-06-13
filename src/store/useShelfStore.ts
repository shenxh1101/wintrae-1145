import { create } from 'zustand';
import type { ShelfLocation, Book, SaveLocationRequest, AssignBookLocationRequest } from '../types';
import { useIPC } from '../hooks/useIPC';

interface ShelfStore {
  locations: ShelfLocation[];
  flatLocations: ShelfLocation[];
  loading: boolean;
  error: string | null;
  selectedLocation: ShelfLocation | null;
  locationBooks: Book[];

  fetchLocations: () => Promise<void>;
  fetchFlatLocations: () => Promise<void>;
  saveLocation: (data: SaveLocationRequest) => Promise<ShelfLocation>;
  deleteLocation: (locationId: string) => Promise<void>;
  assignBook: (bookId: string, locationId: string) => Promise<void>;
  fetchBooksByLocation: (locationId: string) => Promise<void>;
  setSelectedLocation: (location: ShelfLocation | null) => void;
}

export const useShelfStore = create<ShelfStore>((set) => ({
  locations: [],
  flatLocations: [],
  loading: false,
  error: null,
  selectedLocation: null,
  locationBooks: [],

  fetchLocations: async () => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const locations = await ipc.shelf.getAll();
      set({ locations });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchFlatLocations: async () => {
    try {
      const ipc = useIPC();
      const locations = await ipc.shelf.getFlatList();
      set({ flatLocations: locations });
    } catch (error) {
      console.error('Failed to fetch flat locations:', error);
    }
  },

  saveLocation: async (data) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const location = await ipc.shelf.save(data);
      await Promise.all([
        (async () => {
          const ipc2 = useIPC();
          const locations = await ipc2.shelf.getAll();
          set({ locations });
        })(),
        (async () => {
          const ipc2 = useIPC();
          const flatLocations = await ipc2.shelf.getFlatList();
          set({ flatLocations });
        })(),
      ]);
      return location;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteLocation: async (locationId) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      await ipc.shelf.delete(locationId);
      await Promise.all([
        (async () => {
          const ipc2 = useIPC();
          const locations = await ipc2.shelf.getAll();
          set({ locations });
        })(),
        (async () => {
          const ipc2 = useIPC();
          const flatLocations = await ipc2.shelf.getFlatList();
          set({ flatLocations });
        })(),
      ]);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  assignBook: async (bookId, locationId) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      await ipc.shelf.assignBook({ bookId, locationId });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchBooksByLocation: async (locationId) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const books = await ipc.shelf.getBooksByLocation(locationId);
      set({ locationBooks: books });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  setSelectedLocation: (location) => {
    set({ selectedLocation: location });
  },
}));
