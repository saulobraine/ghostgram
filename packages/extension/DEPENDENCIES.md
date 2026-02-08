# Dependências - Instagram Unfollowers Extension

## Dependências Principais

### DevDependencies

- **@jest/globals**: ^29.7.0 - Globals do Jest para ES modules
- **jest**: ^29.7.0 - Framework de testes
- **jest-environment-jsdom**: ^29.7.0 - Ambiente DOM para testes
- **puppeteer**: ^24.15.0 - Automação de browser para testes E2E
- **archiver**: ^7.0.1 - Criação de arquivos ZIP para build

## Avisos de Depreciação

### Dependências Transitivas

Os seguintes avisos aparecem durante `npm install` mas são de dependências transitivas (não controladas diretamente):

- **abab@2.0.6**: Usado por dependências do Jest
  - Solução: Usar métodos nativos `atob()` e `btoa()` quando possível
  - Status: Aguardando atualização das dependências do Jest

- **domexception@4.0.0**: Usado por dependências do Jest
  - Solução: Usar `DOMException` nativo quando possível
  - Status: Aguardando atualização das dependências do Jest

- **inflight@1.0.6**: Usado por dependências antigas
  - Solução: Substituir por `lru-cache` se necessário
  - Status: Dependência transitiva, não afeta funcionalidade

- **glob@7.2.3**: Usado por dependências antigas
  - Solução: Atualizar para glob@9+ quando disponível
  - Status: Dependência transitiva, não afeta funcionalidade

### Puppeteer

- **Status**: Atualizado para ^24.15.0 (versão mais recente)
- **Nota**: Versões < 24.15.0 estão depreciadas

## Atualizações Recomendadas

Para manter as dependências atualizadas:

```bash
# Verificar dependências desatualizadas
npm outdated

# Atualizar dependências (cuidado com breaking changes)
npm update

# Atualizar apenas dependências de desenvolvimento
npm update --save-dev
```

## Verificação de Segurança

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir vulnerabilidades automaticamente
npm audit fix

# Corrigir vulnerabilidades com breaking changes
npm audit fix --force
```

## Notas Importantes

1. **Dependências Transitivas**: Os avisos de depreciação de `abab`, `domexception`, `inflight` e `glob` são de dependências transitivas do Jest e não afetam a funcionalidade da extensão.

2. **Puppeteer**: Mantido atualizado na versão mais recente (^24.15.0).

3. **Jest**: Versão 29.7.0 é estável e suporta ES modules.

4. **Compatibilidade**: Todas as dependências são compatíveis com Node.js 18.x e 20.x.

## Resolução de Problemas

### Erro: "Cannot find module"

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Avisos de Depreciação Persistentes

Os avisos de depreciação de dependências transitivas são normais e não afetam a funcionalidade. Eles serão resolvidos quando as dependências principais (Jest) forem atualizadas.

### Puppeteer não instala

```bash
# Instalar com flags específicas
npm install puppeteer --save-dev --legacy-peer-deps
```

