# Build - Instagram Unfollowers Extension

## Scripts de Build

### Build Básico

```bash
npm run build
```

Cria o diretório `build/` com todos os arquivos necessários para a extensão. Este script não requer dependências extras e funciona em Windows, Linux e Mac.

### Build com ZIP

```bash
npm run build:zip
```

Cria o diretório `build/` e também gera um arquivo `extension.zip` pronto para distribuição. Requer o pacote `archiver`.

**Nota**: Se você não tiver `archiver` instalado, use `npm run build` e crie o ZIP manualmente.

### Limpar Build

```bash
npm run clean
```

Remove o diretório `build/` e arquivos de build.

## Estrutura do Build

O script de build copia os seguintes arquivos e diretórios:

### Arquivos
- `manifest.json`
- `content.js`
- `background.js`
- `popup.html`
- `popup.js`
- `options.html`
- `options.js`
- `styles.css`
- `bundle.js`

### Diretórios
- `src/` - Todo o código fonte
- `icons/` - Ícones da extensão

### Excluídos
- `node_modules/`
- `tests/`
- `coverage/`
- `.git/`
- Arquivos de documentação
- Arquivos de configuração de desenvolvimento

## Carregar Extensão no Chrome

### Opção 1: Do diretório build

1. Abra Chrome e vá para `chrome://extensions/`
2. Ative "Modo do desenvolvedor" (toggle no canto superior direito)
3. Clique em "Carregar sem compactação"
4. Selecione o diretório `build/`

### Opção 2: Do arquivo ZIP

1. Extraia o arquivo `extension.zip`
2. Siga os passos da Opção 1 usando o diretório extraído

## Validação

O script de build valida automaticamente:

- ✅ Presença do `manifest.json`
- ✅ Estrutura correta do manifest
- ✅ Arquivos essenciais presentes

## Troubleshooting

### Erro: "Manifest.json not found"

Certifique-se de que o `manifest.json` existe na raiz do projeto.

### Erro ao criar ZIP no Windows

O script usa PowerShell para criar o ZIP. Se falhar, use `npm run build` e crie o ZIP manualmente:
- Selecione todos os arquivos em `build/`
- Clique com botão direito → "Enviar para" → "Pasta compactada"

### Arquivos faltando no build

Verifique se os arquivos listados em `filesToCopy` e `dirsToCopy` existem no projeto.

## CI/CD

O build é executado automaticamente no GitHub Actions (`.github/workflows/ci.yml`) e cria:
- Diretório `dist/` com os arquivos
- Arquivo `extension.zip` para distribuição

## Próximos Passos

Após o build:

1. **Testar localmente**: Carregue a extensão no Chrome e teste todas as funcionalidades
2. **Validar manifest**: Verifique se não há erros no console do Chrome
3. **Testar em diferentes páginas**: Certifique-se de que funciona em `www.instagram.com`
4. **Empacotar para Chrome Web Store**: Use o arquivo ZIP gerado

