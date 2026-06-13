import React from 'react';
import { X, BookOpen, User, Building, Calendar, Tag as TagIcon, FileText, MapPin } from 'lucide-react';
import type { Book, ShelfLocation } from '../../types';
import { Rating } from '../Rating/Rating';
import { formatDate } from '../../utils/date';
import { clsx } from 'clsx';

interface BookDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  locations?: ShelfLocation[];
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
  onBorrow?: (book: Book) => void;
}

const statusLabels: Record<string, string> = {
  unread: '未读',
  reading: '在读',
  read: '已读',
};

export const BookDetailDrawer: React.FC<BookDetailDrawerProps> = ({
  isOpen,
  onClose,
  book,
  locations = [],
  onEdit,
  onDelete,
  onBorrow,
}) => {
  if (!isOpen || !book) return null;

  const getLocationPath = (locationId?: string): string => {
    if (!locationId) return '未分配';
    const path: string[] = [];
    let current = locations.find((l) => l.id === locationId);
    while (current) {
      path.unshift(current.name);
      current = locations.find((l) => l.id === current?.parentId);
    }
    return path.join(' / ');
  };

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-[500px] bg-white shadow-2xl animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-serif font-semibold text-gray-800">书籍详情</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="relative h-48 bg-gradient-to-br from-primary-200 to-primary-400">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-20 h-20 text-white/60" />
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">
                {book.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {book.author}
                </span>
                {book.publisher && (
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {book.publisher}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={clsx('badge', `badge-${book.status}`)}>
                {statusLabels[book.status]}
              </span>
              <Rating value={book.rating || 0} readOnly showValue />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {book.isbn && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">ISBN</p>
                  <p className="text-sm font-medium text-gray-800">{book.isbn}</p>
                </div>
              )}
              {book.publishDate && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">出版日期</p>
                  <p className="text-sm font-medium text-gray-800">
                    {formatDate(book.publishDate)}
                  </p>
                </div>
              )}
              {book.purchasePrice !== undefined && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">购买价格</p>
                  <p className="text-sm font-medium text-primary-600">
                    ¥{book.purchasePrice}
                  </p>
                </div>
              )}
              {book.purchaseDate && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">购买日期</p>
                  <p className="text-sm font-medium text-gray-800">
                    {formatDate(book.purchaseDate)}
                  </p>
                </div>
              )}
            </div>

            {book.tags.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <TagIcon className="w-3 h-3" />
                  标签
                </p>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                书架位置
              </p>
              <p className="text-sm text-gray-700">
                {getLocationPath(book.shelfLocationId)}
              </p>
            </div>

            {book.notes && (
              <div>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  笔记
                </p>
                <div className="bg-paper-100 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {book.notes}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
              <p>创建时间：{formatDate(book.createdAt)}</p>
              <p>更新时间：{formatDate(book.updatedAt)}</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-2">
          {onBorrow && (
            <button
              type="button"
              onClick={() => onBorrow(book)}
              className="flex-1 btn-secondary"
            >
              登记借出
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(book)}
              className="flex-1 btn-primary"
            >
              编辑
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(book)}
              className="btn-danger"
            >
              删除
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
