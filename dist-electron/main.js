import { app, BrowserWindow, Notification, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, closeDatabase } from './database';
import { registerBooksIPC } from './ipc/books';
import { registerBorrowIPC } from './ipc/borrow';
import { registerShelfIPC } from './ipc/shelf';
import { registerWishlistIPC } from './ipc/wishlist';
import { registerStatsIPC } from './ipc/stats';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow = null;
let reminderInterval = null;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1280,
        minHeight: 800,
        backgroundColor: '#FDFAF3',
        title: '个人藏书管理',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
function startReminderCheck() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
    }
    reminderInterval = setInterval(async () => {
        try {
            const result = await ipcMain.emit('borrow:checkOverdue');
            // @ts-ignore
            const overdueRecords = result?.[0]?.data;
            if (overdueRecords && overdueRecords.length > 0) {
                for (const record of overdueRecords) {
                    const notification = new Notification({
                        title: '借阅到期提醒',
                        body: `《${record.book?.title}》已到期，借阅人：${record.borrowerName}`,
                        silent: false,
                    });
                    notification.show();
                }
            }
        }
        catch (error) {
            console.error('Reminder check failed:', error);
        }
    }, 60 * 60 * 1000);
}
app.whenReady().then(() => {
    try {
        initDatabase();
        console.log('Database initialized');
        registerBooksIPC();
        registerBorrowIPC();
        registerShelfIPC();
        registerWishlistIPC();
        registerStatsIPC();
        createWindow();
        startReminderCheck();
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    }
    catch (error) {
        console.error('App initialization failed:', error);
    }
});
app.on('window-all-closed', () => {
    if (reminderInterval) {
        clearInterval(reminderInterval);
    }
    closeDatabase();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('before-quit', () => {
    if (reminderInterval) {
        clearInterval(reminderInterval);
    }
    closeDatabase();
});
