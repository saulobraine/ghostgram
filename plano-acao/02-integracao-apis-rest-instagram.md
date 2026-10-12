# 02. Especificação e Integração das APIs REST Oficiais do Instagram

Este documento detalha o funcionamento, contratos de dados, cabeçalhos obrigatórios e regras de rate-limiting das rotas REST oficiais da plataforma web do Instagram (`www.instagram.com`).

---

## 1. Autenticação e Cookies de Sessão

O Instagram Web utiliza autenticação baseada em cookies associados ao domínio `.instagram.com`. 

### Cookies Essenciais:
| Cookie | Descrição | Obrigatório |
|--------|-----------|-------------|
| `sessionid` | Token de autenticação da sessão do usuário | Sim |
| `ds_user_id` | ID numérico do usuário logado (ex: `123456789`) | Sim |
| `csrftoken` | Token CSRF para requisições que alteram estado (POST/DELETE) | Sim |
| `mid` | Machine ID gerado pelo Instagram | Recomendado |
| `ig_did` | Identificador de dispositivo do Instagram | Recomendado |

### Obtenção no Electron:
```typescript
import { session } from 'electron';

export async function extractInstagramCookies(partition: string = 'persist:instagram') {
  const ses = session.fromPartition(partition);
  const cookies = await ses.cookies.get({ domain: '.instagram.com' });

  const cookieMap = new Map(cookies.map(c => [c.name, c.value]));
  const userId = cookieMap.get('ds_user_id');
  const sessionid = cookieMap.get('sessionid');
  const csrftoken = cookieMap.get('csrftoken');

  if (!userId || !sessionid || !csrftoken) {
    return null;
  }

  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  return {
    userId,
    sessionid,
    csrftoken,
    cookieHeader,
  };
}
```

---

## 2. Cabeçalhos Obrigatórios da API Web

Todas as chamadas para a API REST do Instagram Web exigem cabeçalhos específicos para evitar rejeição com HTTP 400/403:

```typescript
export const INSTAGRAM_WEB_APP_ID = '936619743392459';

export function getInstagramHeaders(csrftoken?: string, cookieHeader?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'X-IG-App-ID': INSTAGRAM_WEB_APP_ID,
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Origin': 'https://www.instagram.com',
    'Referer': 'https://www.instagram.com/',
  };

  if (csrftoken) {
    headers['X-CSRFToken'] = csrftoken;
  }

  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }

  return headers;
}
```

---

## 3. Endpoints REST Oficiais

### 3.1. Buscar Perfis Seguidos (`following`)
Retorna a lista de contas que o usuário logado está seguindo.

- **Método**: `GET`
- **URL**: `https://www.instagram.com/api/v1/friendships/{userId}/following/?count={count}&max_id={maxId}`
- **Parâmetros de Consulta**:
  - `count`: Quantidade de registros por página (recomendado: `50`, máximo: `200`).
  - `max_id`: Cursor de paginação (retornado no campo `next_max_id` da página anterior). Omitir na primeira página.
- **Resposta de Exemplo**:
```json
{
  "users": [
    {
      "pk": 12345678,
      "pk_id": "12345678",
      "username": "usuario_exemplo",
      "full_name": "Nome do Usuário",
      "is_private": false,
      "profile_pic_url": "https://instagram.fspo.../avatar.jpg",
      "is_verified": false,
      "has_anonymous_profile_picture": false
    }
  ],
  "big_list": true,
  "page_size": 50,
  "next_max_id": "QVFDR0FB...==",
  "has_more": true,
  "status": "ok"
}
```

### 3.2. Buscar Seguidores (`followers`)
Retorna a lista de contas que seguem o usuário logado.

- **Método**: `GET`
- **URL**: `https://www.instagram.com/api/v1/friendships/{userId}/followers/?count={count}&max_id={maxId}`
- **Parâmetros de Consulta**:
  - `count`: Quantidade de registros por página (recomendado: `50`).
  - `max_id`: Cursor de paginação (omitir na primeira página).
- **Estrutura da Resposta**: idêntica à de `following`.

### 3.3. Executar Unfollow (`unfollow`)
Deixa de seguir uma conta específica.

- **Método**: `POST`
- **URL**: `https://www.instagram.com/web/friendships/{targetUserId}/unfollow/`
- **Headers Obrigatórios**:
  - `Content-Type`: `application/x-www-form-urlencoded`
  - `X-CSRFToken`: `<csrftoken>`
  - `X-IG-App-ID`: `936619743392459`
