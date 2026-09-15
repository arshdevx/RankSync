const { app, BrowserWindow, ipcMain, Notification, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

let mainWindow = null;
let overlayWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 940,
    minHeight: 650,
    title: 'RankSync — Academic Mission Control',
    backgroundColor: '#09090b',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: false,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (overlayWindow) {
      overlayWindow.close();
      overlayWindow = null;
    }
  });
}

function createOverlayWindow(type = 'water') {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.show();
    overlayWindow.focus();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const overlayWidth = 400;
  const overlayHeight = 310;

  overlayWindow = new BrowserWindow({
    width: overlayWidth,
    height: overlayHeight,
    x: screenWidth - overlayWidth - 24,
    y: screenHeight - overlayHeight - 24,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    show: false,
    hasShadow: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: false,
    },
  });

  overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);

  const targetUrl = isDev && process.env.VITE_DEV_SERVER_URL
    ? `${process.env.VITE_DEV_SERVER_URL}#overlay=${type}`
    : `file://${path.join(__dirname, '../dist/index.html')}#overlay=${type}`;

  overlayWindow.loadURL(targetUrl);

  overlayWindow.once('ready-to-show', () => {
    overlayWindow.show();
    overlayWindow.focus();
  });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: Native Desktop notification (even over other apps)
ipcMain.handle('show-native-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    const notif = new Notification({
      title: title || 'RankSync',
      body: body || '',
      urgency: 'critical',
      timeoutType: 'default',
    });
    notif.show();
    return true;
  }
  return false;
});

// IPC: Toggle Always On Top (Over other apps)
ipcMain.handle('toggle-always-on-top', () => {
  if (!mainWindow) return false;
  const isPinned = mainWindow.isAlwaysOnTop();
  const next = !isPinned;
  mainWindow.setAlwaysOnTop(next, next ? 'screen-saver' : 'normal');
  return next;
});

ipcMain.handle('get-always-on-top', () => {
  return mainWindow ? mainWindow.isAlwaysOnTop() : false;
});

// IPC: Water Overlay Pop-up over other apps
ipcMain.handle('show-water-overlay', () => {
  createOverlayWindow('water');
  return true;
});

ipcMain.handle('close-water-overlay', () => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
    overlayWindow = null;
  }
  return true;
});

// IPC: Sync water intake logged from overlay back to main window
ipcMain.handle('water-logged-from-overlay', (event, count) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('sync-water-count', count);
  }
  return true;
});

// IPC: File backup in local AppData folder
ipcMain.handle('save-local-backup', async (event, jsonString) => {
  try {
    const userDataPath = app.getPath('userData');
    const backupPath = path.join(userDataPath, 'ranksync_backup.json');
    await fs.promises.writeFile(backupPath, jsonString, 'utf-8');
    return { success: true, path: backupPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('read-local-backup', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const newBackupPath = path.join(userDataPath, 'ranksync_backup.json');
    const legacyBackupPath = path.join(userDataPath, 'pcm_tracker_backup.json');

    if (fs.existsSync(newBackupPath)) {
      const data = await fs.promises.readFile(newBackupPath, 'utf-8');
      return { success: true, data };
    }
    if (fs.existsSync(legacyBackupPath)) {
      const data = await fs.promises.readFile(legacyBackupPath, 'utf-8');
      return { success: true, data };
    }
    return { success: false, message: 'No backup found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
