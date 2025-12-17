// useScanning - Custom hook for scanning state management
// Note: React must be available on window.React
if (!window.React) {
  throw new Error('React must be loaded on window.React before importing useScanning');
}

const { useState, useCallback, useRef, useEffect } = window.React;
import { ScanState } from '../domain/ScanState.js';
import { ScanService } from '../services/ScanService.js';
import { InstagramApiClient } from '../services/InstagramApiClient.js';
import { Settings } from '../../domain/Settings.js';
import { DEFAULT_SETTINGS } from '../../constants/Constants.js';
import { LocalStorageAdapter } from '../../storage/LocalStorageAdapter.js';
import { SyncStorageAdapter } from '../../storage/SyncStorageAdapter.js';
import { STORAGE_KEYS } from '../../constants/Constants.js';
import { User } from '../../domain/User.js';

export function useScanning() {
  const [state, setState] = useState({
    status: ScanState.createInitial(),
    results: [],
    percentage: 0,
    page: 1,
    searchTerm: '',
    currentTab: 'non_whitelisted',
    selectedResults: []
  });

  const [isPaused, setIsPaused] = useState(false);
  const scanServiceRef = useRef(null);
  const storageAdapterRef = useRef(new LocalStorageAdapter());

  // Load saved state on mount
  useEffect(() => {
    loadSavedState();
  }, []);

  const loadSavedState = useCallback(async () => {
    try {
      const savedState = await storageAdapterRef.current.get(STORAGE_KEYS.SCAN_STATE);
      if (savedState && (savedState.status === 'paused' || savedState.status === 'completed')) {
        const results = (savedState.results || []).map(userObj => User.fromObject(userObj));
        setState(prev => ({
          ...prev,
          status: ScanState.fromString(savedState.status),
          results,
          percentage: savedState.percentage || 0
        }));
        if (savedState.status === 'paused') {
          setIsPaused(true);
        }
      }
    } catch (error) {
      console.error('Error loading saved scan state:', error);
    }
  }, []);

  const saveState = useCallback(async (currentState) => {
    try {
      const stateToSave = {
        status: currentState.status.toString(),
        results: currentState.results.map(user => user.toObject()),
        percentage: currentState.percentage,
        timestamp: Date.now()
      };
      await storageAdapterRef.current.set(STORAGE_KEYS.SCAN_STATE, stateToSave);
    } catch (error) {
      console.error('Error saving scan state:', error);
    }
  }, []);

  const clearSavedState = useCallback(async () => {
    try {
      await storageAdapterRef.current.remove(STORAGE_KEYS.SCAN_STATE);
    } catch (error) {
      console.error('Error clearing saved scan state:', error);
    }
  }, []);

  const handleProgress = useCallback((percentage, results) => {
    setState(prev => {
      const newState = {
        ...prev,
        percentage,
        results
      };
      // Save progress if scanning
      if (prev.status.isScanning()) {
        saveState(newState);
      }
      return newState;
    });
  }, []);

  const start = useCallback(async () => {
    const settings = await loadSettings();
    const apiClient = new InstagramApiClient();
    const scanService = new ScanService(apiClient, settings, handleProgress);
    scanServiceRef.current = scanService;

    setState(prev => ({
      ...prev,
      status: ScanState.createScanning(),
      percentage: 0,
      results: [],
      selectedResults: []
    }));

    setIsPaused(false);

    try {
      const results = await scanService.start();
      setState(prev => {
        const newState = {
          ...prev,
          status: ScanState.createCompleted(),
          results,
          percentage: 100
        };
        saveState(newState);
        return newState;
      });
    } catch (error) {
      console.error('Scan error:', error);
      setState(prev => {
        const newState = {
          ...prev,
          status: ScanState.createInitial()
        };
        clearSavedState();
        return newState;
      });
    }
  }, [handleProgress, saveState, clearSavedState]);

  const pause = useCallback(() => {
    if (scanServiceRef.current) {
      scanServiceRef.current.pause();
      setIsPaused(true);
      setState(prev => {
        const newState = {
          ...prev,
          status: ScanState.createPaused()
        };
        saveState(newState);
        return newState;
      });
    }
  }, [saveState]);

  const resume = useCallback(() => {
    if (scanServiceRef.current) {
      scanServiceRef.current.resume();
      setIsPaused(false);
      setState(prev => {
        const newState = {
          ...prev,
          status: ScanState.createScanning()
        };
        saveState(newState);
        return newState;
      });
    }
  }, [saveState]);

  const stop = useCallback(() => {
    if (scanServiceRef.current) {
      scanServiceRef.current.stop();
      setIsPaused(false);
      setState(prev => {
        const newState = {
          ...prev,
          status: ScanState.createInitial()
        };
        clearSavedState();
        return newState;
      });
    }
  }, [clearSavedState]);

  async function loadSettings() {
    const adapter = new SyncStorageAdapter();
    const data = await adapter.get('settings');

    if (!data) {
      return Settings.createDefault();
    }

    return Settings.fromObject(data);
  }

  return {
    state,
    isPaused,
    start,
    pause,
    resume,
    stop,
    setState
  };
}

