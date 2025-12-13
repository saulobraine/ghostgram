# Troubleshooting - Content Script não carrega

## Problema

Erro: `Cannot use import statement outside a module (at content.js:2:1)`

## Solução Passo a Passo

### 1. Recarregar a Extensão Completamente

1. Abra `chrome://extensions/`
2. **Desative** a extensão (toggle OFF)
3. **Remova** a extensão completamente (clique no botão de lixeira)
4. **Recarregue** a página `chrome://extensions/`
5. **Adicione novamente** a extensão:
   - Clique em "Carregar sem compactação" (Load unpacked)
   - Selecione a pasta do projeto

### 2. Limpar Cache do Chrome

1. Feche **todas** as abas do Instagram
2. Abra uma **nova aba** e vá para `https://www.instagram.com`
3. Abra o DevTools (F12)
4. Vá na aba **Console**
5. Filtre por `[ContentScript]` para ver os logs

### 3. Verificar se o Content Script está rodando

Após recarregar a extensão e abrir o Instagram, você deve ver no console:

```
[ContentScript] Inicializando...
[ContentScript] Hostname válido
[ContentScript] Storage configurado
[ContentScript] Extensão habilitada? true/false
[ContentScript] Injeção verificada
[ContentScript] Configurando listener de mensagens...
[ContentScript] Listener configurado com sucesso
```

### 4. Se ainda não funcionar

1. Verifique se o arquivo `content.js` existe na raiz do projeto
2. Verifique se o `manifest.json` tem `"type": "module"` na seção `content_scripts`
3. Verifique se não há erros de sintaxe no `manifest.json` (use um validador JSON online)
4. Tente usar uma versão diferente do Chrome (ou Edge)

## Verificação Rápida

Execute no console do DevTools na página do Instagram:

```javascript
// Verifica se o content script está rodando
console.log(
  "Content script rodando?",
  typeof chrome !== "undefined" && chrome.runtime
);
```

Se retornar `undefined`, o content script não está rodando.
