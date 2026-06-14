import React, { useState, useEffect } from 'react';
import { Plus, Search, Clock, AlertTriangle, CheckCircle, BookOpen, User, Calendar, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useBorrowStore } from '../../store/useBorrowStore';
import { useBookStore } from '../../store/useBookStore';
import { useToast } from '../../store/useToastStore';
import { Modal } from '../../components/Modal/Modal';
import { formatDate, isOverdue, isSoonDue, getTodayString } from '../../utils/date';
import type { BorrowRecord, Book, CreateBorrowRequest, BorrowStatus } from '../../types';

const statusTabs: { value: BorrowStatus | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: '全部', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'active', label: '借阅中', icon: <Clock className="w-4 h-4" /> },
  { value: 'overdue', label: '已逾期', icon: <AlertTriangle className="w-4 h-4" /> },
  { value: 'returned', label: '已归还', icon: <CheckCircle className="w-4 h-4" /> },
];

const Borrow: React.FC = () => {
  const { records, loading, activeCount, overdueCount, soonDueCount, fetchRecords, createRecord, returnBook, deleteRecord, checkOverdue } = useBorrowStore();
  const { books, fetchBooks } = useBookStore();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<BorrowStatus | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningRecord, setReturningRecord] = useState<BorrowRecord | null>(null);
  const [actualReturnDate, setActualReturnDate] = useState(getTodayString());
  const [showReminders, setShowReminders] = useState(true);

  const [createForm, setCreateForm] = useState<CreateBorrowRequest>({
    bookId: '',
    borrower: '',
    borrowDate: getTodayString(),
    expectedReturnDate: '',
    enableReminder: true,
    notes: '',
  });

  useEffect(() => {
    fetchRecords(activeTab === 'all' ? undefined : activeTab);
    fetchBooks();
    checkOverdue();
  }, [activeTab]);

  const getBookById = (id: string): Book | undefined => books.find((b) => b.id === id);

  const getRecordStatus = (record: BorrowRecord): 'overdue' | 'soon' | 'normal' => {
    if (record.actualReturnDate) return 'normal';
    if (isOverdue(record.expectedReturnDate)) return 'overdue';
    if (isSoonDue(record.expectedReturnDate, 3)) return 'soon';
    return 'normal';
  };

  const filteredRecords = records.filter((record) => {
    if (!searchQuery) return true;
    const book = getBookById(record.bookId);
    const query = searchQuery.toLowerCase();
    return (
      record.borrower.toLowerCase().includes(query) ||
      book?.title.toLowerCase().includes(query) ||
      book?.author.toLowerCase().includes(query)
    );
  });

  const handleSubmitCreate = async () => {
    if (!createForm.bookId) {
      toast.warning('请选择书籍');
      return;
    }
    if (!createForm.borrower.trim()) {
      toast.warning('请输入借出人');
      return;
    }
    if (!createForm.expectedReturnDate) {
      toast.warning('请选择归还日期');
      return;
    }

    try {
      await createRecord(createForm);
      toast.success('借阅登记成功');
      setShowCreateModal(false);
      setCreateForm({ bookId: '', borrower: '', borrowDate: getTodayString(), expectedReturnDate: '', enableReminder: true, notes: '' });
    } catch (error) {
      toast.error('登记失败');
    }
  };

  const handleReturn = async () => {
    if (!returningRecord) return;
    try {
      await returnBook(returningRecord.id, actualReturnDate);
      toast.success('归还登记成功');
      setShowReturnModal(false);
      setReturningRecord(null);
    } catch (error) {
      toast.error('登记失败');
    }
  };

  const handleDelete = async (record: BorrowRecord) => {
    const book = getBookById(record.bookId);
    if (window.confirm(`确定要删除《${book?.title}》的借阅记录吗？`)) {
      try {
        await deleteRecord(record.id);
        toast.success('删除成功');
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };

  const openReturnModal = (record: BorrowRecord) => {
    setReturningRecord(record);
    setActualReturnDate(getTodayString());
    setShowReturnModal(true);
  };

  const availableBooks = books.filter((book) => {
    const activeBorrow = records.find((r) => r.bookId === book.id && !r.actualReturnDate);
    return !activeBorrow;
  });

  const soonDueRecords = records.filter(
    (r) => !r.actualReturnDate && isSoonDue(r.expectedReturnDate, 3) && !isOverdue(r.expectedReturnDate)
  );
  const overdueRecords = records.filter((r) => !r.actualReturnDate && isOverdue(r.expectedReturnDate));

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-800">借阅管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeCount} 本借阅中 · {overdueCount} 本逾期 · {soonDueCount} 本即将到期
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          登记借出
        </button>
      </div>

      {showReminders && (overdueRecords.length > 0 || soonDueRecords.length > 0) && (
        <div className="mb-4 space-y-2">
          {overdueRecords.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">逾期提醒</p>
                <p className="text-sm text-red-600 mt-1">
                  有 {overdueRecords.length} 本书已逾期，请及时催还
                </p>
                <ul className="mt-2 space-y-1">
                  {overdueRecords.map((record) => {
                    const book = books.find((b) => b.id === record.bookId);
                    const daysOverdue = Math.ceil(
                      (Date.now() - new Date(record.expectedReturnDate).getTime()) / (24 * 60 * 60 * 1000)
                    );
                    return (
                      <li key={record.id} className="text-sm text-red-700 flex flex-wrap items-center gap-x-2">
                        <span className="font-medium">{record.borrower || '未知借出人'}</span>
                        <span>借走了《{book?.title || '未知书籍'}》</span>
                        <span className="text-red-500">（已逾期 {daysOverdue} 天）</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setShowReminders(false)}
                className="p-1 hover:bg-red-100 rounded"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}
          {soonDueRecords.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">即将到期提醒</p>
                <p className="text-sm text-yellow-600 mt-1">
                  有 {soonDueRecords.length} 本书将在 3 天内到期
                </p>
                <ul className="mt-2 space-y-1">
                  {soonDueRecords.map((record) => {
                    const book = books.find((b) => b.id === record.bookId);
                    const daysLeft = Math.ceil(
                      (new Date(record.expectedReturnDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
                    );
                    return (
                      <li key={record.id} className="text-sm text-yellow-700 flex flex-wrap items-center gap-x-2">
                        <span className="font-medium">{record.borrower || '未知借出人'}</span>
                        <span>借走了《{book?.title || '未知书籍'}》</span>
                        <span className="text-yellow-500">（还剩 {daysLeft} 天）</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setShowReminders(false)}
                className="p-1 hover:bg-yellow-100 rounded"
              >
                <X className="w-4 h-4 text-yellow-400" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.value === 'active' && activeCount > 0 && (
                <span className="bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {activeCount}
                </span>
              )}
              {tab.value === 'overdue' && overdueCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {overdueCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索书名、作者、借出人..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg mb-2">暂无借阅记录</p>
          <p className="text-sm mb-4">点击上方按钮登记第一本借出的书</p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            登记借出
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-auto space-y-3">
          {filteredRecords.map((record) => {
            const book = getBookById(record.bookId);
            const status = getRecordStatus(record);
            return (
              <div key={record.id} className="card p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    {book?.coverImage ? (
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
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif font-semibold text-gray-800 truncate">
                          {book?.title || '未知书籍'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">{book?.author}</p>
                      </div>
                      <span className={clsx('badge flex-shrink-0', `status-${status}`)}>
                        {record.actualReturnDate ? '已归还' : status === 'overdue' ? '已逾期' : status === 'soon' ? '即将到期' : '借阅中'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        借予：{record.borrower}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        借出：{formatDate(record.borrowDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        应还：{formatDate(record.expectedReturnDate)}
                      </span>
                      {record.actualReturnDate && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          实还：{formatDate(record.actualReturnDate)}
                        </span>
                      )}
                    </div>

                    {record.notes && (
                      <p className="text-sm text-gray-500 mt-2 bg-gray-50 rounded p-2">
                        备注：{record.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {!record.actualReturnDate && (
                      <button
                        type="button"
                        onClick={() => openReturnModal(record)}
                        className="btn-primary text-sm"
                      >
                        登记归还
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(record)}
                      className="btn-danger text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="登记借出"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择书籍 <span className="text-red-500">*</span>
            </label>
            <select
              value={createForm.bookId}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, bookId: e.target.value }))}
              className="input-field"
            >
              <option value="">请选择书籍</option>
              {availableBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} - {book.author}
                </option>
              ))}
            </select>
            {availableBooks.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">所有书籍都已借出</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              借出人 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={createForm.borrower}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, borrower: e.target.value }))}
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
              value={createForm.expectedReturnDate}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, expectedReturnDate: e.target.value }))}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={createForm.notes || ''}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="input-field min-h-[80px] resize-y"
              placeholder="可选备注信息"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmitCreate}
              className="btn-primary"
              disabled={availableBooks.length === 0}
            >
              确认登记
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showReturnModal}
        onClose={() => {
          setShowReturnModal(false);
          setReturningRecord(null);
        }}
        title="登记归还"
        size="sm"
      >
        <div className="space-y-4">
          {returningRecord && (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-800">
                  {getBookById(returningRecord.bookId)?.title || '未知书籍'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  借予：{returningRecord.borrower}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  实际归还日期
                </label>
                <input
                  type="date"
                  value={actualReturnDate}
                  onChange={(e) => setActualReturnDate(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnModal(false);
                    setReturningRecord(null);
                  }}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="button" onClick={handleReturn} className="btn-primary">
                  确认归还
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Borrow;
