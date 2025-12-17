// React wrapper - exports React from window for ES module compatibility
// This allows components to use `import React from 'react'` even when React
// is loaded from CDN as UMD (which puts it on window.React)

if (!window.React) {
  throw new Error('React must be loaded on window.React before importing this module');
}

export default window.React;
export const {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useContext,
  createContext,
  createElement,
  Fragment,
  Component,
  PureComponent,
  memo,
  forwardRef,
  lazy,
  Suspense,
  StrictMode
} = window.React;
