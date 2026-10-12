# 01. Arquitetura do Desktop Independente

## 1. Visão Geral da Arquitetura

Para tornar o aplicativo desktop auto-suficiente, seguro e de fácil manutenção, propõe-se uma arquitetura baseada no modelo padrão do Electron (Main Process, Preload Bridge e Renderer Process), eliminando a dependência do servidor Metro/Expo Web.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RENDERER PROCESS (UI)                           │
│  - Dashboard do GhostGram (Vite + React / TypeScript)                  │
│  - Visualização de Não-Seguidores, Whitelist, Filtros e Ações          │
│  - Consome APIs via window.ghostgramDesktop (Context Isolation)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ IPC (invoke / send / on)
┌───────────────────────────────────▼────────────────────────────────────┐
│                         PRELOAD SCRIPT (Bridge)                        │
│  - contextBridge.exposeInMainWorld('ghostgramDesktop', { ... })         │
│  - Expõe canais estritamente tipados e sanitizados                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ IPC
┌───────────────────────────────────▼────────────────────────────────────┐
│                        MAIN PROCESS (Node.js)                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 1. InstagramSessionManager                                        │  │
│  │    - Janela Modal nativa de login no Instagram                   │  │
│  │    - Partição persistente: persist:instagram                     │  │
│  │    - Captura e validação de cookies (ds_user_id, csrftoken, etc)│  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ Sessão ativa                     │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ 2. DesktopInstagramApiClient                                     │  │
│  │    - net.fetch do Electron com headers oficiais do Instagram Web │  │
│  │    - X-IG-App-ID: 936619743392459                                │  │
│  │    - Sem restrições de CORS                                       │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ Chamadas HTTP REST               │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ 3. DesktopScanEngine & DesktopUnfollowEngine                      │  │
│  │    - Algoritmo em 2 fases (/following + /followers)               │  │
│  │    - Comparação exata de conjuntos (Set<string>)                  │  │
│  │    - Controle rigoroso de taxa (Jitter + Pausas de segurança)     │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ Persistência                     │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ 4. DesktopStorageManager                                         │  │
│  │    - Armazenamento em app.getPath('userData')                    │  │
│  │    - Whitelist, histórico de scans e configurações locais         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes do Processo Principal (Main Process)

### 2.1. `InstagramSessionManager`
Responsável pelo ciclo de vida da conta e autenticação:
- Utiliza uma partição isolada: `session.fromPartition('persist:instagram')`.
- Método `openLoginModal()`:
  - Abre uma janela filha modal (`BrowserWindow`) carregando `https://www.instagram.com/accounts/login/`.
  - Monitora o evento `did-navigate` e `cookies.on('changed')`.
  - Quando os cookies `ds_user_id` e `sessionid` forem identificados e o usuário estiver na página principal (`https://www.instagram.com/`), fecha a janela automaticamente e notifica sucesso.
- Método `getCookies()`:
  - Extrai `ds_user_id`, `csrftoken`, `sessionid`, `mid` e `ig_did`.
- Método `logout()`:
  - Limpa cookies e dados de navegação da partição `persist:instagram`.

### 2.2. `DesktopInstagramApiClient`
Cliente HTTP executado no processo Node.js do Electron:
- Faz requisições via `session.defaultSession.net.fetch` ou `fetch` nativo do Node.
- Injeta automaticamente os cookies da partição de sessão e o cabeçalho obrigatório:
  - `X-IG-App-ID: 936619743392459`
  - `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...`
  - `X-CSRFToken: <csrftoken>`
  - `Referer: https://www.instagram.com/`
- Endpoints implementados:
  - `fetchFriendshipsPage('following' | 'followers', maxId, count)`
  - `unfollowUser(userId)`
  - `getCurrentUserInfo(userId)`

### 2.3. `DesktopScanEngine`
Motor de escaneamento em 2 fases:
- **Fase 1 (Following)**: Pagina `/api/v1/friendships/{userId}/following/?count=50` até o fim ou limite de segurança (60 páginas = 3.000 perfis).
- **Fase 2 (Followers)**: Pagina `/api/v1/friendships/{userId}/followers/?count=50` até o fim ou limite de segurança (250 páginas = 12.500 seguidores) e armazena os IDs em `Set<string>`.
- **Fase 3 (Comparação)**: Cruza os dados. Perfis presentes em `following` que não constam em `followerIds` são marcados com `followsViewer: false`.
- **Jitter e Rate Limit**:
  - Espera entre 500ms e 2000ms aleatoriamente entre páginas.
  - Pausa de segurança de 15 segundos a cada 5 páginas.
  - Envia evento `scan:progress` para a UI contendo `{ percentage, phase, currentCount, nonFollowersFound }`.

