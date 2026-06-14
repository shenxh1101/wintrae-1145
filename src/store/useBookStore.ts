import { create } from 'zustand';
import type { Book, Tag, GetBooksRequest, SaveBookRequest, DeleteBookRequest } from '../types';
import { useIPC } from '../hooks/useIPC';

interface BookStore {
  books: Book[];
  total: number;
  tags: Tag[];
  loading: boolean;
  error: string | null;
  selectedBook: Book | null;
  filters: GetBooksRequest;

  fetchBooks: (filters?: Partial<GetBooksRequest>) => Promise<void>;
  fetchTags: () => Promise<void>;
  saveBook: (data: SaveBookRequest) => Promise<Book>;
  deleteBook: (id: string) => Promise<void>;
  setSelectedBook: (book: Book | null) => void;
  setFilters: (filters: Partial<GetBooksRequest>) => void;
  resetFilters: () => void;
  selectBookById: (id: string) => Promise<Book | null>;
}

const defaultFilters: GetBooksRequest = {
  page: 1,
  pageSize: 50,
  sortBy: 'title',
  sortOrder: 'asc',
};

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  total: 0,
  tags: [],
  loading: false,
  error: null,
  selectedBook: null,
  filters: defaultFilters,

  fetchBooks: async (filters) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const currentFilters = { ...get().filters, ...filters };
      const result = await ipc.books.get(currentFilters);
      const safeBooks = Array.isArray(result?.books) ? result.books : [];
      set({
        books: safeBooks,
        total: typeof result?.total === 'number' ? result.total : safeBooks.length,
        filters: currentFilters,
      });
    } catch (error) {
      set({ error: (error as Error).message, books: [], total: 0 });
    } finally {
      set({ loading: false });
    }
  },

  fetchTags: async () => {
    try {
      const ipc = useIPC();
      const tags = await ipc.tags.getAll();
      set({ tags: Array.isArray(tags) ? tags : [] });
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      set({ tags: [] });
    }
  },

  saveBook: async (data) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      const book = await ipc.books.save(data);
      if (data.id) {
        set((state) => ({
          books: state.books.map((b) => (b.id === data.id ? book : b)),
        }));
      } else {
        await get().fetchBooks();
      }
      return book;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteBook: async (id) => {
    set({ loading: true, error: null });
    try {
      const ipc = useIPC();
      await ipc.books.delete({ id });
      set((state) => ({
        books: state.books.filter((b) => b.id !== id),
        total: state.total - 1,
        selectedBook: state.selectedBook?.id === id ? null : state.selectedBook,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setSelectedBook: (book) => {
    set({ selectedBook: book });
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters, page: 1 } }));
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
  },

  selectBookById: async (id) => {
    try {
      const ipc = useIPC();
      const book = await ipc.books.getById(id);
      set({ selectedBook: book });
      return book;
    } catch (error) {
      console.error('Failed to fetch book:', error);
      return null;
    }
  },
}));
