import { useCallback } from 'react';
import type { IPCResponse } from '../types';

export function useIPC() {
  const handleResponse = useCallback(async <T>(
    response: IPCResponse<T>
  ): Promise<T> => {
    if (!response.success) {
      throw new Error(response.error || '操作失败');
    }
    return response.data as T;
  }, []);

  const books = {
    get: useCallback(async (req: any) => {
      const res = await window.electronAPI.books.get(req);
      return handleResponse(res);
    }, [handleResponse]),

    getById: useCallback(async (id: string) => {
      const res = await window.electronAPI.books.getById(id);
      return handleResponse(res);
    }, [handleResponse]),

    save: useCallback(async (req: any) => {
      const res = await window.electronAPI.books.save(req);
      return handleResponse(res);
    }, [handleResponse]),

    delete: useCallback(async (req: any) => {
      const res = await window.electronAPI.books.delete(req);
      return handleResponse(res);
    }, [handleResponse]),
  };

  const tags = {
    getAll: useCallback(async () => {
      const res = await window.electronAPI.tags.getAll();
      return handleResponse(res);
    }, [handleResponse]),
  };

  const borrow = {
    getAll: useCallback(async (req: any) => {
      const res = await window.electronAPI.borrow.getAll(req);
      return handleResponse(res);
    }, [handleResponse]),

    create: useCallback(async (req: any) => {
      const res = await window.electronAPI.borrow.create(req);
      return handleResponse(res);
    }, [handleResponse]),

    return: useCallback(async (req: any) => {
      const res = await window.electronAPI.borrow.return(req);
      return handleResponse(res);
    }, [handleResponse]),

    delete: useCallback(async (recordId: string) => {
      const res = await window.electronAPI.borrow.delete(recordId);
      return handleResponse(res);
    }, [handleResponse]),

    checkOverdue: useCallback(async () => {
      const res = await window.electronAPI.borrow.checkOverdue();
      return handleResponse(res);
    }, [handleResponse]),
  };

  const shelf = {
    getAll: useCallback(async () => {
      const res = await window.electronAPI.shelf.getAll();
      return handleResponse(res);
    }, [handleResponse]),

    getFlatList: useCallback(async () => {
      const res = await window.electronAPI.shelf.getFlatList();
      return handleResponse(res);
    }, [handleResponse]),

    save: useCallback(async (req: any) => {
      const res = await window.electronAPI.shelf.save(req);
      return handleResponse(res);
    }, [handleResponse]),

    delete: useCallback(async (locationId: string) => {
      const res = await window.electronAPI.shelf.delete(locationId);
      return handleResponse(res);
    }, [handleResponse]),

    assignBook: useCallback(async (req: any) => {
      const res = await window.electronAPI.shelf.assignBook(req);
      return handleResponse(res);
    }, [handleResponse]),

    getBooksByLocation: useCallback(async (locationId: string) => {
      const res = await window.electronAPI.shelf.getBooksByLocation(locationId);
      return handleResponse(res);
    }, [handleResponse]),
  };

  const wishlist = {
    getAll: useCallback(async () => {
      const res = await window.electronAPI.wishlist.getAll();
      return handleResponse(res);
    }, [handleResponse]),

    saveItem: useCallback(async (req: any) => {
      const res = await window.electronAPI.wishlist.saveItem(req);
      return handleResponse(res);
    }, [handleResponse]),

    deleteItem: useCallback(async (itemId: string) => {
      const res = await window.electronAPI.wishlist.deleteItem(itemId);
      return handleResponse(res);
    }, [handleResponse]),

    setBudget: useCallback(async (req: any) => {
      const res = await window.electronAPI.wishlist.setBudget(req);
      return handleResponse(res);
    }, [handleResponse]),

    markAsPurchased: useCallback(async (req: any) => {
      const res = await window.electronAPI.wishlist.markAsPurchased(req);
      return handleResponse(res);
    }, [handleResponse]),

    getPurchasedHistory: useCallback(async () => {
      const res = await window.electronAPI.wishlist.getPurchasedHistory();
      return handleResponse(res);
    }, [handleResponse]),
  };

  const stats = {
    get: useCallback(async () => {
      const res = await window.electronAPI.stats.get();
      return handleResponse(res);
    }, [handleResponse]),

    export: useCallback(async (req: any) => {
      const res = await window.electronAPI.stats.export(req);
      return handleResponse(res);
    }, [handleResponse]),

    saveExportFile: useCallback(async (data: string, defaultName: string) => {
      const res = await window.electronAPI.stats.saveExportFile(data, defaultName);
      return handleResponse(res);
    }, [handleResponse]),

    selectImportFile: useCallback(async () => {
      const res = await window.electronAPI.stats.selectImportFile();
      return handleResponse(res);
    }, [handleResponse]),

    import: useCallback(async (req: any) => {
      const res = await window.electronAPI.stats.import(req);
      return handleResponse(res);
    }, [handleResponse]),
  };

  const file = {
    saveCover: useCallback(async (bookId: string, filePath: string) => {
      const res = await window.electronAPI.file.saveCover(bookId, filePath);
      return handleResponse(res);
    }, [handleResponse]),

    selectImage: useCallback(async () => {
      const res = await window.electronAPI.file.selectImage();
      return handleResponse(res);
    }, [handleResponse]),
  };

  return {
    books,
    tags,
    borrow,
    shelf,
    wishlist,
    stats,
    file,
  };
}
