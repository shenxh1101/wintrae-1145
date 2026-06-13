import React from 'react';
import { BookOpen, Eye, Pencil, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { Book, ReadingStatus } from '../../types';
import { Rating } from '../Rating/Rating';
import { formatDate } from '../../utils/date';

interface BookCardProps {
  book: Book;
  viewMode: 'grid' | 'list';
  onView: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}

const statusLabels: Record<ReadingStatus, string> = {
  unread: '未读',
  reading: '在读',
  read: '已读',
};

export const BookCard: React.FC<BookCardProps> = ({
  book,
  viewMode,
  onView,
  onEdit,
  onDelete,
}) => {
  if (viewMode === 'list') {
    return (
      <div className="card p-4 flex items-center gap-4 group">
        <div className="w-16 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-100">
              <BookOpen className="w-6 h-6 text-primary-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-semibold text-gray-800 truncate">
            {book.title}
          </h3>
          <p className="text-sm text-gray-600 truncate">{book.author}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`badge badge-${book.status}`}>
              {statusLabels[book.status]}
            </span>
            {book.rating && <Rating value={book.rating} readOnly size="sm" />}
            {book.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs text-gray-500">#{tag}</span>
            ))}
            {book.purchasePrice && (
              <span className="text-xs text-gray-500">¥{book.purchasePrice}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onView(book)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="查看详情"
          >
            <Eye className="w-4 h-4 text-gray-500" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(book)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="编辑"
          >
            <Pencil className="w-4 h-4 text-gray-500" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(book)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <div className="relative aspect-[3/4] bg-gray-100">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 p-4">
            <BookOpen className="w-12 h-12 text-primary-400 mb-2" />
            <p className="text-sm font-serif text-center text-primary-600 line-clamp-2">
              {book.title}
            </p>
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            type="button"
            onClick={() => onView(book)}
            className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-colors"
            title="查看详情"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(book)}
            className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-colors"
            title="编辑"
          >
            <Pencil className="w-4 h-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(book)}
            className="p-1.5 bg-white/90 hover:bg-red-50 rounded-lg shadow-sm transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
        <div className="absolute top-2 left-2">
          <span className={`badge badge-${book.status}`}>
            {statusLabels[book.status]}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-serif font-semibold text-gray-800 truncate mb-1">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 truncate mb-2">{book.author}</p>
        <div className="flex items-center justify-between">
          {book.rating ? (
            <Rating value={book.rating} readOnly size="sm" />
          ) : (
            <span className="text-xs text-gray-400">未评分</span>
          )}
          {book.purchasePrice && (
            <span className="text-xs text-primary-600 font-medium">
              ¥{book.purchasePrice}
            </span>
          )}
        </div>
        {book.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {book.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        {book.purchaseDate && (
          <p className="text-xs text-gray-400 mt-2">购入：{formatDate(book.purchaseDate)}</p>
        )}
      </div>
    </div>
  );
};
