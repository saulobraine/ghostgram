import { BrowserWindow, session } from 'electron';

export interface InstagramCookies {
  ds_user_id: string | null;
  sessionid: string | null;
  csrftoken: string | null;
  cookieHeader: string;
}

export class InstagramSessionManager {
  private readonly partition = 'persist:instagram';

  public getSession(): Electron.Session {
    return session.fromPartition(this.partition);
  }

  public async openLoginWindow(parentWindow?: BrowserWindow | null): Promise<boolean> {
    const loginWindow = new BrowserWindow({
      width: 520,
      height: 720,
      parent: parentWindow || undefined,
      modal: Boolean(parentWindow),
      autoHideMenuBar: true,
      title: 'Instagram Login - GhostGram',
      webPreferences: {
        partition: this.partition,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    await loginWindow.loadURL('https://www.instagram.com/accounts/login/');

    return new Promise((resolve) => {
      let isResolved = false;

      const checkAuthAndClose = async (url: string) => {
        if (
          url === 'https://www.instagram.com/' ||
          url.startsWith('https://www.instagram.com/?') ||
          url.startsWith('https://www.instagram.com/direct')
        ) {
          const cookies = await this.getCookies();
          if (cookies.ds_user_id && cookies.sessionid) {
            if (!isResolved) {
              isResolved = true;
              loginWindow.close();
              resolve(true);
            }
          }
        }
      };

      loginWindow.webContents.on('did-navigate', async (_, url) => {
        await checkAuthAndClose(url);
      });

      loginWindow.webContents.on('did-navigate-in-page', async (_, url) => {
        await checkAuthAndClose(url);
      });

      loginWindow.on('closed', () => {
        if (!isResolved) {
          isResolved = true;
          resolve(false);
        }
      });
    });
  }

  public async getCookies(): Promise<InstagramCookies> {
    const ses = this.getSession();
    const cookies = await ses.cookies.get({ domain: '.instagram.com' });
    const cookieMap = new Map(cookies.map((c) => [c.name, c.value]));

    return {
      ds_user_id: cookieMap.get('ds_user_id') || null,
      sessionid: cookieMap.get('sessionid') || null,
      csrftoken: cookieMap.get('csrftoken') || null,
      cookieHeader: cookies.map((c) => `${c.name}=${c.value}`).join('; '),
    };
  }

  public async isAuthenticated(): Promise<boolean> {
    const cookies = await this.getCookies();
    return Boolean(cookies.ds_user_id && cookies.sessionid);
  }

  public async logout(): Promise<void> {
    const ses = this.getSession();
    await ses.clearStorageData({
      storages: ['cookies', 'localstorage', 'indexdb', 'cachestorage'],
    });
  }
}
