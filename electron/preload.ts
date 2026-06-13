import { contextBridge, ipcRenderer } from 'electron';
import type {
  GetBooksRequest,
  GetBooksResponse,
  SaveBookRequest,
  DeleteBookRequest,
  Book,
  Tag,
  GetBorrowRecordsRequest,
  GetBorrowRecordsResponse,
  CreateBorrowRequest,
  ReturnBookRequest,
  BorrowRecord,
  SaveLocationRequest,
  AssignBookLocationRequest,
  ShelfLocation,
  GetWishlistResponse,
  SaveWishItemRequest,
  SetBudgetRequest,
  MarkAsPurchasedRequest,
  WishItem,
  Budget,
  GetStatsResponse,
  ExportDataRequest,
  ImportDataRequest,
  IPCResponse,
} from '../shared/types';

const api = {
  books: {
    get: (req: GetBooksRequest): Promise<IPCResponse<GetBooksResponse>> =>
      ipcRenderer.invoke('books:get', req),
    getById: (id: string): Promise<IPCResponse<Book>> =>
      ipcRenderer.invoke('books:getById', id),
    save: (req: SaveBookRequest): Promise<IPCResponse<Book>> =>
      ipcRenderer.invoke('books:save', req),
    delete: (req: DeleteBookRequest): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke('books:delete', req),
  },
  tags: {
    getAll: (): Promise<IPCResponse<Tag[]>> =>
      ipcRenderer.invoke('tags:getAll'),
  },
  borrow: {
    getAll: (req: GetBorrowRecordsRequest): Promise<IPCResponse<GetBorrowRecordsResponse>> =>
      ipcRenderer.invoke('borrow:getAll', req),
    create: (req: CreateBorrowRequest): Promise<IPCResponse<BorrowRecord>> =>
      ipcRenderer.invoke('borrow:create', req),
    return: (req: ReturnBookRequest): Promise<IPCResponse<BorrowRecord>> =>
      ipcRenderer.invoke('borrow:return', req),
    delete: (recordId: string): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke('borrow:delete', recordId),
    checkOverdue: (): Promise<IPCResponse<BorrowRecord[]>> =>
      ipcRenderer.invoke('borrow:checkOverdue'),
  },
  shelf: {
    getAll: (): Promise<IPCResponse<ShelfLocation[]>> =>
      ipcRenderer.invoke('shelf:getAll'),
    getFlatList: (): Promise<IPCResponse<ShelfLocation[]>> =>
      ipcRenderer.invoke('shelf:getFlatList'),
    save: (req: SaveLocationRequest): Promise<IPCResponse<ShelfLocation>> =>
      ipcRenderer.invoke('shelf:save', req),
    delete: (locationId: string): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke('shelf:delete', locationId),
    assignBook: (req: AssignBookLocationRequest): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke('shelf:assignBook', req),
    getBooksByLocation: (locationId: string): Promise<IPCResponse<Book[]>> =>
      ipcRenderer.invoke('shelf:getBooksByLocation', locationId),
  },
  wishlist: {
    getAll: (): Promise<IPCResponse<GetWishlistResponse>> =>
      ipcRenderer.invoke('wishlist:getAll'),
    saveItem: (req: SaveWishItemRequest): Promise<IPCResponse<WishItem>> =>
      ipcRenderer.invoke('wishlist:saveItem', req),
    deleteItem: (itemId: string): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke('wishlist:deleteItem', itemId),
    setBudget: (req: SetBudgetRequest): Promise<IPCResponse<Budget>> =>
      ipcRenderer.invoke('wishlist:setBudget', req),
    markAsPurchased: (req: MarkAsPurchasedRequest): Promise<IPCResponse<void>> =>
      ipcRenderer.invoke('wishlist:markAsPurchased', req),
    getPurchasedHistory: (): Promise<IPCResponse<WishItem[]>> =>
      ipcRenderer.invoke('wishlist:getPurchasedHistory'),
  },
  stats: {
    get: (): Promise<IPCResponse<GetStatsResponse>> =>
      ipcRenderer.invoke('stats:get'),
    export: (req: ExportDataRequest): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke('stats:export', req),
    saveExportFile: (data: string, defaultName: string): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke('stats:saveExportFile', data, defaultName),
    selectImportFile: (): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke('stats:selectImportFile'),
    import: (req: ImportDataRequest): Promise<IPCResponse<number>> =>
      ipcRenderer.invoke('stats:import', req),
  },
  file: {
    saveCover: (bookId: string, filePath: string): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke('file:saveCover', bookId, filePath),
    selectImage: (): Promise<IPCResponse<string>> =>
      ipcRenderer.invoke('file:selectImage'),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
