# Gerador de Ícones - Instagram Unfollowers Extension

## Métodos para Gerar Ícones

A extensão Chrome requer ícones nos tamanhos: **16x16**, **48x48** e **128x128** pixels.

### Método 1: Script Node.js (SVG) - Recomendado

Gera ícones SVG que podem ser convertidos para PNG:

```bash
npm run icons
```

Isso cria arquivos SVG em `icons/` que precisam ser convertidos para PNG.

### Método 2: Script Node.js com Canvas (PNG direto)

Gera ícones PNG diretamente (requer biblioteca `canvas`):

```bash
# Instalar canvas (opcional)
npm install canvas

# Gerar ícones PNG
npm run icons:png
```

**Nota**: A biblioteca `canvas` pode ter dependências nativas. Se houver problemas, use o Método 1 ou 3.

### Método 3: Gerador HTML (Mais Fácil)

1. Abra `generate-icons.html` no seu navegador
2. Clique em "Gerar Ícones"
3. Os ícones serão baixados automaticamente
4. Mova os arquivos para a pasta `icons/`

### Método 4: Conversão Manual

1. Use um editor de imagens (Photoshop, GIMP, Figma, etc.)
2. Crie ícones com os tamanhos:
   - `icon16.png` - 16x16 pixels
   - `icon48.png` - 48x48 pixels
   - `icon128.png` - 128x128 pixels
3. Salve na pasta `icons/`

## Design dos Ícones

Os ícones seguem o tema do Instagram:
- **Cores**: Gradiente rosa (#E4405F) → roxo (#833AB4) → amarelo (#FCAF45)
- **Elemento**: Câmera estilizada (referência ao Instagram)
- **Texto**: "U" para "Unfollowers" (opcional)

## Estrutura de Arquivos

Após gerar, você deve ter:

```
icons/
├── icon16.png   (16x16 pixels)
├── icon48.png   (48x48 pixels)
└── icon128.png  (128x128 pixels)
```

## Conversão SVG para PNG

Se você gerou arquivos SVG e precisa convertê-los para PNG:

### Opção 1: Online
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [Convertio](https://convertio.co/svg-png/)
- [SVG to PNG](https://svgtopng.com/)

### Opção 2: Command Line (ImageMagick)
```bash
# Instalar ImageMagick primeiro
convert icon16.svg icon16.png
convert icon48.svg icon48.png
convert icon128.svg icon128.png
```

### Opção 3: Node.js (sharp)
```bash
npm install sharp --save-dev
node -e "const sharp = require('sharp'); [16, 48, 128].forEach(size => sharp(`icons/icon${size}.svg`).png().toFile(`icons/icon${size}.png`));"
```

## Verificação

Após gerar os ícones, verifique se estão corretos:

1. ✅ Arquivos existem em `icons/`
2. ✅ Tamanhos corretos (16x16, 48x48, 128x128)
3. ✅ Formato PNG
4. ✅ `manifest.json` referencia os ícones corretamente

## Troubleshooting

### Erro: "canvas module not found"
- Use `npm run icons` (gera SVG) em vez de `npm run icons:png`
- Ou instale canvas: `npm install canvas`

### Ícones não aparecem na extensão
- Verifique se os arquivos estão em `icons/` (não `icon/`)
- Verifique se os nomes são exatamente `icon16.png`, `icon48.png`, `icon128.png`
- Verifique o `manifest.json` se os caminhos estão corretos

### Ícones ficam pixelados
- Certifique-se de que os ícones são exatamente do tamanho especificado
- Use ícones vetoriais (SVG) convertidos para PNG em alta resolução
- Evite redimensionar manualmente - crie cada tamanho separadamente

## Personalização

Para personalizar os ícones, edite:
- `scripts/generate-icons-simple.js` - Cores e design
- `scripts/generate-icons.js` - Design avançado com canvas
- `generate-icons.html` - Gerador visual no navegador

