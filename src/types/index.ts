export type {
  Book,
  Tag,
  ShelfLocation,
  BorrowRecord,
  WishItem,
  Budget,
  GetBooksRequest,
  GetBooksResponse,
  SaveBookRequest,
  DeleteBookRequest,
  GetBorrowRecordsRequest,
  GetBorrowRecordsResponse,
  CreateBorrowRequest,
  ReturnBookRequest,
  SaveLocationRequest,
  AssignBookLocationRequest,
  GetWishlistResponse,
  SaveWishItemRequest,
  SetBudgetRequest,
  MarkAsPurchasedRequest,
  GetStatsResponse,
  ExportDataRequest,
  ImportDataRequest,
  IPCResponse,
} from '../../shared/types';

export type ReadingStatus = 'unread' | 'reading' | 'read';
export type Priority = 'high' | 'medium' | 'low';
export type LocationType = 'room' | 'cabinet' | 'shelf' | 'slot';
export type BorrowStatus = 'active' | 'returned' | 'overdue';
export type ViewMode = 'grid' | 'list';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
