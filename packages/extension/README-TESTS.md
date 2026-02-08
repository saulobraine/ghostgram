# Testes - Instagram Unfollowers Extension

## Configuração

### Instalar Dependências

```bash
cd chrome-extension
npm install
```

### Executar Testes

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm run test:watch

# Executar com coverage
npm run test:coverage

# Executar apenas testes unitários
npm run test:unit

# Executar apenas testes de integração
npm run test:integration

# Executar testes de performance
npm run test:performance

# Executar testes E2E
npm run test:e2e

# Atualizar snapshots
npm run test:snapshot
```

## Estrutura de Testes

### Testes Unitários

Os testes unitários estão organizados por camada:

- **domain/**: Value Objects (ExtensionState, Settings)
- **storage/**: Storage Adapters e Wrappers
- **hostname/**: HostnameValidator
- **injection/**: BundleInjector
- **messaging/**: MessageHandler
- **popup/**: PopupController, StatusUpdater, ToggleHandler
- **options/**: SettingsFormController, SettingsLoader, SettingsSaver, SuccessMessage
- **background/**: BackgroundService, InstallHandler, MessageRouter, TabMonitor

### Testes de Integração

Testes que verificam a interação entre múltiplos componentes:

- **storage-integration.test.js**: Fluxo completo de storage
- **messaging-integration.test.js**: Fluxo completo de mensagens
- **popup-integration.test.js**: Fluxo completo do popup

### Testes de Performance

Testes que verificam a performance e eficiência das operações:

- **storage-performance.test.js**: Performance de operações de storage
- **messaging-performance.test.js**: Performance de operações de mensagens

#### Métricas de Performance

- **Storage Operations**: < 1s para 100 operações sequenciais
- **Cache Hits**: < 10ms para 1000 acessos ao cache
- **Batch Operations**: < 500ms para 50 operações em paralelo
- **Large Data**: < 50ms para dados de 10KB

### Testes E2E (End-to-End)

Testes que verificam o comportamento completo da extensão:

- **extension-e2e.test.js**: Testes completos da extensão

#### Requisitos para E2E

- Chrome/Chromium instalado
- Extensão buildada
- Executar com: `npm run test:e2e`

#### Nota sobre E2E

Os testes E2E requerem um ambiente com Chrome/Chromium. Em CI/CD, são executados apenas em push para main.

### Testes de Snapshot

Testes que verificam a consistência dos Value Objects:

- **ExtensionState.snapshot.test.js**: Snapshots do ExtensionState
- **Settings.snapshot.test.js**: Snapshots do Settings

#### Atualizar Snapshots

```bash
npm run test:snapshot
```

## Cobertura

O projeto está configurado para gerar relatórios de cobertura:

- **HTML**: `coverage/index.html`
- **LCOV**: `coverage/lcov.info`
- **Texto**: Exibido no terminal

### Meta de Cobertura

- **Unit Tests**: 100% das classes
- **Integration Tests**: Fluxos principais
- **Coverage Target**: >90%
- **Performance Tests**: Todas as operações críticas
- **E2E Tests**: Fluxos principais da extensão

## Mocks

### Chrome APIs

O projeto usa mocks para Chrome Extension APIs localizados em `tests/mocks/chrome-api.mock.js`:

- `chrome.storage.sync`
- `chrome.storage.local`
- `chrome.tabs`
- `chrome.runtime`

### DOM APIs

Mocks para DOM APIs em `tests/mocks/dom.mock.js`:

- `document`
- `location`
- Elementos DOM

## CI/CD

### GitHub Actions

O projeto inclui workflows do GitHub Actions:

- **CI**: Executa testes em push/PR
- **E2E**: Executa testes E2E semanalmente e em push para main

#### Workflows

1. **`.github/workflows/ci.yml`**: 
   - Testes unitários e de integração
   - Verificação de cobertura
   - Build da extensão
   - Upload de artifacts

2. **`.github/workflows/e2e.yml`**:
   - Testes E2E completos
   - Execução semanal e manual

### Configuração de CI

Os workflows estão configurados para:
- Executar em Node.js 18.x e 20.x
- Verificar cobertura mínima de 90%
- Buildar e empacotar a extensão
- Executar testes E2E apenas em main branch

## Executando Testes Específicos

```bash
# Executar apenas testes unitários de domain
npm test -- tests/unit/domain

# Executar apenas testes de integração
npm test -- tests/integration

# Executar apenas testes de performance
npm test -- tests/performance

# Executar um arquivo específico
npm test -- tests/unit/domain/ExtensionState.test.js

# Executar com filtro
npm test -- -t "should toggle"
```

## Troubleshooting

### Erros de Módulos ES6

Se encontrar erros relacionados a módulos ES6, certifique-se de que:
- O `package.json` tem `"type": "module"`
- O `jest.config.js` está configurado corretamente
- Você está usando `node --experimental-vm-modules`

### Erros de Chrome APIs

Se os testes falharem por falta de Chrome APIs:
- Verifique se `jest.setup.js` está sendo carregado
- Confirme que os mocks estão sendo criados no `beforeEach`

### Erros de Performance

Se os testes de performance falharem:
- Verifique se há processos concorrentes
- Ajuste os thresholds se necessário
- Execute em ambiente isolado

### Erros de E2E

Se os testes E2E falharem:
- Certifique-se de que Chrome/Chromium está instalado
- Verifique se a extensão foi buildada
- Execute com `CI=true` para modo headless

## Contribuindo

Ao adicionar novas funcionalidades:

1. Crie testes unitários para novas classes
2. Adicione testes de integração para novos fluxos
3. Adicione testes de performance para operações críticas
4. Atualize snapshots se necessário
5. Mantenha a cobertura acima de 90%
6. Execute `npm run test:coverage` antes de commitar
7. Execute `npm run test:e2e` antes de fazer merge em main

## Estrutura de Diretórios

```
tests/
├── unit/              # Testes unitários
├── integration/        # Testes de integração
├── performance/        # Testes de performance
├── e2e/               # Testes end-to-end
├── mocks/             # Mocks para APIs
└── setup/             # Configuração do Jest
```