- **Body**: Vazio ou formulário vazio.
- **Resposta de Exemplo**:
```json
{
  "status": "ok"
}
```

### 3.4. Informações do Perfil Logado (`user info`)
Para exibir avatar, nome, username e contadores na tela inicial:

- **Método**: `GET`
- **URL**: `https://www.instagram.com/api/v1/users/{userId}/info/`
- **Resposta de Exemplo**:
```json
{
  "user": {
    "pk": 12345678,
    "username": "meu_perfil",
    "full_name": "Meu Nome",
    "profile_pic_url": "https://...",
    "follower_count": 842,
    "following_count": 1150
  },
  "status": "ok"
}
```

---

## 4. O Algoritmo de 2 Fases (Detecção de Não-Seguidores)

Como a API REST do Instagram Web não retorna o campo `follows_viewer` dentro dos endpoints de lista, o GhostGram executa o cruzamento em 2 fases:

```typescript
export async function runTwoPhaseScan(
  client: DesktopInstagramApiClient,
  userId: string,
  onProgress: (phase: 'following' | 'followers' | 'completed', pct: number, count: number) => void
): Promise<User[]> {
  // FASE 1: Coleta todos os perfis seguidos
  const followingList: FriendshipUserRaw[] = [];
  let followingCursor: string | null = null;
  let page = 0;

  do {
    const response = await client.fetchFriendshipsPage('following', followingCursor);
    followingList.push(...response.users);
    followingCursor = response.next_max_id || null;
    page++;

    const pct = Math.min(45, Math.round(100 * (1 - 1 / (1 + followingList.length / 150)) * 0.45));
    onProgress('following', pct, followingList.length);

    if (!response.has_more || !followingCursor || page >= 60) break;
    await applyRandomJitter();
  } while (followingCursor);

  // FASE 2: Coleta todos os seguidores e extrai os IDs
  const followerIdsSet = new Set<string>();
  let followerCursor: string | null = null;
  page = 0;

  do {
    const response = await client.fetchFriendshipsPage('followers', followerCursor);
    for (const u of response.users) {
      followerIdsSet.add(String(u.pk_id ?? u.pk));
    }
    followerCursor = response.next_max_id || null;
    page++;

    const pct = Math.min(95, Math.round(45 + 100 * (1 - 1 / (1 + followerIdsSet.size / 150)) * 0.50));
    onProgress('followers', pct, followerIdsSet.size);

    if (!response.has_more || !followerCursor || page >= 250) break;
    await applyRandomJitter();
  } while (followerCursor);

  // FASE 3: Cruzamento de dados
  const results = followingList.map(raw => {
    const id = String(raw.pk_id ?? raw.pk);
    const followsViewer = followerIdsSet.has(id);
    return new User(
      id,
      raw.username,
      raw.full_name || '',
      raw.profile_pic_url || '',
      Boolean(raw.is_verified),
      Boolean(raw.is_private),
      followsViewer
    );
  });

  onProgress('completed', 100, results.length);
  return results;
}
```

---

## 5. Regras de Prevenção a Bloqueios (Rate Limiting & Safety)

1. **Jitter Humano**:
   - Cada requisição de página deve ter um atraso aleatório de `500ms` a `2000ms`.
   - Adicionar intervalo base configurável (padrão: `1000ms`).
2. **Pausa por Lote no Scan**:
   - A cada 5 páginas consecutivas baixadas, aguardar uma pausa de segurança de `15 segundos` a `25 segundos`.
3. **Limite Seguro no Unfollow**:
   - Intervalo de `5 segundos` a `10 segundos` entre cada unfollow.
   - A cada **5 unfollows consecutivos**, forçar uma pausa de **5 minutos** (`300.000ms`).
   - Respeitar o limite diário da conta (máximo 50 a 100 unfollows por dia em contas antigas; máximo 20 em contas novas).
4. **Tratamento de Códigos de Erro**:
   - **HTTP 429 (Too Many Requests)**: Interromper o scan imediatamente, salvar estado atual e alertar o usuário para aguardar 1 hora.
   - **HTTP 400 com "action_blocked"**: Interromper e solicitar verificação da conta no aplicativo oficial.
