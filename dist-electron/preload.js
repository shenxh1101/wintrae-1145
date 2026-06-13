import { contextBridge, ipcRenderer } from 'electron';
const api = {
    books: {
        get: (req) => ipcRenderer.invoke('books:get', req),
        getById: (id) => ipcRenderer.invoke('books:getById', id),
        save: (req) => ipcRenderer.invoke('books:save', req),
        delete: (req) => ipcRenderer.invoke('books:delete', req),
    },
    tags: {
        getAll: () => ipcRenderer.invoke('tags:getAll'),
    },
    borrow: {
        getAll: (req) => ipcRenderer.invoke('borrow:getAll', req),
        create: (req) => ipcRenderer.invoke('borrow:create', req),
        return: (req) => ipcRenderer.invoke('borrow:return', req),
        delete: (recordId) => ipcRenderer.invoke('borrow:delete', recordId),
        checkOverdue: () => ipcRenderer.invoke('borrow:checkOverdue'),
    },
    shelf: {
        getAll: () => ipcRenderer.invoke('shelf:getAll'),
        getFlatList: () => ipcRenderer.invoke('shelf:getFlatList'),
        save: (req) => ipcRenderer.invoke('shelf:save', req),
        delete: (locationId) => ipcRenderer.invoke('shelf:delete', locationId),
        assignBook: (req) => ipcRenderer.invoke('shelf:assignBook', req),
        getBooksByLocation: (locationId) => ipcRenderer.invoke('shelf:getBooksByLocation', locationId),
    },
    wishlist: {
        getAll: () => ipcRenderer.invoke('wishlist:getAll'),
        saveItem: (req) => ipcRenderer.invoke('wishlist:saveItem', req),
        deleteItem: (itemId) => ipcRenderer.invoke('wishlist:deleteItem', itemId),
        setBudget: (req) => ipcRenderer.invoke('wishlist:setBudget', req),
        markAsPurchased: (req) => ipcRenderer.invoke('wishlist:markAsPurchased', req),
        getPurchasedHistory: () => ipcRenderer.invoke('wishlist:getPurchasedHistory'),
    },
    stats: {
        get: () => ipcRenderer.invoke('stats:get'),
        export: (req) => ipcRenderer.invoke('stats:export', req),
        saveExportFile: (data, defaultName) => ipcRenderer.invoke('stats:saveExportFile', data, defaultName),
        selectImportFile: () => ipcRenderer.invoke('stats:selectImportFile'),
        import: (req) => ipcRenderer.invoke('stats:import', req),
    },
    file: {
        saveCover: (bookId, filePath) => ipcRenderer.invoke('file:saveCover', bookId, filePath),
        selectImage: () => ipcRenderer.invoke('file:selectImage'),
    },
};
contextBridge.exposeInMainWorld('electronAPI', api);
