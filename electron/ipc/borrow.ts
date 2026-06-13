import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, rowToBorrowRecord, rowToBook } from '../database';
import type {
  GetBorrowRecordsRequest,
  GetBorrowRecordsResponse,
  CreateBorrowRequest,
  ReturnBookRequest,
  BorrowRecord,
} from '../../shared/types';

export function registerBorrowIPC(): void {
  ipcMain.handle('borrow:getAll', async (_event, req: GetBorrowRecordsRequest): Promise<{ success: boolean; data?: GetBorrowRecordsResponse; error?: string }> => {
    try {
      const db = getDatabase();
      const { status } = req;

      let whereClauses: string[] = [];
      let params: any[] = [];
      const now = new Date().toISOString().split('T')[0];

      if (status === 'active') {
        whereClauses.push('br.actual_return_date IS NULL');
      } else if (status === 'returned') {
        whereClauses.push('br.actual_return_date IS NOT NULL');
      } else if (status === 'overdue') {
        whereClauses.push('br.actual_return_date IS NULL AND br.expected_return_date < ?');
        params.push(now);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const rows = db.prepare(`
        SELECT br.*, b.* FROM borrow_records br
        LEFT JOIN books b ON br.book_id = b.id
        ${whereSql}
        ORDER BY br.created_at DESC
      `).all(...params) as any[];

      const records: BorrowRecord[] = rows.map(row => {
        const book = rowToBook(row);
        return rowToBorrowRecord(row, book);
      });

      return { success: true, data: { records } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('borrow:create', async (_event, req: CreateBorrowRequest): Promise<{ success: boolean; data?: BorrowRecord; error?: string }> => {
    try {
      const db = getDatabase();
      const now = new Date().toISOString();
      const id = uuidv4();

      const stmt = db.prepare(`
        INSERT INTO borrow_records (
          id, book_id, borrower_name, borrower_contact, borrow_date,
          expected_return_date, enable_reminder, reminder_sent, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        req.bookId,
        req.borrowerName,
        req.borrowerContact || null,
        req.borrowDate,
        req.expectedReturnDate,
        req.enableReminder ? 1 : 0,
        0,
        req.notes || null,
        now,
        now
      );

      const row = db.prepare('SELECT * FROM borrow_records WHERE id = ?').get(id) as any;
      const bookRow = db.prepare('SELECT * FROM books WHERE id = ?').get(req.bookId) as any;
      const book = rowToBook(bookRow);
      const record = rowToBorrowRecord(row, book);

      return { success: true, data: record };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('borrow:return', async (_event, req: ReturnBookRequest): Promise<{ success: boolean; data?: BorrowRecord; error?: string }> => {
    try {
      const db = getDatabase();
      const now = new Date().toISOString();

      db.prepare(`
        UPDATE borrow_records
        SET actual_return_date = ?, updated_at = ?
        WHERE id = ?
      `).run(req.actualReturnDate, now, req.recordId);

      const row = db.prepare('SELECT * FROM borrow_records WHERE id = ?').get(req.recordId) as any;
      const bookRow = db.prepare('SELECT * FROM books WHERE id = ?').get(row.book_id) as any;
      const book = rowToBook(bookRow);
      const record = rowToBorrowRecord(row, book);

      return { success: true, data: record };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('borrow:delete', async (_event, recordId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM borrow_records WHERE id = ?').run(recordId);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('borrow:checkOverdue', async (): Promise<{ success: boolean; data?: BorrowRecord[]; error?: string }> => {
    try {
      const db = getDatabase();
      const now = new Date().toISOString().split('T')[0];

      const rows = db.prepare(`
        SELECT br.*, b.* FROM borrow_records br
        LEFT JOIN books b ON br.book_id = b.id
        WHERE br.actual_return_date IS NULL
          AND br.enable_reminder = 1
          AND br.expected_return_date < ?
          AND br.reminder_sent = 0
      `).all(now) as any[];

      const records: BorrowRecord[] = rows.map(row => {
        const book = rowToBook(row);
        return rowToBorrowRecord(row, book);
      });

      for (const record of records) {
        db.prepare('UPDATE borrow_records SET reminder_sent = 1 WHERE id = ?').run(record.id);
      }

      return { success: true, data: records };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}
