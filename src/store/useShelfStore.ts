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
      set({ locations: Array.isArray(locations) ? locations : [] });
    } catch (error) {
      set({ error: (error as Error).message, locations: [] });
    } finally {
      set({ loading: false });
    }
  },

  fetchFlatLocations: async () => {
    try {
      const ipc = useIPC();
      const locations = await ipc.shelf.getFlatList();
      set({ flatLocations: Array.isArray(locations) ? locations : [] });
    } catch (error) {
      console.error('Failed to fetch flat locations:', error);
      set({ flatLocations: [] });
    }
  },

  saveLocation: async (data) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const location = await ipc.shelf.save(data);
      try {
        const ipc2 = useIPC();
        const [locations, flatLocs] = await Promise.all([
          ipc2.shelf.getAll(),
          ipc2.shelf.getFlatList(),
        ]);
        set({
          locations: Array.isArray(locations) ? locations : [],
          flatLocations: Array.isArray(flatLocs) ? flatLocs : [],
        });
      } catch {
        // ignore re-fetch errors, primary save succeeded
      }
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
      try {
        const ipc2 = useIPC();
        const [locations, flatLocs] = await Promise.all([
          ipc2.shelf.getAll(),
          ipc2.shelf.getFlatList(),
        ]);
        set({
          locations: Array.isArray(locations) ? locations : [],
          flatLocations: Array.isArray(flatLocs) ? flatLocs : [],
        });
      } catch {
        // ignore
      }
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
      set({ locationBooks: Array.isArray(books) ? books : [] });
    } catch (error) {
      set({ error: (error as Error).message, locationBooks: [] });
    } finally {
      set({ loading: false });
    }
  },

  setSelectedLocation: (location) => {
    set({ selectedLocation: location });
  },
}));
