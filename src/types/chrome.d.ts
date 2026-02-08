/**
 * Extensões de tipos para Chrome Extension APIs
 * Complementa @types/chrome com tipos específicos do projeto
 */

declare namespace chrome {
  namespace storage {
    interface StorageArea {
      get(keys: string | string[] | null): Promise<Record<string, any>>;
      set(items: Record<string, any>): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    }
  }

  namespace runtime {
    interface MessageSender {
      tab?: chrome.tabs.Tab;
      frameId?: number;
      id?: string;
      url?: string;
      tlsChannelId?: string;
    }

    type MessageResponse = any;
  }
}
