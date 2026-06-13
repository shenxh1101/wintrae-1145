import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, ChevronDown, Trash2, Edit2, Home, Archive, Layers, Grid3X3, BookOpen, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useShelfStore } from '../../store/useShelfStore';
import { useBookStore } from '../../store/useBookStore';
import { useToast } from '../../store/useToastStore';
import { Modal } from '../../components/Modal/Modal';
import type { ShelfLocation, Book, LocationType, SaveLocationRequest } from '../../types';

const typeConfig: Record<LocationType, { label: string; icon: React.ReactNode; color: string }> = {
  room: { label: '房间', icon: <Home className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  cabinet: { label: '书柜', icon: <Archive className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700' },
  shelf: { label: '层', icon: <Layers className="w-4 h-4" />, color: 'bg-green-100 text-green-700' },
  slot: { label: '格', icon: <Grid3X3 className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700' },
};

const Shelf: React.FC = () => {
  const { locations, flatLocations, loading, selectedLocation, locationBooks, fetchLocations, fetchFlatLocations, saveLocation, deleteLocation, fetchBooksByLocation, setSelectedLocation } = useShelfStore();
  const { books, fetchBooks } = useBookStore();
  const toast = useToast();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ShelfLocation | null>(null);
  const [parentLocation, setParentLocation] = useState<ShelfLocation | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningBook, setAssigningBook] = useState<Book | null>(null);
  const [assignLocationId, setAssignLocationId] = useState('');

  const [formData, setFormData] = useState<SaveLocationRequest>({
    name: '',
    type: 'room',
    code: '',
    description: '',
    parentId: undefined,
  });

  useEffect(() => {
    fetchLocations();
    fetchFlatLocations();
    fetchBooks();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectLocation = (location: ShelfLocation) => {
    setSelectedLocation(location);
    fetchBooksByLocation(location.id);
  };

  const openCreateModal = (parent: ShelfLocation | null = null) => {
    setParentLocation(parent);
    const nextType: LocationType = parent ? (parent.type === 'room' ? 'cabinet' : parent.type === 'cabinet' ? 'shelf' : 'slot') : 'room';
    setFormData({
      name: '',
      type: nextType,
      code: '',
      description: '',
      parentId: parent?.id,
    });
    setShowCreateModal(true);
  };

  const openEditModal = (location: ShelfLocation) => {
    setEditingLocation(location);
    setFormData({
      id: location.id,
      name: location.name,
      type: location.type,
      code: location.code || '',
      description: location.description || '',
      parentId: location.parentId,
    });
    setShowEditModal(true);
  };

  const handleSubmitCreate = async () => {
    if (!formData.name.trim()) {
      toast.warning('请输入名称');
      return;
    }

    try {
      const location = await saveLocation(formData);
      toast.success(`添加${typeConfig[formData.type].label}成功`);
      setShowCreateModal(false);
      setExpandedIds((prev) => new Set(prev).add(location.id));
    } catch (error) {
      toast.error('添加失败');
    }
  };

  const handleSubmitEdit = async () => {
    if (!formData.name.trim()) {
      toast.warning('请输入名称');
      return;
    }

    try {
      await saveLocation(formData);
      toast.success('修改成功');
      setShowEditModal(false);
      setEditingLocation(null);
    } catch (error) {
      toast.error('修改失败');
    }
  };

  const handleDelete = async (location: ShelfLocation) => {
    if (window.confirm(`确定要删除「${location.name}」吗？子级位置也会被删除。`)) {
      try {
        await deleteLocation(location.id);
        toast.success('删除成功');
        if (selectedLocation?.id === location.id) {
          setSelectedLocation(null);
        }
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };

  const handleAssignBook = async () => {
    if (!assigningBook || !assignLocationId) return;
    try {
      await useShelfStore.getState().assignBook(assigningBook.id, assignLocationId);
      toast.success('分配成功');
      setShowAssignModal(false);
      setAssigningBook(null);
      if (selectedLocation) {
        fetchBooksByLocation(selectedLocation.id);
      }
    } catch (error) {
      toast.error('分配失败');
    }
  };

  const openAssignModal = (book: Book) => {
    setAssigningBook(book);
    setAssignLocationId('');
    setShowAssignModal(true);
  };

  const renderLocationTree = (items: ShelfLocation[], level: number = 0) => {
    return items.map((location) => {
      const hasChildren = location.children && location.children.length > 0;
      const isExpanded = expandedIds.has(location.id);
      const isSelected = selectedLocation?.id === location.id;
      const config = typeConfig[location.type];

      return (
        <div key={location.id}>
          <div
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors group',
              isSelected ? 'bg-primary-100' : 'hover:bg-gray-50'
            )}
            style={{ paddingLeft: `${12 + level * 20}px` }}
            onClick={() => handleSelectLocation(location)}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(location.id);
                }}
                className="p-0.5 hover:bg-white/50 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}

            <span className={clsx('p-1 rounded', config.color)}>
              {config.icon}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 truncate">{location.name}</span>
                {location.code && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {location.code}
                  </span>
                )}
              </div>
              {location.description && (
                <p className="text-xs text-gray-500 truncate">{location.description}</p>
              )}
            </div>

            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100">
              {location.bookCount || 0} 本
            </span>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
              {location.type !== 'slot' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCreateModal(location);
                  }}
                  className="p-1 hover:bg-white/50 rounded transition-colors"
                  title={`添加${typeConfig[location.type === 'room' ? 'cabinet' : location.type === 'cabinet' ? 'shelf' : 'slot'].label}`}
                >
                  <Plus className="w-4 h-4 text-gray-500" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(location);
                }}
                className="p-1 hover:bg-white/50 rounded transition-colors"
                title="编辑"
              >
                <Edit2 className="w-4 h-4 text-gray-500" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(location);
                }}
                className="p-1 hover:bg-red-50 rounded transition-colors"
                title="删除"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderLocationTree(location.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const slotLocations = flatLocations.filter((l) => l.type === 'slot');

  const getLocationPath = (locationId: string): string => {
    const path: string[] = [];
    let current = flatLocations.find((l) => l.id === locationId);
    while (current) {
      path.unshift(current.name);
      current = flatLocations.find((l) => l.id === current?.parentId);
    }
    return path.join(' / ');
  };

  const unassignedBooks = books.filter((b) => !b.shelfLocationId);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-800">书架管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            {flatLocations.length} 个位置 · {books.filter((b) => b.shelfLocationId).length} 本已上架
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreateModal(null)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加房间
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="w-[320px] flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-700">位置结构</h3>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                加载中...
              </div>
            ) : locations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Home className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm">暂无位置</p>
                <button
                  type="button"
                  onClick={() => openCreateModal(null)}
                  className="text-sm text-primary-600 hover:text-primary-700 mt-2"
                >
                  添加第一个房间
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {renderLocationTree(locations)}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedLocation ? (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('p-1.5 rounded', typeConfig[selectedLocation.type].color)}>
                        {typeConfig[selectedLocation.type].icon}
                      </span>
                      <h3 className="font-serif font-semibold text-lg text-gray-800">
                        {selectedLocation.name}
                      </h3>
                      {selectedLocation.code && (
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {selectedLocation.code}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {getLocationPath(selectedLocation.id)}
                    </p>
                    {selectedLocation.description && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded p-2">
                        {selectedLocation.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      {locationBooks.length}
                    </p>
                    <p className="text-sm text-gray-500">本书籍</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="font-medium text-gray-700">书籍列表</h4>
                  {selectedLocation.type === 'slot' && unassignedBooks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssigningBook(null);
                        setAssignLocationId(selectedLocation.id);
                        setShowAssignModal(true);
                      }}
                      className="btn-secondary text-sm"
                    >
                      分配书籍
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {locationBooks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                      <BookOpen className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-sm">此位置暂无书籍</p>
                      {selectedLocation.type === 'slot' && unassignedBooks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAssigningBook(null);
                            setAssignLocationId(selectedLocation.id);
                            setShowAssignModal(true);
                          }}
                          className="text-sm text-primary-600 hover:text-primary-700 mt-2"
                        >
                          分配书籍到此位置
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {locationBooks.map((book) => (
                        <div
                          key={book.id}
                          className="card p-3 group"
                        >
                          <div className="aspect-[3/4] bg-gray-100 rounded mb-2 overflow-hidden">
                            {book.coverImage ? (
                              <img
                                src={book.coverImage}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary-100">
                                <span className="text-primary-600 font-serif font-bold text-lg">
                                  {book.title.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <h4 className="font-serif font-medium text-gray-800 truncate text-sm">
                            {book.title}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">{book.author}</p>
                          <button
                            type="button"
                            onClick={() => openAssignModal(book)}
                            className="mt-2 w-full text-xs text-primary-600 hover:text-primary-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            更换位置
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg">请从左侧选择一个位置</p>
                <p className="text-sm mt-1">查看该位置的书籍或添加子位置</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setParentLocation(null);
        }}
        title={`添加${typeConfig[formData.type].label}`}
        size="md"
      >
        <div className="space-y-4">
          {parentLocation && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                父级：<span className="font-medium text-gray-800">{parentLocation.name}</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              类型
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as LocationType }))}
              className="input-field"
            >
              <option value="room">房间</option>
              <option value="cabinet">书柜</option>
              <option value="shelf">层</option>
              <option value="slot">格</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="input-field"
              placeholder={`请输入${typeConfig[formData.type].label}名称`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              编号
            </label>
            <input
              type="text"
              value={formData.code || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
              className="input-field"
              placeholder="可选，用于快速定位"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="input-field min-h-[80px] resize-y"
              placeholder="可选描述信息"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setParentLocation(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmitCreate}
              className="btn-primary"
            >
              添加
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingLocation(null);
        }}
        title="编辑位置"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              类型
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as LocationType }))}
              className="input-field"
            >
              <option value="room">房间</option>
              <option value="cabinet">书柜</option>
              <option value="shelf">层</option>
              <option value="slot">格</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="input-field"
              placeholder="请输入名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              编号
            </label>
            <input
              type="text"
              value={formData.code || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
              className="input-field"
              placeholder="可选，用于快速定位"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="input-field min-h-[80px] resize-y"
              placeholder="可选描述信息"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingLocation(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmitEdit}
              className="btn-primary"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setAssigningBook(null);
          setAssignLocationId('');
        }}
        title={assigningBook ? '更换位置' : '分配书籍'}
        size="md"
      >
        <div className="space-y-4">
          {assigningBook && (
            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
              <div className="w-12 h-16 bg-primary-100 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 font-serif font-bold">
                  {assigningBook.title.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-800">{assigningBook.title}</p>
                <p className="text-sm text-gray-500">{assigningBook.author}</p>
              </div>
            </div>
          )}

          {!assigningBook && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择书籍 <span className="text-red-500">*</span>
              </label>
              <select
                value={assigningBook?.id || ''}
                onChange={(e) => {
                  const book = unassignedBooks.find((b) => b.id === e.target.value);
                  setAssigningBook(book || null);
                }}
                className="input-field"
              >
                <option value="">请选择书籍</option>
                {unassignedBooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} - {book.author}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择位置 <span className="text-red-500">*</span>
            </label>
            <select
              value={assignLocationId}
              onChange={(e) => setAssignLocationId(e.target.value)}
              className="input-field"
            >
              <option value="">请选择格位</option>
              {slotLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {getLocationPath(loc.id)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowAssignModal(false);
                setAssigningBook(null);
                setAssignLocationId('');
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleAssignBook}
              className="btn-primary"
              disabled={!assigningBook || !assignLocationId}
            >
              确认分配
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Shelf;
