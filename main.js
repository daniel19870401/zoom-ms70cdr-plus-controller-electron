const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const { startServer } = require('./server');
const osc = require('osc');

let mainWindow = null;
let serverHandle = null;
let oscPort = null;

app.commandLine.appendSwitch('enable-web-midi');
app.commandLine.appendSwitch('enable-web-midi-sysex');
app.commandLine.appendSwitch('enable-features', 'WebMidi,WebMidiSysex');

async function createWindow() {
  const { server, port } = await startServer();
  serverHandle = server;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0f172a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const allowMidi = (_, permission, callback) => {
    if (permission === 'midi' || permission === 'midiSysex') {
      callback(true);
      return;
    }
    callback(false);
  };

  const allowMidiCheck = (_, permission) => permission === 'midi' || permission === 'midiSysex';

  const windowSession = mainWindow.webContents.session;
  windowSession.setPermissionRequestHandler(allowMidi);
  windowSession.setPermissionCheckHandler(allowMidiCheck);

  mainWindow.webContents.on('render-process-gone', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.reload();
    }
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);

  startOscServer();
}

function startOscServer() {
  if (oscPort) return;
  const port = Number(process.env.OSC_PORT || 9000);
  oscPort = new osc.UDPPort({
    localAddress: '0.0.0.0',
    localPort: port,
    metadata: true,
  });

  oscPort.on('message', (message) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('osc-message', {
      address: message.address,
      args: Array.isArray(message.args) ? message.args : [],
    });
  });

  oscPort.on('ready', () => {
    console.log(`OSC 監聽中：udp://0.0.0.0:${port}`);
  });

  oscPort.on('error', (error) => {
    console.error('OSC 錯誤:', error?.message || error);
  });

  oscPort.open();
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_, permission, callback) => {
    if (permission === 'midi' || permission === 'midiSysex') {
      callback(true);
      return;
    }
    callback(false);
  });
  session.defaultSession.setPermissionCheckHandler(
    (_, permission) => permission === 'midi' || permission === 'midiSysex'
  );

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverHandle) {
    serverHandle.close();
    serverHandle = null;
  }
  if (oscPort) {
    oscPort.close();
    oscPort = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
