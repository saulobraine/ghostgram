# 00. Diagnóstico do Estado Atual do App Desktop

## 1. Contexto Geral

O repositório do GhostGram é estruturado como um monorepo Turborepo + pnpm contendo os seguintes pacotes:
- `packages/extension`: Extensão Chrome (Manifest V3) funcional com painel flutuante.
- `packages/shared`: Biblioteca de tipos, entidades de domínio, constantes e i18n compartilhados.
- `packages/api`: Backend em NestJS com Prisma e PostgreSQL.
- `packages/app`: Aplicativo mobile em Expo / React Native.
- `packages/desktop`: Invólucro (wrapper) Electron para Desktop.

---

## 2. Anatomia Atual do `packages/desktop`

O pacote desktop atual é composto por apenas dois arquivos de código-fonte:
1. `packages/desktop/src/main.ts` (96 linhas)
2. `packages/desktop/src/preload.ts` (4 linhas)
3. `packages/desktop/package.json`

### Código Atual do `main.ts`
```typescript
import { app, BrowserWindow, shell } from 'electron';
import * as path from 'path';

const DEV_SERVER_URL = 'http://localhost:8081';
const ALLOWED_EXTERNAL_HOSTS = new Set(['instagram.com', 'www.instagram.com']);

let mainWindow: BrowserWindow | null = null;
// ...
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isAllowedAppUrl(url)) {
      return;
    }
    event.preventDefault();
    openExternalUrl(url); // 🔴 Abre fora do Electron!
  });

  if (!app.isPackaged) {
    void mainWindow.loadURL(DEV_SERVER_URL); // 🔴 Depende do Metro da Expo na porta 8081
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../../app/dist/index.html')); // 🔴 Depende da build web da Expo
  }
}
```

### Código Atual do `preload.ts`
```typescript
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('ghostgramDesktop', Object.freeze({}));
```

---

## 3. Principais Problemas e Bloqueadores Identificados

### 🔴 Bloqueador 1: Acoplamento Quebrado com o Expo (`packages/app`)
- O desktop atualmente não possui interface própria. Ele depende exclusivamente de rodar o servidor de desenvolvimento da Expo (`http://localhost:8081`) ou carregar `packages/app/dist/index.html`.
- O aplicativo Expo (`packages/app`) foi desenvolvido primariamente com foco em mobile (iOS/Android).
- Na tela inicial do app móvel (`packages/app/app/(tabs)/home.tsx`), a integração com o Instagram é feita através do componente `<WebView />` da biblioteca `react-native-webview`.
- **O problema**: `react-native-webview` **não possui suporte adequado para React Native Web**. Quando renderizado no navegador ou no Electron, ele vira um `<iframe>` comum, o qual sofre com:
  1. Restrições severas de `X-Frame-Options: SAMEORIGIN` impostas pelo Instagram (a página do Instagram não carrega dentro de iframe web).
  2. Impossibilidade de ler cookies de terceiros (`SameSite=Lax/Strict`, `Partitioned Cookies`).

### 🔴 Bloqueador 2: Interceptação e Expulsão da Navegação do Instagram
- No arquivo `main.ts`:
  ```typescript
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isAllowedAppUrl(url)) return;
    event.preventDefault();
    openExternalUrl(url);
  });
  ```
- O método `openExternalUrl` chama `shell.openExternal(url)`, o que faz com que **qualquer tentativa de navegar para o Instagram seja aberta no navegador padrão do sistema operacional (Chrome/Edge)** fora do Electron.
- Como consequência, o aplicativo desktop nunca consegue ter uma janela interna de navegação ou login para o Instagram.

### 🔴 Bloqueador 3: `preload.ts` Vazio e Ausência de IPC
- O arquivo `preload.ts` apenas expõe um objeto vazio `ghostgramDesktop: {}`.
- Não existem canais IPC (`ipcRenderer` / `ipcMain`) configurados para:
  - Disparar login ou capturar cookies da sessão.
  - Solicitar escaneamento de seguidores/seguidos.
  - Pausar, retomar ou cancelar escaneamento.
  - Executar ações de unfollow.
  - Ler e gravar configurações ou whitelist no disco local.

### 🔴 Bloqueador 4: Inexistência de Camada de Rede REST do Instagram no Desktop
- O Electron possui a capacidade nativa de fazer requisições HTTP/HTTPS via `net.fetch` contornando restrições de CORS e utilizando a sessão autenticada do Chromium.
- No entanto, atualmente não existe nenhuma classe ou serviço no pacote desktop responsável por invocar os endpoints REST do Instagram (`/api/v1/friendships/...`).

---

## 4. Conclusão do Diagnóstico

O pacote `packages/desktop` é atualmente um esqueleto inoperante porque tentou ser apenas um wrapper estático da compilação web do Expo. 

Para que o desktop se torne **completamente utilizável**, a solução arquitetural correta é:
1. **Desacoplar o Desktop do Expo Web**: dotar o pacote desktop de sua própria interface gráfica (usando React/Vite com `@ghostgram/shared` ou interface leve integrada).
2. **Implementar Login Nativo do Instagram no Electron**: criar uma janela de login que navega internamente para `https://www.instagram.com/accounts/login/` usando uma sessão isolada (`persist:instagram`), capturando cookies de sessão assim que o usuário autenticar.
3. **Portar o Motor de Scan e Unfollow REST**: implementar no Electron Main o mesmo motor de 2 fases adotado na extensão (`/following` + `/followers` com `X-IG-App-ID: 936619743392459`).
4. **Estabelecer Bridge IPC Segura**: conectar a interface desktop aos serviços através do `preload.ts` com tipagem forte.
