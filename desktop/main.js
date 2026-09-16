// ReadySetTimer — Electron main process.
// Wraps the fully-static web app in `./app/` as an offline desktop app.

const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('node:path');

// One-window-per-app model. Second-instance clicks (from Dock/Taskbar) focus
// the existing window rather than opening a duplicate.
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 480,
    minHeight: 360,
    backgroundColor: '#0b0f17',      // matches --bg-tone so no white flash
    show: false,                     // paint before showing → no flash
    autoHideMenuBar: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      // The static app doesn't need remote content — everything is bundled.
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

  // Any link the app tries to open externally (share buttons, footer links,
  // guide previews) goes to the user's real browser, never inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Block navigation away from the local app (would leave the SPA context).
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Fullscreen',
          accelerator: isMac ? 'Ctrl+Command+F' : 'F11',
          click: (_, win) => win && win.setFullScreen(!win.isFullScreen()),
        },
        {
          label: 'Always on Top',
          type: 'checkbox',
          checked: false,
          accelerator: isMac ? 'Command+Alt+T' : 'Ctrl+Alt+T',
          click: (item, win) => {
            if (!win) return;
            const on = !win.isAlwaysOnTop();
            // 'screen-saver' keeps it above even other fullscreen apps —
            // ideal for a timer overlaid on presentation slides.
            win.setAlwaysOnTop(on, 'screen-saver');
            item.checked = on;
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        ...(isMac ? [{ role: 'zoom' }, { role: 'front' }] : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'ReadySetTimer 웹사이트 열기',
          click: () => shell.openExternal('https://rstimer.kr/'),
        },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About ReadySetTimer',
              message: 'ReadySetTimer',
              detail: `버전 ${app.getVersion()}\n\n발표·프레젠테이션에 특화된 오프라인 타이머.\nPomodoro · Stopwatch · 8개 언어 지원.\n\nrstimer.kr`,
              buttons: ['확인'],
              defaultId: 0,
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
