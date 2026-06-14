import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
  BookOpen, CheckCircle, Clock, AlertTriangle, Download, Upload,
  TrendingUp, DollarSign, Tag, Copy, FileJson, RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import { useStatsStore } from '../../store/useStatsStore';
import { useBookStore } from '../../store/useBookStore';
import { useBorrowStore } from '../../store/useBorrowStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useShelfStore } from '../../store/useShelfStore';
import { useToast } from '../../store/useToastStore';
import { Modal } from '../../components/Modal/Modal';
import type { GetStatsResponse, ExportDataRequest } from '../../types';

const COLORS = ['#8B6914', '#2D5A27', '#4A90A4', '#D4A574', '#8B4513'];

const Stats: React.FC = () => {
  const { stats, loading, fetchStats, exportData, saveExportFile, selectImportFile, importData } = useStatsStore();
  const { fetchBooks } = useBookStore();
  const borrowStore = useBorrowStore();
  const wishlistStore = useWishlistStore();
  const shelfStore = useShelfStore();
  const toast = useToast();

  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportDataRequest>({
    includeBooks: true,
    includeBorrow: true,
    includeWishlist: true,
    includeShelf: true,
    format: 'json',
    includeTypes: ['books', 'borrow', 'shelf', 'wishlist'],
  });
  const [importFilePath, setImportFilePath] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = async () => {
    await fetchStats();
    toast.success('数据已刷新');
  };

  const handleExport = async () => {
    try {
      const data = await exportData(exportOptions);
      const defaultName = `藏书阁备份_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      const filePath = await saveExportFile(data, defaultName);
      toast.success(`已导出到 ${filePath}`);
      setShowExportModal(false);
    } catch (error) {
      toast.error('导出失败');
    }
  };

  const handleSelectImportFile = async () => {
    try {
      const filePath = await selectImportFile();
      setImportFilePath(filePath);
    } catch (error) {
      toast.error('选择文件失败');
    }
  };

  const handleImport = async () => {
    if (!importFilePath) {
      toast.warning('请选择要导入的文件');
      return;
    }

    if (!window.confirm('导入数据将合并到现有数据中，确定要继续吗？')) {
      return;
    }

    setImporting(true);
    try {
      const result = await importData({ filePath: importFilePath });
      const total = result.importedCount + result.failedCount;

      if (result.importedCount === 0 && result.failedCount === 0) {
        toast.warning('没有可导入的数据，文件可能为空或格式不正确');
      } else if (result.failedCount === 0) {
        toast.success(`全部导入成功！共 ${result.importedCount} 条（${result.details || '无详细信息'}）`);
      } else if (result.importedCount > 0 && result.failedCount > 0) {
        toast.warning(`部分导入成功：成功 ${result.importedCount} 条，失败 ${result.failedCount} 条（${result.details}）`);
      } else {
        toast.error(`全部导入失败，共 ${result.failedCount} 条。请检查文件格式是否正确`);
      }

      setShowImportModal(false);
      setImportFilePath('');

      const refreshTasks: Promise<void>[] = [];
      refreshTasks.push(fetchStats());
      refreshTasks.push(fetchBooks());

      if (result.importedCount > 0 || total > 0) {
        refreshTasks.push(borrowStore.fetchRecords());
        refreshTasks.push(wishlistStore.fetchAll());
        refreshTasks.push(shelfStore.fetchLocations());
        refreshTasks.push(shelfStore.fetchFlatLocations());
      }

      await Promise.all(refreshTasks.map(p => p.catch(() => void 0)));
    } catch (error) {
      toast.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const s = stats as GetStatsResponse;

  const readingProgressData = [
    { name: '未读', value: s?.readingStatus?.unread || 0 },
    { name: '在读', value: s?.readingStatus?.reading || 0 },
    { name: '已读', value: s?.readingStatus?.read || 0 },
  ];

  const monthlyPurchaseData = s?.monthlyPurchases?.map((item) => ({
    name: item.month,
    数量: item.count,
    金额: item.amount,
  })) || [];

  const tagDistributionData = s?.tagDistribution?.map((item) => ({
    name: item.tag,
    value: item.count,
  })) || [];

  const totalBooks = s?.totalBooks || 0;
  const readCount = s?.readingStatus?.read || 0;
  const readingRate = totalBooks > 0 ? (readCount / totalBooks) * 100 : 0;
  const unreadCount = s?.readingStatus?.unread || 0;
  const totalValue = s?.totalValue || 0;
  const duplicateCount = s?.duplicates?.length || 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-800">数据统计</h1>
          <p className="text-sm text-gray-500 mt-1">
            全面了解你的藏书阅读情况
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            导入
          </button>
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">藏书总数</span>
            <BookOpen className="w-4 h-4 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalBooks}</p>
          <p className="text-xs text-gray-500 mt-2">
            总价值 ¥{totalValue.toFixed(2)}
          </p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">阅读完成率</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{readingRate.toFixed(1)}%</p>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${readingRate}%` }}
            />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">未读数量</span>
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{unreadCount}</p>
          <p className="text-xs text-gray-500 mt-2">
            占比 {totalBooks > 0 ? ((unreadCount / totalBooks) * 100).toFixed(1) : 0}%
          </p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">重复书籍</span>
            <Copy className="w-4 h-4 text-red-500" />
          </div>
          <p className={clsx(
            'text-3xl font-bold',
            duplicateCount > 0 ? 'text-red-600' : 'text-gray-800'
          )}>
            {duplicateCount}
          </p>
          {duplicateCount > 0 && (
            <p className="text-xs text-red-500 mt-2">请检查重复书籍</p>
          )}
        </div>
      </div>

      {duplicateCount > 0 && Array.isArray(s?.duplicates) && (
        <div className="card p-4 mb-6 border-l-4 border-l-red-400">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-medium text-gray-800">重复书籍提醒</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {s.duplicates.map((dup, index) => {
              if (!Array.isArray(dup) || dup.length === 0) return null;
              return (
                <div key={index} className="bg-red-50 rounded-lg p-3">
                  <p className="font-medium text-gray-800">{dup[0]?.title || '未知书籍'}</p>
                  {dup[0]?.author && (
                    <p className="text-sm text-gray-500">{dup[0].author}</p>
                  )}
                  <p className="text-xs text-red-600 mt-1">
                    共有 {dup.length} 本重复
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-serif font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              阅读进度分布
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={readingProgressData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {readingProgressData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-serif font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary-500" />
              年度购书统计
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyPurchaseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="数量" fill="#8B6914" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="金额" fill="#2D5A27" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {tagDistributionData.length > 0 && (
          <div className="card p-6">
            <h3 className="font-serif font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-accent-500" />
              标签分布
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tagDistributionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8B6914" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {Array.isArray(s?.recentAdditions) && s.recentAdditions.length > 0 && (
          <div className="card p-6">
            <h3 className="font-serif font-semibold text-gray-800 mb-4">最近添加</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {s.recentAdditions.map((book) => {
                if (!book || !book.id) return null;
                return (
                  <div key={book.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-gray-800 truncate">{book.title || '未知书名'}</p>
                    <p className="text-sm text-gray-500 truncate">{book.author || '未知作者'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {book.purchaseDate || (book.createdAt ? (book.createdAt as string).split('T')[0] : '未知日期')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="card p-6">
          <h3 className="font-serif font-semibold text-gray-800 mb-4">数据概览</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{s?.totalBooks || 0}</p>
              <p className="text-xs text-gray-500">藏书总数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{s?.totalAuthors || 0}</p>
              <p className="text-xs text-gray-500">作者数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{s?.totalTags || 0}</p>
              <p className="text-xs text-gray-500">标签数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{s?.borrowedCount || 0}</p>
              <p className="text-xs text-gray-500">借出中</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{s?.wishlistCount || 0}</p>
              <p className="text-xs text-gray-500">愿望单</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{s?.shelfLocationCount || 0}</p>
              <p className="text-xs text-gray-500">书架位置</p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="导出数据"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              导出格式
            </label>
            <div className="flex gap-3">
              {(['json', 'csv'] as const).map((format) => (
                <label
                  key={format}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors',
                    exportOptions.format === format
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format}
                    checked={exportOptions.format === format}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        format: e.target.value as 'json' | 'csv',
                      }))
                    }
                    className="hidden"
                  />
                  <FileJson className="w-4 h-4" />
                  {format.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              导出内容
            </label>
            <div className="space-y-2">
              {[
                { key: 'includeBooks', label: '书籍数据' },
                { key: 'includeBorrow', label: '借阅记录' },
                { key: 'includeWishlist', label: '愿望单' },
                { key: 'includeShelf', label: '书架位置' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!!(exportOptions as any)[item.key]}
                    onChange={(e) => {
                      const keyMap: Record<string, string> = {
                        includeBooks: 'books',
                        includeBorrow: 'borrow',
                        includeWishlist: 'wishlist',
                        includeShelf: 'shelf',
                      };
                      const typeKey = keyMap[item.key];
                      setExportOptions((prev) => {
                        const newIncludeTypes = e.target.checked
                          ? [...prev.includeTypes, typeKey as any]
                          : prev.includeTypes.filter((t) => t !== typeKey);
                        return {
                          ...prev,
                          [item.key]: e.target.checked,
                          includeTypes: newIncludeTypes as any,
                        };
                      });
                    }}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowExportModal(false)}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="btn-primary"
            >
              导出
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportFilePath('');
        }}
        title="导入数据"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <AlertTriangle className="w-4 h-4 inline-block mr-1" />
              导入的数据将与现有数据合并，不会删除现有数据。支持 JSON 和 CSV 格式。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择文件
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={importFilePath}
                readOnly
                placeholder="点击右侧按钮选择文件"
                className="input-field flex-1 bg-gray-50"
              />
              <button
                type="button"
                onClick={handleSelectImportFile}
                className="btn-secondary whitespace-nowrap"
              >
                <Upload className="w-4 h-4 inline-block mr-1" />
                选择文件
              </button>
            </div>
          </div>

          {importFilePath && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <CheckCircle className="w-4 h-4 inline-block mr-1" />
                已选择文件：{importFilePath.split('\\').pop()}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowImportModal(false);
                setImportFilePath('');
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="btn-primary"
              disabled={!importFilePath || importing}
            >
              {importing ? '导入中...' : '导入'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Stats;
