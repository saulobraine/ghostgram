// useFloatingPanel - Hook to manage floating panel state with persistence
// Note: React must be available on window.React
if (!window.React) {
  throw new Error('React must be loaded on window.React before importing useFloatingPanel');
}

const { useState, useEffect, useCallback, useRef } = window.React;
import { SyncStorageAdapter } from '../../storage/SyncStorageAdapter.js';
import { STORAGE_KEYS } from '../../constants/Constants.js';

/**
 * Hook to manage floating panel expanded/collapsed state with persistence
 * @param {boolean} defaultExpanded - Default state if not found in storage
 * @returns {{ isExpanded: boolean, toggle: Function, setExpanded: Function }}
 */
export function useFloatingPanel(defaultExpanded = false) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLoaded, setIsLoaded] = useState(false);
  const storage = new SyncStorageAdapter();
  const debounceTimerRef = useRef(null);

  // Load initial state from storage
  useEffect(() => {
    let mounted = true;

    storage.get(STORAGE_KEYS.FLOATING_PANEL_EXPANDED).then(value => {
      if (mounted) {
        const savedState = value !== null ? Boolean(value) : defaultExpanded;
        setIsExpanded(savedState);
        setIsLoaded(true);
      }
    }).catch(error => {
      console.error('[useFloatingPanel] Error loading state:', error);
      if (mounted) {
        setIsExpanded(defaultExpanded);
        setIsLoaded(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [defaultExpanded]);

  // Save state to storage with debounce
  const saveState = useCallback((newState) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      storage.set(STORAGE_KEYS.FLOATING_PANEL_EXPANDED, newState).catch(error => {
        console.error('[useFloatingPanel] Error saving state:', error);
      });
    }, 300); // 300ms debounce
  }, []);

  // Toggle expanded state
  const toggle = useCallback(() => {
    setIsExpanded(prev => {
      const newState = !prev;
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Set expanded state explicitly
  const setExpanded = useCallback((expanded) => {
    setIsExpanded(expanded);
    saveState(expanded);
  }, [saveState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return { isExpanded, toggle, setExpanded, isLoaded };
}
