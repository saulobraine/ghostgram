// Declarações globais para React no window
/// <reference types="react" />

declare global {
  interface Window {
    React: typeof import("react");
  }
}

export {};