### 2.4. `DesktopUnfollowEngine`
Motor de unfollow seguro:
- Processa uma fila de IDs de usuários selecionados.
- Realiza `POST` para `https://www.instagram.com/web/friendships/{userId}/unfollow/`.
- Aplica intervalo de 4 a 8 segundos entre unfollows individuais.
- Aplica **pausa obrigatória de 5 minutos** a cada 5 unfollows consecutivos para proteção da conta contra blocks do Instagram.
- Registra histórico de unfollows com timestamp e status.

---

## 3. Preload Script (`preload.ts`)

A ponte de segurança com `contextIsolation: true`:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

export interface GhostGramDesktopBridge {
  auth: {
    login: () => Promise<{ success: boolean; username?: string; userId?: string }>;
    logout: () => Promise<void>;
    checkSession: () => Promise<{ isAuthenticated: boolean; userId?: string; username?: string }>;
  };
  scan: {
    start: () => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    cancel: () => Promise<void>;
    onProgress: (callback: (data: ScanProgressData) => void) => () => void;
  };
  unfollow: {
    start: (userIds: string[]) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    cancel: () => Promise<void>;
    onProgress: (callback: (data: UnfollowProgressData) => void) => () => void;
  };
  data: {
    getWhitelist: () => Promise<any[]>;
    saveWhitelist: (items: any[]) => Promise<void>;
    exportWhitelist: () => Promise<string>;
    importWhitelist: (jsonString: string, mode: 'merge' | 'replace') => Promise<any[]>;
    getHistory: () => Promise<any[]>;
    clearHistory: () => Promise<void>;
  };
}

contextBridge.exposeInMainWorld('ghostgramDesktop', {
  auth: {
    login: () => ipcRenderer.invoke('auth:login'),
    logout: () => ipcRenderer.invoke('auth:logout'),
    checkSession: () => ipcRenderer.invoke('auth:check-session'),
  },
  scan: {
    start: () => ipcRenderer.invoke('scan:start'),
    pause: () => ipcRenderer.invoke('scan:pause'),
    resume: () => ipcRenderer.invoke('scan:resume'),
    cancel: () => ipcRenderer.invoke('scan:cancel'),
    onProgress: (callback) => {
      const listener = (_: any, data: any) => callback(data);
      ipcRenderer.on('scan:progress', listener);
      return () => ipcRenderer.removeListener('scan:progress', listener);
    },
  },
  unfollow: {
    start: (userIds) => ipcRenderer.invoke('unfollow:start', userIds),
    pause: () => ipcRenderer.invoke('unfollow:pause'),
    resume: () => ipcRenderer.invoke('unfollow:resume'),
    cancel: () => ipcRenderer.invoke('unfollow:cancel'),
    onProgress: (callback) => {
      const listener = (_: any, data: any) => callback(data);
      ipcRenderer.on('unfollow:progress', listener);
      return () => ipcRenderer.removeListener('unfollow:progress', listener);
    },
  },
  data: {
    getWhitelist: () => ipcRenderer.invoke('data:get-whitelist'),
    saveWhitelist: (items) => ipcRenderer.invoke('data:save-whitelist', items),
    exportWhitelist: () => ipcRenderer.invoke('data:export-whitelist'),
    importWhitelist: (jsonString, mode) => ipcRenderer.invoke('data:import-whitelist', jsonString, mode),
    getHistory: () => ipcRenderer.invoke('data:get-history'),
    clearHistory: () => ipcRenderer.invoke('data:clear-history'),
  }
});
```

---

## 4. Interface do Renderer (Desktop UI)

A interface desktop deve ser desenvolvida em `packages/desktop/renderer` utilizando **Vite + React + TypeScript**:
1. **Header da Aplicação**:
   - Status da conta (Avatar, `@username`, badge de plano Free/Premium).
   - Botão de login / alternar conta.
2. **Dashboard de Auditoria**:
   - Estatísticas: Total Seguidos, Total Seguidores, Total Não-Seguidores, Total Whitelist.
   - Botão "Iniciar Escaneamento" com feedback de status.
3. **Gerenciador de Contas / Resultados**:
   - Tabs: "Não-Seguidores", "Whitelist", "Todos os Seguidos".
   - Filtros: "Apenas não verificados", "Contas privadas", "Sem foto de perfil", Busca textual.
   - Paginação e seleção múltipla (Página inteira / Selecionar todos).
   - Botão de ação em massa: "Deixar de seguir selecionados (N)".
   - Botão de exportação: JSON e CSV.
4. **Painel de Configurações**:
   - Ajustes de intervalos de busca e unfollow.
   - Gerenciamento de Whitelist (Backup, Restauração e Merge).
