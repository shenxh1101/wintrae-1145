import { ipcMain, dialog } from 'electron';
import { getDatabase, rowToBook, rowToBorrowRecord, rowToLocation, rowToWishItem } from '../database';
import fs from 'fs';
import path from 'path';
import type {
  GetStatsResponse,
  ExportDataRequest,
  ImportDataRequest,
  Book,
} from '../../shared/types';

function findDuplicateBooks(db: any): Book[][] {
  const rows = db.prepare(`
    SELECT b.*, GROUP_CONCAT(t.name) as tag_names
    FROM books b
    LEFT JOIN book_tags bt ON b.id = bt.book_id
    LEFT JOIN tags t ON bt.tag_id = t.id
    GROUP BY b.id
    ORDER BY b.title, b.author
  `).all() as any[];

  const bookMap = new Map<string, Book[]>();
  for (const row of rows) {
    const key = `${row.title.toLowerCase().trim()}|${row.author.toLowerCase().trim()}`;
    const tags = row.tag_names ? row.tag_names.split(',') : [];
    const book = rowToBook(row, tags);
    if (!bookMap.has(key)) {
      bookMap.set(key, []);
    }
    bookMap.get(key)!.push(book);
  }

  return Array.from(bookMap.values()).filter(group => group.length > 1);
}

