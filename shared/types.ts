export interface Book {
  id: string;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  publishDate?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  status: 'unread' | 'reading' | 'read';
  rating?: number;
  notes?: string;
  coverImage?: string;
  tags: string[];
  shelfLocationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface ShelfLocation {
  id: string;
  parentId?: string;
  type: 'room' | 'cabinet' | 'shelf' | 'slot';
  name: string;
  code?: string;
  description?: string;
  positionOrder: number;
  bookCount?: number;
  children?: ShelfLocation[];
  books?: Book[];
  createdAt: string;
  updatedAt: string;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  book?: Book;
  borrower: string;
  borrowerContact?: string;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  enableReminder: boolean;
  reminderSent: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishItem {
  id: string;
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  expectedPrice?: number;
  estimatedPrice?: number;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  coverImage?: string;
  sourceUrl?: string;
  addedDate?: string;
  purchased: boolean;
  actualPrice?: number;
  purchaseDate?: string;
  bookId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  year: number;
  monthlyAmount: number;
  monthlyBudget: number;
  yearlyBudget: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetBooksRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  tag?: string;
  status?: 'unread' | 'reading' | 'read';
  sortBy?: 'title' | 'author' | 'purchaseDate' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface GetBooksResponse {
  books: Book[];
  total: number;
}

export interface SaveBookRequest {
  id?: string;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  publishDate?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  status: 'unread' | 'reading' | 'read';
  rating?: number;
  notes?: string;
  coverImage?: string;
  tags: string[];
  shelfLocationId?: string;
}

export interface DeleteBookRequest {
  id: string;
}

export interface GetBorrowRecordsRequest {
  status?: 'active' | 'returned' | 'overdue';
}

export interface GetBorrowRecordsResponse {
  records: BorrowRecord[];
}

export interface CreateBorrowRequest {
  bookId: string;
  borrower: string;
  borrowerContact?: string;
  borrowDate: string;
  expectedReturnDate: string;
  enableReminder: boolean;
  notes?: string;
}

export interface ReturnBookRequest {
  recordId: string;
  actualReturnDate: string;
}

export interface SaveLocationRequest {
  id?: string;
  parentId?: string;
  type: 'room' | 'cabinet' | 'shelf' | 'slot';
  name: string;
  code?: string;
  description?: string;
}

export interface AssignBookLocationRequest {
  bookId: string;
  locationId: string;
}

export interface GetWishlistResponse {
  items: WishItem[];
  budget: Budget;
}

export interface SaveWishItemRequest {
  id?: string;
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  expectedPrice?: number;
  estimatedPrice?: number;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  coverImage?: string;
  sourceUrl?: string;
}

export interface SetBudgetRequest {
  year: number;
  monthlyAmount: number;
  monthlyBudget: number;
  yearlyBudget: number;
}

export interface MarkAsPurchasedRequest {
  wishItemId: string;
  itemId: string;
  actualPrice: number;
  purchaseDate: string;
  createBookRecord: boolean;
}

export interface GetStatsResponse {
  totalBooks: number;
  readBooks: number;
  readingBooks: number;
  unreadBooks: number;
  totalValue: number;
  readingStatus: {
    unread: number;
    reading: number;
    read: number;
  };
  yearlyPurchase: { year: number; count: number; amount: number }[];
  monthlyPurchase: { month: string; count: number; amount: number }[];
  monthlyPurchases: { month: string; count: number; amount: number }[];
  booksByTag: { tag: string; count: number }[];
  tagDistribution: { tag: string; count: number }[];
  duplicateBooks: Book[][];
  duplicates: Book[][];
  recentAdditions: Book[];
  totalAuthors: number;
  totalTags: number;
  borrowedCount: number;
  wishlistCount: number;
  shelfLocationCount: number;
}

export interface ExportDataRequest {
  format: 'json' | 'csv';
  includeTypes: ('books' | 'borrow' | 'shelf' | 'wishlist')[];
  includeBooks: boolean;
  includeBorrow: boolean;
  includeShelf: boolean;
  includeWishlist: boolean;
}

export interface ImportDataRequest {
  format?: 'json' | 'csv';
  data?: string;
  overwrite?: boolean;
  filePath: string;
}

export interface IPCResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
