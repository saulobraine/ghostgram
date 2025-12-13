// useScanning - Custom hook for scanning state management
import { useState, useCallback, useRef } from 'react';
import { ScanState } from '../domain/ScanState.js';
import { ScanService } from '../services/ScanService.js';
import { InstagramApiClient } from '../services/InstagramApiClient.js';
import { Settings } from '../../domain/Settings.js';
import { DEFAULT_SETTINGS } from '../../constants/Constants.js';
import { LocalStorageAdapter } from '../../storage/LocalStorageAdapter.js';
import { SyncStorageAdapter } from '../../storage/SyncStorageAdapter.js';

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

  const handleProgress = useCallback((percentage, results) => {
    setState(prev => ({
      ...prev,
      percentage,
      results
    }));
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
      setState(prev => ({
        ...prev,
        status: ScanState.createInitial(),
        results,
        percentage: 100
      }));
    } catch (error) {
      console.error('Scan error:', error);
      setState(prev => ({
        ...prev,
        status: ScanState.createInitial()
      }));
    }
  }, [handleProgress]);

  const pause = useCallback(() => {
    if (scanServiceRef.current) {
      scanServiceRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (scanServiceRef.current) {
      scanServiceRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (scanServiceRef.current) {
      scanServiceRef.current.stop();
      setIsPaused(false);
      setState(prev => ({
        ...prev,
        status: ScanState.createInitial()
      }));
    }
  }, []);

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

