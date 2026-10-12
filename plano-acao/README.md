# Plano de Ação: GhostGram Desktop

Este diretório contém o diagnóstico técnico completo e o plano detalhado de implementação para tornar o aplicativo Desktop do GhostGram funcional, estável e independente, utilizando as APIs REST oficiais do Instagram Web.

---

## 📑 Sumário dos Documentos

| Documento | Descrição |
|-----------|-----------|
| [00-visao-geral-e-diagnostico.md](./00-visao-geral-e-diagnostico.md) | Análise crítica da situação atual do pacote `packages/desktop`, problemas com a dependência do Expo Web, interceptação de navegação e ausência de sessão. |
| [01-arquitetura-desktop-independente.md](./01-arquitetura-desktop-independente.md) | Proposta de arquitetura desacoplada para o Electron: gestão de sessão isolada, comunicação segura via IPC e integração com `@ghostgram/shared`. |
| [02-integracao-apis-rest-instagram.md](./02-integracao-apis-rest-instagram.md) | Especificação das chamadas REST oficiais do Instagram Web (`/api/v1/friendships/`, cookies, headers, rate-limiting e antifraude). |
| [03-implementacao-passo-a-passo.md](./03-implementacao-passo-a-passo.md) | Guia prático de implementação fase a fase com checklist de entrega, código de referência e comandos de build/teste. |

---

## 🎯 Objetivo Principal

Transformar o pacote `packages/desktop` em um aplicativo de desktop completo (Windows, macOS e Linux) que:
1. Permita que o usuário faça login no Instagram de forma nativa e segura via Electron Session.
2. Capture automaticamente os cookies de autenticação (`ds_user_id`, `sessionid`, `csrftoken`).
3. Execute o escaneamento de não-seguidores em 2 fases utilizando as rotas REST do Instagram com o header `X-IG-App-ID: 936619743392459`.
4. Disponibilize uma interface desktop moderna, fluida e responsiva para filtros, gestão de whitelist e execução de unfollows com proteção de rate limit.
5. Seja empacotável em executáveis instaláveis (`.exe` NSIS, `.dmg`, `.AppImage`).
