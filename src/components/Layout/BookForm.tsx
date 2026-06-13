import React, { useState, useEffect } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import type { Book, SaveBookRequest, ShelfLocation, Tag, ReadingStatus } from '../../types';
import { Rating } from '../Rating/Rating';
import { TagInput } from '../TagInput/TagInput';
import { useIPC } from '../../hooks/useIPC';
import { useToast } from '../../store/useToastStore';
import { getTodayString } from '../../utils/date';

interface BookFormProps {
  book?: Book | null;
  tags: Tag[];
  locations: ShelfLocation[];
  onSubmit: (data: SaveBookRequest) => void;
  onCancel: () => void;
}

const initialFormData: SaveBookRequest = {
  title: '',
  author: '',
  isbn: '',
  publisher: '',
  publishDate: '',
  purchasePrice: undefined,
  purchaseDate: getTodayString(),
  status: 'unread',
  rating: undefined,
  notes: '',
  coverImage: undefined,
  tags: [],
  shelfLocationId: undefined,
};

export const BookForm: React.FC<BookFormProps> = ({
  book,
  tags,
  locations,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<SaveBookRequest>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { file } = useIPC();
  const toast = useToast();

  useEffect(() => {
    if (book) {
      setFormData({
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn || '',
        publisher: book.publisher || '',
        publishDate: book.publishDate || '',
        purchasePrice: book.purchasePrice,
        purchaseDate: book.purchaseDate || getTodayString(),
        status: book.status,
        rating: book.rating,
        notes: book.notes || '',
        coverImage: book.coverImage,
        tags: [...book.tags],
        shelfLocationId: book.shelfLocationId,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [book]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = '请输入书名';
    }
    if (!formData.author.trim()) {
      newErrors.author = '请输入作者';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleCoverUpload = async () => {
    try {
      const filePath = await file.selectImage();
      if (formData.id) {
        const savedPath = await file.saveCover(formData.id, filePath);
        setFormData((prev) => ({ ...prev, coverImage: savedPath }));
        toast.success('封面上传成功');
      } else {
        toast.info('请先保存书籍后再上传封面');
      }
    } catch (error) {
      toast.error('封面上传失败');
    }
  };

  const handleIsbnLookup = async () => {
    if (!formData.isbn) {
      toast.warning('请先输入 ISBN');
      return;
    }
    toast.info('ISBN 自动查询功能需要联网API，此处省略');
  };

  const locationOptions = locations.filter((l) => l.type === 'slot');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            封面
          </label>
          <div
            className="aspect-[3/4] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors overflow-hidden"
            onClick={handleCoverUpload}
          >
            {formData.coverImage ? (
              <div className="relative w-full h-full">
                <img
                  src={formData.coverImage}
                  alt="封面"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData((prev) => ({ ...prev, coverImage: undefined }));
                  }}
                  className="absolute top-2 right-2 p-1 bg-white/90 rounded-full hover:bg-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center p-4">
                <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">点击上传封面</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                书名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                placeholder="请输入书名"
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                作者 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, author: e.target.value }))
                }
                className={`input-field ${errors.author ? 'border-red-500' : ''}`}
                placeholder="请输入作者"
              />
              {errors.author && (
                <p className="text-xs text-red-500 mt-1">{errors.author}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ISBN
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isbn: e.target.value }))
                  }
                  className="input-field flex-1"
                  placeholder="输入ISBN"
                />
                <button
                  type="button"
                  onClick={handleIsbnLookup}
                  className="btn-secondary whitespace-nowrap"
                >
                  查询
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                出版社
              </label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, publisher: e.target.value }))
                }
                className="input-field"
                placeholder="出版社名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                出版日期
              </label>
              <input
                type="date"
                value={formData.publishDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, publishDate: e.target.value }))
                }
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                购买日期
              </label>
              <input
                type="date"
                value={formData.purchaseDate || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))
                }
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                购买价格 (¥)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.purchasePrice ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    purchasePrice: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  }))
                }
                className="input-field"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                阅读状态
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as ReadingStatus,
                  }))
                }
                className="input-field"
              >
                <option value="unread">未读</option>
                <option value="reading">在读</option>
                <option value="read">已读</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                评分
              </label>
              <div className="py-2">
                <Rating
                  value={formData.rating || 0}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, rating: value }))
                  }
                  showValue
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                书架位置
              </label>
              <select
                value={formData.shelfLocationId || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shelfLocationId: e.target.value || undefined,
                  }))
                }
                className="input-field"
              >
                <option value="">未分配</option>
                {locationOptions.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.code ? `${loc.code} - ` : ''}{loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签
              </label>
              <TagInput
                value={formData.tags}
                onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
                availableTags={tags}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                笔记
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="input-field min-h-[100px] resize-y"
                placeholder="记录阅读心得..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="btn-secondary">
          取消
        </button>
        <button type="submit" className="btn-primary">
          {book ? '保存修改' : '添加书籍'}
        </button>
      </div>
    </form>
  );
};
