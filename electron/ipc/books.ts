import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, rowToBook, rowToTag } from '../database';
import type {
  GetBooksRequest,
  GetBooksResponse,
  SaveBookRequest,
  DeleteBookRequest,
  Book,
  Tag,
} from '../../shared/types';

export function registerBooksIPC(): void {
  ipcMain.handle('books:get', async (_event, req: GetBooksRequest): Promise<{ success: boolean; data?: GetBooksResponse; error?: string }> => {
    try {
      const db = getDatabase();
      const { page = 1, pageSize = 50, search, tag, status, sortBy = 'title', sortOrder = 'asc' } = req;

      let whereClauses: string[] = [];
      let params: any[] = [];

      if (search) {
        whereClauses.push('(b.title LIKE ? OR b.author LIKE ? OR b.publisher LIKE ? OR b.isbn LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (status) {
        whereClauses.push('b.status = ?');
        params.push(status);
      }

      if (tag) {
        whereClauses.push(`
          EXISTS (
            SELECT 1 FROM book_tags bt
            JOIN tags t ON bt.tag_id = t.id
            WHERE bt.book_id = b.id AND t.name = ?
          )
        `);
        params.push(tag);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const sortMap: Record<string, string> = {
        title: 'b.title',
        author: 'b.author',
        purchaseDate: 'b.purchase_date',
        rating: 'b.rating',
      };
      const orderSql = `ORDER BY ${sortMap[sortBy] || 'b.title'} ${sortOrder.toUpperCase()}`;

      const offset = (page - 1) * pageSize;

      const countStmt = db.prepare(`
        SELECT COUNT(*) as total FROM books b ${whereSql}
      `);
      const { total } = countStmt.get(...params) as { total: number };

      const booksStmt = db.prepare(`
        SELECT b.* FROM books b ${whereSql} ${orderSql} LIMIT ? OFFSET ?
      `);
      const bookRows = booksStmt.all(...params, pageSize, offset) as any[];

      const books: Book[] = [];
      for (const row of bookRows) {
        const tagStmt = db.prepare(`
          SELECT t.name FROM tags t
          JOIN book_tags bt ON t.id = bt.tag_id
          WHERE bt.book_id = ?
        `);
        const tagRows = tagStmt.all(row.id) as any[];
        const tags = tagRows.map(t => t.name);
        books.push(rowToBook(row, tags));
      }

      return { success: true, data: { books, total } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('books:save', async (_event, req: SaveBookRequest): Promise<{ success: boolean; data?: Book; error?: string }> => {
    try {
      const db = getDatabase();
      const now = new Date().toISOString();
      const isNew = !req.id;
      const id = req.id || uuidv4();

      const transaction = db.transaction(() => {
        if (isNew) {
          const stmt = db.prepare(`
            INSERT INTO books (
              id, isbn, title, author, publisher, publish_date,
              purchase_price, purchase_date, status, rating, notes,
              cover_image, shelf_location_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          stmt.run(
            id,
            req.isbn || null,
            req.title,
            req.author,
            req.publisher || null,
            req.publishDate || null,
            req.purchasePrice || null,
            req.purchaseDate || null,
            req.status,
            req.rating || null,
            req.notes || null,
            req.coverImage || null,
            req.shelfLocationId || null,
            now,
            now
          );
        } else {
          const stmt = db.prepare(`
            UPDATE books SET
              isbn = ?, title = ?, author = ?, publisher = ?, publish_date = ?,
              purchase_price = ?, purchase_date = ?, status = ?, rating = ?, notes = ?,
              cover_image = ?, shelf_location_id = ?, updated_at = ?
            WHERE id = ?
          `);
          stmt.run(
            req.isbn || null,
            req.title,
            req.author,
            req.publisher || null,
            req.publishDate || null,
            req.purchasePrice || null,
            req.purchaseDate || null,
            req.status,
            req.rating || null,
            req.notes || null,
            req.coverImage || null,
            req.shelfLocationId || null,
            now,
            id
          );
          db.prepare('DELETE FROM book_tags WHERE book_id = ?').run(id);
        }

        const tagRows: Tag[] = [];
        for (const tagName of req.tags) {
          let tagRow = db.prepare('SELECT * FROM tags WHERE name = ?').get(tagName) as any;
          if (!tagRow) {
            const tagId = uuidv4();
            db.prepare('INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)').run(
              tagId, tagName, '#8B6914', now
            );
            tagRow = { id: tagId, name: tagName, color: '#8B6914', created_at: now };
          }
          tagRows.push(rowToTag(tagRow));
          db.prepare('INSERT OR IGNORE INTO book_tags (book_id, tag_id) VALUES (?, ?)').run(id, tagRow.id);
        }

        const bookRow = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as any;
        return rowToBook(bookRow, req.tags);
      });

      const book = transaction();
      return { success: true, data: book };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('books:delete', async (_event, req: DeleteBookRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM books WHERE id = ?').run(req.id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('tags:getAll', async (): Promise<{ success: boolean; data?: Tag[]; error?: string }> => {
    try {
      const db = getDatabase();
      const rows = db.prepare('SELECT * FROM tags ORDER BY name').all() as any[];
      const tags = rows.map(rowToTag);
      return { success: true, data: tags };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('books:getById', async (_event, id: string): Promise<{ success: boolean; data?: Book; error?: string }> => {
    try {
      const db = getDatabase();
      const row = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as any;
      if (!row) {
        return { success: false, error: 'Book not found' };
      }
      const tagRows = db.prepare(`
        SELECT t.name FROM tags t
        JOIN book_tags bt ON t.id = bt.tag_id
        WHERE bt.book_id = ?
      `).all(id) as any[];
      const tags = tagRows.map(t => t.name);
      return { success: true, data: rowToBook(row, tags) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}
