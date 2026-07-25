/* Entry point for electron. Creates the window to serve the front end application */

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.removeMenu();

  win.webContents.setWindowOpenHandler(({url}) => {
    if(url.startsWith('http')){
      shell.openExternal(url);
      return {action: 'deny'};
    }
    return {action: 'allow'};
  });

  win.webContents.on('will-navigate', (event, url) => {
    if(!url.startsWith('file://')){
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Load from build folder (for production)
  const startUrl =
    process.env.ELECTRON_START_URL ||
    `file://${path.join(__dirname, '/build/index.html')}`;

  win.loadURL(startUrl);

  // Optional: open DevTools for debugging
  //win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});