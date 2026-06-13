import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, rowToWishItem, rowToBudget, rowToBook } from '../database';
import type {
  GetWishlistResponse,
  SaveWishItemRequest,
  SetBudgetRequest,
  MarkAsPurchasedRequest,
  WishItem,
  Budget,
} from '../../shared/types';

export function registerWishlistIPC(): void {
  ipcMain.handle('wishlist:getAll', async (): Promise<{ success: boolean; data?: GetWishlistResponse; error?: string }> => {
    try {
      const db = getDatabase();

      const itemRows = db.prepare(`
        SELECT * FROM wishlist_items
        WHERE purchased = 0
        ORDER BY
          CASE priority
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
          END,
          created_at DESC
      `).all() as any[];
      const items = itemRows.map(rowToWishItem);

      const budgetRow = db.prepare('SELECT * FROM budgets WHERE id = ?').get('default') as any;
      const budget = rowToBudget(budgetRow);

      return { success: true, data: { items, budget } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('wishlist:saveItem', async (_event, req: SaveWishItemRequest): Promise<{ success: boolean; data?: WishItem; error?: string }> => {
    try {
      const db = getDatabase();
      const now = new Date().toISOString();
      const isNew = !req.id;
      const id = req.id || uuidv4();

      if (isNew) {
        db.prepare(`
          INSERT INTO wishlist_items (
            id, title, author, publisher, isbn, estimated_price,
            priority, notes, cover_image, purchased, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        `).run(
          id,
          req.title,
          req.author || null,
          req.publisher || null,
          req.isbn || null,
          req.estimatedPrice || null,
          req.priority,
          req.notes || null,
          req.coverImage || null,
          now,
          now
        );
      } else {
        db.prepare(`
          UPDATE wishlist_items SET
            title = ?, author = ?, publisher = ?, isbn = ?,
            estimated_price = ?, priority = ?, notes = ?,
            cover_image = ?, updated_at = ?
          WHERE id = ?
        `).run(
          req.title,
          req.author || null,
          req.publisher || null,
          req.isbn || null,
          req.estimatedPrice || null,
          req.priority,
          req.notes || null,
          req.coverImage || null,
          now,
          id
        );
      }

      const row = db.prepare('SELECT * FROM wishlist_items WHERE id = ?').get(id) as any;
      return { success: true, data: rowToWishItem(row) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('wishlist:deleteItem', async (_event, itemId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM wishlist_items WHERE id = ?').run(itemId);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('wishlist:setBudget', async (_event, req: SetBudgetRequest): Promise<{ success: boolean; data?: Budget; error?: string }> => {
    try {
      const db = getDatabase();
      const now = new Date().toISOString();

      db.prepare(`
        UPDATE budgets SET
          monthly_budget = ?, yearly_budget = ?, updated_at = ?
        WHERE id = ?
      `).run(req.monthlyBudget, req.yearlyBudget, now, 'default');

      const row = db.prepare('SELECT * FROM budgets WHERE id = ?').get('default') as any;
      return { success: true, data: rowToBudget(row) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('wishlist:markAsPurchased', async (_event, req: MarkAsPurchasedRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const db = getDatabase();
      const now = new Date().toISOString();

      const transaction = db.transaction(() => {
        let bookId: string | undefined;

        if (req.createBookRecord) {
          const wishRow = db.prepare('SELECT * FROM wishlist_items WHERE id = ?').get(req.wishItemId) as any;
          bookId = uuidv4();

          db.prepare(`
            INSERT INTO books (
              id, title, author, publisher, isbn, purchase_price,
              purchase_date, status, cover_image, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'unread', ?, ?, ?)
          `).run(
            bookId,
            wishRow.title,
            wishRow.author || null,
            wishRow.publisher || null,
            wishRow.isbn || null,
            req.actualPrice,
            req.purchaseDate,
            wishRow.cover_image || null,
            now,
            now
          );
        }

        db.prepare(`
          UPDATE wishlist_items SET
            purchased = 1, actual_price = ?, purchase_date = ?,
            book_id = ?, updated_at = ?
          WHERE id = ?
        `).run(req.actualPrice, req.purchaseDate, bookId || null, now, req.wishItemId);
      });

      transaction();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('wishlist:getPurchasedHistory', async (): Promise<{ success: boolean; data?: WishItem[]; error?: string }> => {
    try {
      const db = getDatabase();
      const rows = db.prepare(`
        SELECT * FROM wishlist_items
        WHERE purchased = 1
        ORDER BY purchase_date DESC
      `).all() as any[];
      const items = rows.map(rowToWishItem);
      return { success: true, data: items };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}
