import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ShoppingCart, DollarSign, Flag, Calendar, Target, X, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useToast } from '../../store/useToastStore';
import { Modal } from '../../components/Modal/Modal';
import { formatDate, getTodayString } from '../../utils/date';
import type { WishItem, Priority, SaveWishItemRequest, SetBudgetRequest } from '../../types';

const priorityConfig: Record<Priority, { label: string; color: string; bgColor: string }> = {
  high: { label: '高', color: 'text-red-600', bgColor: 'bg-red-100' },
  medium: { label: '中', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  low: { label: '低', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

const Wishlist: React.FC = () => {
  const { items, budget, loading, priorityFilter, fetchAll, fetchPurchasedHistory, saveItem, deleteItem, setBudget, markAsPurchased, setPriorityFilter, getFilteredItems, getMonthlySpent, getYearlySpent } = useWishlistStore();
  const toast = useToast();

  const [showItemModal, setShowItemModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WishItem | null>(null);
  const [purchasingItem, setPurchasingItem] = useState<WishItem | null>(null);

  const [itemForm, setItemForm] = useState<SaveWishItemRequest>({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    expectedPrice: undefined,
    priority: 'medium',
    notes: '',
    sourceUrl: '',
  });

  const [budgetForm, setBudgetForm] = useState<SetBudgetRequest>({
    year: new Date().getFullYear(),
    monthlyAmount: 0,
    monthlyBudget: 0,
    yearlyBudget: 0,
  });

  const [purchaseForm, setPurchaseForm] = useState({
    actualPrice: 0,
    purchaseDate: getTodayString(),
  });

  const [showHistory, setShowHistory] = useState(false);
  const [purchasedHistory, setPurchasedHistory] = useState<WishItem[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredItems = getFilteredItems();
  const monthlySpent = getMonthlySpent() || 0;
  const yearlySpent = getYearlySpent() || 0;

  const totalExpectedPrice = filteredItems.reduce((sum, item) => sum + (item.expectedPrice || item.estimatedPrice || 0), 0);

  const openAddModal = () => {
    setEditingItem(null);
    setItemForm({
      title: '',
      author: '',
      isbn: '',
      publisher: '',
      expectedPrice: undefined,
      priority: 'medium',
      notes: '',
      sourceUrl: '',
    });
    setShowItemModal(true);
  };

  const openEditModal = (item: WishItem) => {
    setEditingItem(item);
    setItemForm({
      id: item.id,
      title: item.title,
      author: item.author || '',
      isbn: item.isbn || '',
      publisher: item.publisher || '',
      expectedPrice: item.expectedPrice,
      priority: item.priority,
      notes: item.notes || '',
      sourceUrl: item.sourceUrl || '',
    });
    setShowItemModal(true);
  };

  const handleSubmitItem = async () => {
    if (!itemForm.title.trim()) {
      toast.warning('请输入书名');
      return;
    }

    try {
      await saveItem(itemForm);
      toast.success(editingItem ? '修改成功' : '添加成功');
      setShowItemModal(false);
      setEditingItem(null);
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const handleDeleteItem = async (item: WishItem) => {
    if (window.confirm(`确定要删除《${item.title}》吗？`)) {
      try {
        await deleteItem(item.id);
        toast.success('删除成功');
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };

  const openPurchaseModal = (item: WishItem) => {
    setPurchasingItem(item);
    setPurchaseForm({
      actualPrice: item.expectedPrice || 0,
      purchaseDate: getTodayString(),
    });
    setShowPurchaseModal(true);
  };

  const handleMarkAsPurchased = async () => {
    if (!purchasingItem) return;
    if (!purchaseForm.actualPrice || purchaseForm.actualPrice <= 0) {
      toast.warning('请输入实际购买价格');
      return;
    }

    try {
      await markAsPurchased({
        itemId: purchasingItem.id,
        wishItemId: purchasingItem.id,
        actualPrice: purchaseForm.actualPrice,
        purchaseDate: purchaseForm.purchaseDate,
        createBookRecord: true,
      });
      toast.success('已标记为已购买');
      setShowPurchaseModal(false);
      setPurchasingItem(null);
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const openBudgetModal = () => {
    if (budget) {
      setBudgetForm({
        year: budget.year,
        monthlyAmount: budget.monthlyAmount,
        monthlyBudget: budget.monthlyBudget || budget.monthlyAmount,
        yearlyBudget: budget.yearlyBudget || budget.monthlyAmount * 12,
      });
    } else {
      setBudgetForm({
        year: new Date().getFullYear(),
        monthlyAmount: 0,
        monthlyBudget: 0,
        yearlyBudget: 0,
      });
    }
    setShowBudgetModal(true);
  };

  const handleSaveBudget = async () => {
    if (!budgetForm.monthlyAmount || budgetForm.monthlyAmount <= 0) {
      toast.warning('请输入有效的预算金额');
      return;
    }

    try {
      await setBudget(budgetForm);
      toast.success('预算设置成功');
      setShowBudgetModal(false);
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const loadHistory = async () => {
    const history = await fetchPurchasedHistory();
    setPurchasedHistory(history);
    setShowHistory(true);
  };

  const budgetUsedPercent = budget && (budget.monthlyAmount || budget.monthlyBudget || 0) > 0
    ? Math.min((yearlySpent / ((budget.monthlyAmount || budget.monthlyBudget || 0) * 12)) * 100, 100)
    : 0;
  const monthlyBudgetUsedPercent = budget && (budget.monthlyAmount || budget.monthlyBudget || 0) > 0
    ? Math.min((monthlySpent / (budget.monthlyAmount || budget.monthlyBudget || 0)) * 100, 100)
    : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-800">愿望单</h1>
          <p className="text-sm text-gray-500 mt-1">
            {items.length} 本想读 · 预计花费 ¥{totalExpectedPrice.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadHistory}
            className="btn-secondary"
          >
            购买历史
          </button>
          <button
            type="button"
            onClick={openBudgetModal}
            className="btn-secondary flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            设置预算
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加书籍
          </button>
        </div>
      </div>

      {budget && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">年度预算</span>
              <Target className="w-4 h-4 text-primary-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              ¥{(budget.monthlyAmount * 12).toFixed(0)}
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>已使用</span>
                <span>¥{yearlySpent.toFixed(2)} / ¥{(budget.monthlyAmount * 12).toFixed(0)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all',
                    budgetUsedPercent > 90 ? 'bg-red-500' : budgetUsedPercent > 70 ? 'bg-yellow-500' : 'bg-primary-500'
                  )}
                  style={{ width: `${budgetUsedPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">本月预算</span>
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              ¥{budget.monthlyAmount.toFixed(0)}
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>已使用</span>
                <span>¥{monthlySpent.toFixed(2)} / ¥{budget.monthlyAmount.toFixed(0)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all',
                    monthlyBudgetUsedPercent > 90 ? 'bg-red-500' : monthlyBudgetUsedPercent > 70 ? 'bg-yellow-500' : 'bg-blue-500'
                  )}
                  style={{ width: `${monthlyBudgetUsedPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">愿望单总值</span>
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              ¥{totalExpectedPrice.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-3">
              {filteredItems.length} 本书待购买
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
          {(['all', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                priorityFilter === p
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              {p !== 'all' && <Flag className="w-3.5 h-3.5" />}
              {p === 'all' ? '全部' : priorityConfig[p].label}
              {p !== 'all' && (
                <span className="text-xs">
                  ({items.filter((i) => i.priority === p).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg mb-2">愿望单是空的</p>
          <p className="text-sm mb-4">添加你想读的书，设置预算和优先级</p>
          <button
            type="button"
            onClick={openAddModal}
            className="btn-primary"
          >
            添加第一本书
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="card p-4 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-semibold text-gray-800 truncate">
                      {item.title}
                    </h3>
                    {item.author && (
                      <p className="text-sm text-gray-500 mt-0.5">{item.author}</p>
                    )}
                  </div>
                  <span
                    className={clsx(
                      'badge flex-shrink-0',
                      priorityConfig[item.priority].bgColor,
                      priorityConfig[item.priority].color
                    )}
                  >
                    {priorityConfig[item.priority].label}优先级
                  </span>
                </div>

                {(item.isbn || item.publisher) && (
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                    {item.isbn && <span>ISBN: {item.isbn}</span>}
                    {item.publisher && <span>{item.publisher}</span>}
                  </div>
                )}

                {(item.expectedPrice !== undefined && item.expectedPrice !== null && !isNaN(Number(item.expectedPrice))) && (
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-primary-500" />
                    <span className="text-lg font-bold text-primary-600">
                      ¥{Number(item.expectedPrice || item.estimatedPrice || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                {item.notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded p-2 mb-3 line-clamp-2">
                    {item.notes}
                  </p>
                )}

                {item.addedDate && !isNaN(new Date(item.addedDate).getTime()) && (
                  <p className="text-xs text-gray-400 mb-3">
                    添加于 {formatDate(item.addedDate)}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openPurchaseModal(item)}
                    className="flex-1 btn-primary text-sm flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    已购买
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        title={editingItem ? '编辑书籍' : '添加书籍'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              书名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={itemForm.title}
              onChange={(e) => setItemForm((prev) => ({ ...prev, title: e.target.value }))}
              className="input-field"
              placeholder="请输入书名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作者
            </label>
            <input
              type="text"
              value={itemForm.author || ''}
              onChange={(e) => setItemForm((prev) => ({ ...prev, author: e.target.value }))}
              className="input-field"
              placeholder="请输入作者"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ISBN
              </label>
              <input
                type="text"
                value={itemForm.isbn || ''}
                onChange={(e) => setItemForm((prev) => ({ ...prev, isbn: e.target.value }))}
                className="input-field"
                placeholder="可选"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                出版社
              </label>
              <input
                type="text"
                value={itemForm.publisher || ''}
                onChange={(e) => setItemForm((prev) => ({ ...prev, publisher: e.target.value }))}
                className="input-field"
                placeholder="可选"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                预计价格 (¥)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={itemForm.expectedPrice ?? ''}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    expectedPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="input-field"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                优先级
              </label>
              <select
                value={itemForm.priority}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    priority: e.target.value as Priority,
                  }))
                }
                className="input-field"
              >
                <option value="high">高优先级</option>
                <option value="medium">中优先级</option>
                <option value="low">低优先级</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              来源链接
            </label>
            <input
              type="url"
              value={itemForm.sourceUrl || ''}
              onChange={(e) => setItemForm((prev) => ({ ...prev, sourceUrl: e.target.value }))}
              className="input-field"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              value={itemForm.notes || ''}
              onChange={(e) => setItemForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="input-field min-h-[80px] resize-y"
              placeholder="可选备注信息"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowItemModal(false);
                setEditingItem(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmitItem}
              className="btn-primary"
            >
              {editingItem ? '保存修改' : '添加'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        title="设置购书预算"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              年份
            </label>
            <input
              type="number"
              min="2020"
              max="2030"
              value={budgetForm.year}
              onChange={(e) =>
                setBudgetForm((prev) => ({
                  ...prev,
                  year: parseInt(e.target.value),
                }))
              }
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              月度预算 (¥)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={budgetForm.monthlyAmount || ''}
              onChange={(e) =>
                setBudgetForm((prev) => ({
                  ...prev,
                  monthlyAmount: parseFloat(e.target.value) || 0,
                }))
              }
              className="input-field"
              placeholder="0.00"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              年度预算：<span className="font-medium text-gray-800">¥{(budgetForm.monthlyAmount * 12).toFixed(2)}</span>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowBudgetModal(false)}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveBudget}
              className="btn-primary"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPurchaseModal}
        onClose={() => {
          setShowPurchaseModal(false);
          setPurchasingItem(null);
        }}
        title="标记为已购买"
        size="sm"
      >
        <div className="space-y-4">
          {purchasingItem && (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-800">{purchasingItem.title}</p>
                {purchasingItem.author && (
                  <p className="text-sm text-gray-500 mt-0.5">{purchasingItem.author}</p>
                )}
                {purchasingItem.expectedPrice !== undefined && (
                  <p className="text-sm text-primary-600 mt-1">
                    预计价格：¥{purchasingItem.expectedPrice.toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  实际购买价格 (¥) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={purchaseForm.actualPrice || ''}
                  onChange={(e) =>
                    setPurchaseForm((prev) => ({
                      ...prev,
                      actualPrice: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="input-field"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  购买日期
                </label>
                <input
                  type="date"
                  value={purchaseForm.purchaseDate}
                  onChange={(e) =>
                    setPurchaseForm((prev) => ({
                      ...prev,
                      purchaseDate: e.target.value,
                    }))
                  }
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setPurchasingItem(null);
                  }}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleMarkAsPurchased}
                  className="btn-primary"
                >
                  确认
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="购买历史"
        size="lg"
      >
        <div className="space-y-3 max-h-[60vh] overflow-auto">
          {purchasedHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>暂无购买记录</p>
            </div>
          ) : (
            purchasedHistory.map((item) => (
              <div key={item.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-serif font-medium text-gray-800">{item.title}</h4>
                    {item.author && (
                      <p className="text-sm text-gray-500">{item.author}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">
                      ¥{item.actualPrice?.toFixed(2)}
                    </p>
                    {item.purchaseDate && (
                      <p className="text-xs text-gray-500">
                        {formatDate(item.purchaseDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowHistory(false)}
            className="btn-secondary"
          >
            关闭
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Wishlist;
