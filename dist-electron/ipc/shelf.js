import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, rowToLocation, rowToBook } from '../database';
function buildLocationTree(locations, parentId) {
    return locations
        .filter(l => l.parentId === parentId)
        .sort((a, b) => a.positionOrder - b.positionOrder)
        .map(loc => ({
        ...loc,
        children: buildLocationTree(locations, loc.id),
    }));
}
export function registerShelfIPC() {
    ipcMain.handle('shelf:getAll', async () => {
        try {
            const db = getDatabase();
            const rows = db.prepare(`
        SELECT * FROM shelf_locations
        ORDER BY type, position_order, name
      `).all();
            const locations = rows.map(rowToLocation);
            const tree = buildLocationTree(locations);
            return { success: true, data: tree };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('shelf:getFlatList', async () => {
        try {
            const db = getDatabase();
            const rows = db.prepare(`
        SELECT * FROM shelf_locations
        ORDER BY type, position_order, name
      `).all();
            const locations = rows.map(rowToLocation);
            return { success: true, data: locations };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('shelf:save', async (_event, req) => {
        try {
            const db = getDatabase();
            const now = new Date().toISOString();
            const isNew = !req.id;
            const id = req.id || uuidv4();
            if (isNew) {
                const maxOrder = db.prepare(`
          SELECT COALESCE(MAX(position_order), -1) as max_order
          FROM shelf_locations
          WHERE parent_id IS ? OR parent_id = ?
        `).get(req.parentId || null, req.parentId || null);
                const positionOrder = maxOrder.max_order + 1;
                db.prepare(`
          INSERT INTO shelf_locations (
            id, parent_id, type, name, code, description,
            position_order, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, req.parentId || null, req.type, req.name, req.code || null, req.description || null, positionOrder, now, now);
            }
            else {
                db.prepare(`
          UPDATE shelf_locations SET
            name = ?, code = ?, description = ?, updated_at = ?
          WHERE id = ?
        `).run(req.name, req.code || null, req.description || null, now, id);
            }
            const row = db.prepare('SELECT * FROM shelf_locations WHERE id = ?').get(id);
            return { success: true, data: rowToLocation(row) };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('shelf:delete', async (_event, locationId) => {
        try {
            const db = getDatabase();
            db.prepare('DELETE FROM shelf_locations WHERE id = ?').run(locationId);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('shelf:assignBook', async (_event, req) => {
        try {
            const db = getDatabase();
            const now = new Date().toISOString();
            db.prepare(`
        UPDATE books SET shelf_location_id = ?, updated_at = ?
        WHERE id = ?
      `).run(req.locationId, now, req.bookId);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('shelf:getBooksByLocation', async (_event, locationId) => {
        try {
            const db = getDatabase();
            const rows = db.prepare(`
        SELECT b.* FROM books b
        WHERE b.shelf_location_id = ?
        ORDER BY b.title
      `).all(locationId);
            const books = [];
            for (const row of rows) {
                const tagRows = db.prepare(`
          SELECT t.name FROM tags t
          JOIN book_tags bt ON t.id = bt.tag_id
          WHERE bt.book_id = ?
        `).all(row.id);
                const tags = tagRows.map(t => t.name);
                books.push(rowToBook(row, tags));
            }
            return { success: true, data: books };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
}
