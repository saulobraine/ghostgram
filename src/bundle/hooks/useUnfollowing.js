// useUnfollowing - Custom hook for unfollowing state management
// Note: React must be available on window.React
if (!window.React) {
  throw new Error('React must be loaded on window.React before importing useUnfollowing');
}

const { useState, useCallback, useRef } = window.React;
import { ScanState } from '../domain/ScanState.js';
import { UnfollowService } from '../services/UnfollowService.js';
import { InstagramApiClient } from '../services/InstagramApiClient.js';
import { Settings } from '../../domain/Settings.js';
import { SyncStorageAdapter } from '../../storage/SyncStorageAdapter.js';

export function useUnfollowing() {
  const [state, setState] = useState({
    status: ScanState.createInitial(),
    percentage: 0,
    unfollowLog: [],
    searchTerm: '',
    filter: { showSucceeded: true, showFailed: true }
  });

  const [isPaused, setIsPaused] = useState(false);
  const unfollowServiceRef = useRef(null);

  const handleProgress = useCallback((percentage, log) => {
    setState(prev => ({
      ...prev,
      percentage,
      unfollowLog: log
    }));
  }, []);

  const execute = useCallback(async (users) => {
    const settings = await loadSettings();
    const apiClient = new InstagramApiClient();
    const unfollowService = new UnfollowService(apiClient, settings, handleProgress);
    unfollowServiceRef.current = unfollowService;

    setState(prev => ({
      ...prev,
      status: ScanState.createUnfollowing(),
      percentage: 0,
      unfollowLog: []
    }));

    setIsPaused(false);

    try {
      const log = await unfollowService.execute(users);
      setState(prev => ({
        ...prev,
        status: ScanState.createInitial(),
        percentage: 100,
        unfollowLog: log
      }));
    } catch (error) {
      console.error('Unfollow error:', error);
      setState(prev => ({
        ...prev,
        status: ScanState.createInitial()
      }));
    }
  }, [handleProgress]);

  const pause = useCallback(() => {
    if (unfollowServiceRef.current) {
      unfollowServiceRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (unfollowServiceRef.current) {
      unfollowServiceRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (unfollowServiceRef.current) {
      unfollowServiceRef.current.stop();
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
    execute,
    pause,
    resume,
    stop,
    setState
  };
}

