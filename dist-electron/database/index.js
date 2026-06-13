import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { migrations } from './migrations';
let db = null;
export function getDbPath() {
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'library-data');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    return path.join(dbDir, 'library.db');
}
export function getCoversPath() {
    const userDataPath = app.getPath('userData');
    const coversPath = path.join(userDataPath, 'library-data', 'covers');
    if (!fs.existsSync(coversPath)) {
        fs.mkdirSync(coversPath, { recursive: true });
    }
    return coversPath;
}
export function initDatabase() {
    if (db)
        return db;
    const dbPath = getDbPath();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    for (const migration of migrations) {
        db.exec(migration);
    }
    return db;
}
export function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}
export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}
export function rowToBook(row, tags = []) {
    return {
        id: row.id,
        isbn: row.isbn,
        title: row.title,
        author: row.author,
        publisher: row.publisher,
        publishDate: row.publish_date,
        purchasePrice: row.purchase_price,
        purchaseDate: row.purchase_date,
        status: row.status,
        rating: row.rating,
        notes: row.notes,
        coverImage: row.cover_image,
        tags,
        shelfLocationId: row.shelf_location_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export function rowToTag(row) {
    return {
        id: row.id,
        name: row.name,
        color: row.color,
        createdAt: row.created_at,
    };
}
export function rowToLocation(row) {
    return {
        id: row.id,
        parentId: row.parent_id,
        type: row.type,
        name: row.name,
        code: row.code,
        description: row.description,
        positionOrder: row.position_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export function rowToBorrowRecord(row, book) {
    return {
        id: row.id,
        bookId: row.book_id,
        book,
        borrower: row.borrower_name,
        borrowerContact: row.borrower_contact,
        borrowDate: row.borrow_date,
        expectedReturnDate: row.expected_return_date,
        actualReturnDate: row.actual_return_date,
        enableReminder: !!row.enable_reminder,
        reminderSent: !!row.reminder_sent,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export function rowToWishItem(row) {
    return {
        id: row.id,
        title: row.title,
        author: row.author,
        publisher: row.publisher,
        isbn: row.isbn,
        expectedPrice: row.estimated_price,
        estimatedPrice: row.estimated_price,
        priority: row.priority,
        notes: row.notes,
        coverImage: row.cover_image,
        sourceUrl: row.source_url,
        addedDate: row.created_at,
        purchased: !!row.purchased,
        actualPrice: row.actual_price,
        purchaseDate: row.purchase_date,
        bookId: row.book_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export function rowToBudget(row) {
    if (!row)
        return null;
    return {
        id: row.id,
        year: new Date().getFullYear(),
        monthlyAmount: row.monthly_budget,
        monthlyBudget: row.monthly_budget,
        yearlyBudget: row.yearly_budget,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
