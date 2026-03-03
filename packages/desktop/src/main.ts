import { app, BrowserWindow } from "electron";
import * as path from "path";

let mainWindow: BrowserWindow | null = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simplicity in this demo, though contextIsolation: true is safer.
      // preload: path.join(__dirname, 'preload.js'),
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    // In development mode, load the Expo development server URL
    console.log("Running in development mode");
    // We target port 8081 where expo web runs by default
    mainWindow.loadURL("http://localhost:8081");
    mainWindow.webContents.openDevTools();
  } else {
    // In production mode, load the static index.html file
    console.log("Running in production mode");
    // Calculate path relative to the executable/asar
    // Usually dist/index.html after build
    mainWindow.loadFile(path.join(__dirname, "../../app/dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
