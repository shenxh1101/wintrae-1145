import React, { useState, useEffect } from 'react';
import { Plus, Search, Grid3X3, List, Filter, X, Scan } from 'lucide-react';
import { clsx } from 'clsx';
import { useBookStore } from '../../store/useBookStore';
import { useShelfStore } from '../../store/useShelfStore';
import { useToast } from '../../store/useToastStore';
import { useBorrowStore } from '../../store/useBorrowStore';
import { BookCard } from '../../components/BookCard/BookCard';
import { Modal } from '../../components/Modal/Modal';
import { BookForm } from '../../components/Layout/BookForm';
import { BookDetailDrawer } from '../../components/Layout/BookDetailDrawer';
import type { Book, SaveBookRequest, ViewMode, ReadingStatus } from '../../types';

const statusOptions: { value: ReadingStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'unread', label: '未读' },
  { value: 'reading', label: '在读' },
  { value: 'read', label: '已读' },
];

const Library: React.FC = () => {
  const { books, total, tags, loading, filters, fetchBooks, fetchTags, saveBook, deleteBook, setSelectedBook, selectedBook, setFilters } = useBookStore();
  const { flatLocations, fetchFlatLocations } = useShelfStore();
  const { createRecord } = useBorrowStore();
  const toast = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowForm, setBorrowForm] = useState({ borrower: '', expectedReturnDate: '' });
  const [borrowingBook, setBorrowingBook] = useState<Book | null>(null);

  useEffect(() => {
    fetchBooks();
    fetchTags();
    fetchFlatLocations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        setFilters({ search: searchQuery });
      } else {
        const { search, ...rest } = filters;
        setFilters(rest);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleViewBook = (book: Book) => {
    setSelectedBook(book);
    setShowDetail(true);
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setShowForm(true);
    setShowDetail(false);
  };

  const handleDeleteBook = async (book: Book) => {
    if (window.confirm(`确定要删除《${book.title}》吗？`)) {
      try {
        await deleteBook(book.id);
        toast.success('删除成功');
        setShowDetail(false);
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };

  const handleSubmitBook = async (data: SaveBookRequest) => {
    try {
      const savedBook = await saveBook(data);
      toast.success(editingBook ? '修改成功' : '添加成功');
      if (editingBook && selectedBook?.id === editingBook.id) {
        setSelectedBook(savedBook);
      }
      setShowForm(false);
      setEditingBook(null);
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const handleBorrow = (book: Book) => {
    setBorrowingBook(book);
    setBorrowForm({ borrower: '', expectedReturnDate: '' });
    setShowBorrowModal(true);
    setShowDetail(false);
  };

  const handleSubmitBorrow = async () => {
    if (!borrowForm.borrower.trim()) {
      toast.warning('请输入借出人');
      return;
    }
    if (!borrowForm.expectedReturnDate) {
      toast.warning('请选择归还日期');
      return;
    }
    if (!borrowingBook) return;

    try {
      await createRecord({
        bookId: borrowingBook.id,
        borrower: borrowForm.borrower,
        borrowDate: new Date().toISOString().split('T')[0],
        expectedReturnDate: borrowForm.expectedReturnDate,
        enableReminder: true,
        notes: '',
      });
      toast.success('借阅登记成功');
      setShowBorrowModal(false);
      setBorrowingBook(null);
    } catch (error) {
      toast.error('登记失败');
    }
  };

  const handleStatusFilter = (status: ReadingStatus | 'all') => {
    if (status === 'all') {
      const { status: _, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({ status });
    }
  };

  const handleTagFilter = (tag: string) => {
    const currentTags = filters.tag ? [filters.tag] : [];
    if (currentTags.includes(tag)) {
      const { tag: _, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({ tag });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({ page: 1, pageSize: 50, sortBy: 'title', sortOrder: 'asc' });
  };

  const hasActiveFilters = filters.status || filters.tag || filters.search;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-800">书库</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 本书</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toast.info('扫码功能需要摄像头设备，此处省略')}
            className="btn-secondary flex items-center gap-2"
          >
            <Scan className="w-4 h-4" />
            扫码录入
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingBook(null);
              setShowForm(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加书籍
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索书名、作者、ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={clsx(
              'p-2 rounded transition-colors',
              viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 rounded transition-colors',
              viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={clsx(
            'btn-secondary flex items-center gap-2',
            showFilters && 'bg-primary-50'
          )}
        >
          <Filter className="w-4 h-4" />
          筛选
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-primary-500 rounded-full" />
          )}
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 mb-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium text-gray-700">筛选条件</h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                清除全部
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">阅读状态</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusFilter(opt.value)}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-sm transition-colors',
                      filters.status === opt.value || (opt.value === 'all' && !filters.status)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">标签</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagFilter(tag.name)}
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-sm transition-colors',
                        filters.tag === tag.name
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : books.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg mb-2">暂无书籍</p>
          <p className="text-sm mb-4">点击上方按钮添加你的第一本书</p>
          <button
            type="button"
            onClick={() => {
              setEditingBook(null);
              setShowForm(true);
            }}
            className="btn-primary"
          >
            添加书籍
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  viewMode="grid"
                  onView={handleViewBook}
                  onEdit={handleEditBook}
                  onDelete={handleDeleteBook}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  viewMode="list"
                  onView={handleViewBook}
                  onEdit={handleEditBook}
                  onDelete={handleDeleteBook}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingBook(null);
        }}
        title={editingBook ? '编辑书籍' : '添加书籍'}
        size="xl"
      >
        <BookForm
          book={editingBook}
          tags={tags}
          locations={flatLocations}
          onSubmit={handleSubmitBook}
          onCancel={() => {
            setShowForm(false);
            setEditingBook(null);
          }}
        />
      </Modal>

      <BookDetailDrawer
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        book={selectedBook}
        locations={flatLocations}
        onEdit={handleEditBook}
        onDelete={handleDeleteBook}
        onBorrow={handleBorrow}
      />

      <Modal
        isOpen={showBorrowModal}
        onClose={() => {
          setShowBorrowModal(false);
          setBorrowingBook(null);
        }}
        title="登记借出"
        size="md"
      >
        <div className="space-y-4">
          {borrowingBook && (
            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
              <div className="w-12 h-16 bg-primary-100 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 font-serif font-bold">{borrowingBook.title.charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">{borrowingBook.title}</p>
                <p className="text-sm text-gray-500">{borrowingBook.author}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              借出人 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={borrowForm.borrower}
              onChange={(e) => setBorrowForm((prev) => ({ ...prev, borrower: e.target.value }))}
              className="input-field"
              placeholder="请输入借出人姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              预计归还日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={borrowForm.expectedReturnDate}
              onChange={(e) => setBorrowForm((prev) => ({ ...prev, expectedReturnDate: e.target.value }))}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowBorrowModal(false);
                setBorrowingBook(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button type="button" onClick={handleSubmitBorrow} className="btn-primary">
              确认登记
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Library;
