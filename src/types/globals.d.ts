/**
 * Tipos globais do projeto GhostGram
 */

// Extensão para window para propriedades customizadas
interface Window {
  __GHOSTGRAM_CONTENT_LOADED__?: boolean;
  __GHOSTGRAM_INITIALIZED__?: boolean;
}

// Tipos para mensagens entre contextos
interface GhostGramMessage {
  type: string;
  action?: string;
  payload?: Record<string, any>;
  source?: string;
  response?: any;
  error?: string;
  success?: boolean;
}

// Tipos para eventos de mensagem
interface GhostGramMessageEvent extends MessageEvent {
  data: GhostGramMessage;
}