export function registerStatsIPC(): void {
  ipcMain.handle('stats:get', async (): Promise<{ success: boolean; data?: GetStatsResponse; error?: string }> => {
    try {
      const db = getDatabase();
      const currentYear = new Date().getFullYear();

      const totalResult = db.prepare('SELECT COUNT(*) as count FROM books').get() as { count: number };
      const readResult = db.prepare("SELECT COUNT(*) as count FROM books WHERE status = 'read'").get() as { count: number };
      const readingResult = db.prepare("SELECT COUNT(*) as count FROM books WHERE status = 'reading'").get() as { count: number };
      const unreadResult = db.prepare("SELECT COUNT(*) as count FROM books WHERE status = 'unread'").get() as { count: number };
      const valueResult = db.prepare('SELECT COALESCE(SUM(purchase_price), 0) as total FROM books').get() as { total: number };

      const authorResult = db.prepare('SELECT COUNT(DISTINCT author) as count FROM books').get() as { count: number };
      const tagCountResult = db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number };
      const borrowResult = db.prepare("SELECT COUNT(*) as count FROM borrow_records WHERE actual_return_date IS NULL").get() as { count: number };
      const wishlistResult = db.prepare('SELECT COUNT(*) as count FROM wishlist_items WHERE purchased = 0').get() as { count: number };
      const shelfResult = db.prepare('SELECT COUNT(*) as count FROM shelf_locations').get() as { count: number };

      const yearlyRows = db.prepare(`
        SELECT
          CAST(strftime('%Y', purchase_date) as INTEGER) as year,
          COUNT(*) as count,
          COALESCE(SUM(purchase_price), 0) as amount
        FROM books
        WHERE purchase_date IS NOT NULL
        GROUP BY year
        ORDER BY year DESC
        LIMIT 10
      `).all() as any[];

      const monthlyRows = db.prepare(`
        SELECT
          strftime('%Y-%m', purchase_date) as month,
          COUNT(*) as count,
          COALESCE(SUM(purchase_price), 0) as amount
        FROM books
        WHERE purchase_date IS NOT NULL
          AND strftime('%Y', purchase_date) = ?
        GROUP BY month
        ORDER BY month ASC
      `).all(currentYear.toString()) as any[];

      const tagRows = db.prepare(`
        SELECT t.name as tag, COUNT(*) as count
        FROM tags t
        JOIN book_tags bt ON t.id = bt.tag_id
        GROUP BY t.id
        ORDER BY count DESC
        LIMIT 15
      `).all() as any[];

      const recentRows = db.prepare(`
        SELECT b.*, GROUP_CONCAT(t.name) as tag_names
        FROM books b
        LEFT JOIN book_tags bt ON b.id = bt.book_id
        LEFT JOIN tags t ON bt.tag_id = t.id
        GROUP BY b.id
        ORDER BY b.created_at DESC
        LIMIT 10
      `).all() as any[];

      const duplicateBooks = findDuplicateBooks(db);

      const recentAdditions = recentRows.map((row: any) => {
        const tags = row.tag_names ? row.tag_names.split(',') : [];
        return rowToBook(row, tags);
      });

      return {
        success: true,
        data: {
          totalBooks: totalResult.count,
          readBooks: readResult.count,
          readingBooks: readingResult.count,
          unreadBooks: unreadResult.count,
          totalValue: valueResult.total,
          readingStatus: {
            unread: unreadResult.count,
            reading: readingResult.count,
            read: readResult.count,
          },
          yearlyPurchase: yearlyRows.map(r => ({ year: r.year, count: r.count, amount: r.amount })),
          monthlyPurchase: monthlyRows.map(r => ({ month: r.month, count: r.count, amount: r.amount })),
          monthlyPurchases: monthlyRows.map(r => ({ month: r.month, count: r.count, amount: r.amount })),
          booksByTag: tagRows.map(r => ({ tag: r.tag, count: r.count })),
          tagDistribution: tagRows.map(r => ({ tag: r.tag, count: r.count })),
          duplicateBooks,
          duplicates: duplicateBooks,
          recentAdditions,
          totalAuthors: authorResult.count,
          totalTags: tagCountResult.count,
          borrowedCount: borrowResult.count,
          wishlistCount: wishlistResult.count,
          shelfLocationCount: shelfResult.count,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('stats:export', async (_event, req: ExportDataRequest): Promise<{ success: boolean; data?: string; error?: string }> => {
    try {
      const db = getDatabase();
      const result: any = {};

      if (req.includeTypes.includes('books')) {
        const bookRows = db.prepare(`
          SELECT b.*, GROUP_CONCAT(t.name) as tag_names
          FROM books b
          LEFT JOIN book_tags bt ON b.id = bt.book_id
          LEFT JOIN tags t ON bt.tag_id = t.id
          GROUP BY b.id
        `).all() as any[];
        result.books = bookRows.map(r => {
          const tags = r.tag_names ? r.tag_names.split(',') : [];
          return rowToBook(r, tags);
        });
      }

      if (req.includeTypes.includes('borrow')) {
        const borrowRows = db.prepare('SELECT * FROM borrow_records').all() as any[];
        result.borrowRecords = borrowRows.map(rowToBorrowRecord);
      }

      if (req.includeTypes.includes('shelf')) {
        const shelfRows = db.prepare('SELECT * FROM shelf_locations').all() as any[];
        result.shelfLocations = shelfRows.map(rowToLocation);
      }

      if (req.includeTypes.includes('wishlist')) {
        const wishRows = db.prepare('SELECT * FROM wishlist_items').all() as any[];
        result.wishlistItems = wishRows.map(rowToWishItem);
      }

      let data: string;
      if (req.format === 'json') {
        data = JSON.stringify(result, null, 2);
      } else {
        const lines: string[] = [];
        if (result.books) {
          lines.push('=== 书籍数据 ===');
          lines.push('ID,ISBN,书名,作者,出版社,出版日期,购买价格,购买日期,阅读状态,评分,标签,位置ID,创建时间');
          for (const book of result.books) {
            lines.push([
              book.id,
              book.isbn || '',
              `"${book.title.replace(/"/g, '""')}"`,
              `"${book.author.replace(/"/g, '""')}"`,
              book.publisher ? `"${book.publisher.replace(/"/g, '""')}"` : '',
              book.publishDate || '',
              book.purchasePrice || '',
              book.purchaseDate || '',
              book.status,
              book.rating || '',
              `"${book.tags.join(';')}"`,
              book.shelfLocationId || '',
              book.createdAt,
            ].join(','));
          }
        }
        data = lines.join('\n');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('stats:saveExportFile', async (_event, data: string, defaultName: string): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    try {
      const result = await dialog.showSaveDialog({
        title: '导出数据',
        defaultPath: defaultName,
        filters: [
          { name: 'JSON 文件', extensions: ['json'] },
          { name: 'CSV 文件', extensions: ['csv'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: '用户取消' };
      }

      fs.writeFileSync(result.filePath, data, 'utf-8');
      return { success: true, filePath: result.filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('stats:selectImportFile', async (): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    try {
      const result = await dialog.showOpenDialog({
        title: '导入数据',
        properties: ['openFile'],
        filters: [
          { name: 'JSON/CSV 文件', extensions: ['json', 'csv'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: '用户取消' };
      }

      return { success: true, filePath: result.filePaths[0] };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('stats:import', async (_event, req: ImportDataRequest): Promise<{ success: boolean; importedCount?: number; error?: string }> => {
    try {
      const db = getDatabase();
      let importedCount = 0;

      let format = req.format;
      let data = req.data;
      const overwrite = req.overwrite || false;

      if (req.filePath && !data) {
        const ext = path.extname(req.filePath).toLowerCase();
        format = ext === '.csv' ? 'csv' : 'json';
        data = fs.readFileSync(req.filePath, 'utf-8');
      }

      const transaction = db.transaction(() => {
        if (overwrite) {
          db.prepare('DELETE FROM book_tags').run();
          db.prepare('DELETE FROM books').run();
          db.prepare('DELETE FROM borrow_records').run();
          db.prepare('DELETE FROM wishlist_items').run();
          db.prepare('DELETE FROM shelf_locations WHERE type != ?').run('room');
          db.prepare('DELETE FROM tags').run();
        }

        if (format === 'json' && data) {
          const parsedData = JSON.parse(data);

          if (parsedData.books && Array.isArray(parsedData.books)) {
            for (const book of parsedData.books) {
              const now = new Date().toISOString();
              db.prepare(`
                INSERT OR REPLACE INTO books (
                  id, isbn, title, author, publisher, publish_date,
                  purchase_price, purchase_date, status, rating, notes,
                  cover_image, shelf_location_id, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                book.id,
                book.isbn || null,
                book.title,
                book.author,
                book.publisher || null,
                book.publishDate || null,
                book.purchasePrice || null,
                book.purchaseDate || null,
                book.status || 'unread',
                book.rating || null,
                book.notes || null,
                book.coverImage || null,
                book.shelfLocationId || null,
                book.createdAt || now,
                now
              );

              if (book.tags && Array.isArray(book.tags)) {
                for (const tagName of book.tags) {
                  let tagRow = db.prepare('SELECT * FROM tags WHERE name = ?').get(tagName) as any;
                  if (!tagRow) {
                    const tagId = crypto.randomUUID();
                    db.prepare('INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)').run(
                      tagId, tagName, '#8B6914', now
                    );
                    tagRow = { id: tagId };
                  }
                  db.prepare('INSERT OR IGNORE INTO book_tags (book_id, tag_id) VALUES (?, ?)').run(book.id, tagRow.id);
                }
              }
              importedCount++;
            }
          }
        }
      });

      transaction();
      return { success: true, importedCount };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:saveCover', async (_event, bookId: string, filePath: string): Promise<{ success: boolean; savedPath?: string; error?: string }> => {
    try {
      const { getCoversPath } = await import('../database');
      const coversPath = getCoversPath();
      const ext = path.extname(filePath);
      const fileName = `${bookId}${ext}`;
      const savedPath = path.join(coversPath, fileName);

      fs.copyFileSync(filePath, savedPath);
      return { success: true, savedPath: `file://${savedPath.replace(/\\/g, '/')}` };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:selectImage', async (): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    try {
      const result = await dialog.showOpenDialog({
        title: '选择封面图片',
        properties: ['openFile'],
        filters: [
          { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: '用户取消' };
      }

      return { success: true, filePath: result.filePaths[0] };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}
