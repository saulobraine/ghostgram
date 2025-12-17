// App - Main application component
// Note: React must be available on window.React
if (!window.React) {
  throw new Error('React must be loaded on window.React before importing App');
}

const { useState, useEffect, useCallback } = window.React;
import { ScanState } from './domain/ScanState.js';
import { Filter } from './domain/Filter.js';
import { Settings } from '../../domain/Settings.js';
import { DEFAULT_SETTINGS } from '../../constants/Constants.js';
import { useScanning } from './hooks/useScanning.js';
import { useUnfollowing } from './hooks/useUnfollowing.js';
import { useWhitelist } from './hooks/useWhitelist.js';
import { useFilter } from './hooks/useFilter.js';
import { UserFilterService } from './services/UserFilterService.js';
import { PaginationService } from './services/PaginationService.js';
import { ClipboardHelper } from './utils/ClipboardHelper.js';
import { NotSearching } from './components/NotSearching.js';
import { Searching } from './components/Searching.js';
import { Unfollowing } from './components/Unfollowing.js';
import { Toolbar } from './components/Toolbar.js';
import { Toast } from './components/Toast.js';
import { FloatingPanel } from './components/FloatingPanel.js';
import { UserCheckIcon } from './components/UserCheckIcon.js';
import { UserUncheckIcon } from './components/UserUncheckIcon.js';
import { UsersPopup } from './components/UsersPopup.js';
import { SyncStorageAdapter } from '../../storage/SyncStorageAdapter.js';
import { LocalStorageAdapter } from '../../storage/LocalStorageAdapter.js';
import { ExtensionState } from '../../domain/ExtensionState.js';
import { STORAGE_KEYS } from '../../constants/Constants.js';
import { useFloatingPanel } from './hooks/useFloatingPanel.js';

export function App() {
  const scanning = useScanning();
  const unfollowing = useUnfollowing();
  const whitelist = useWhitelist();
  const filter = useFilter();
  const { isExpanded, toggle: toggleFloatingPanel } = useFloatingPanel(false);

  const [currentTab, setCurrentTab] = useState('non_whitelisted');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResults, setSelectedResults] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', style: 'info' });
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(Settings.createDefault());
  const [extensionEnabled, setExtensionEnabled] = useState(true);
  const [showUsersPopup, setShowUsersPopup] = useState(false);

  useEffect(() => {
    loadSettings();
    loadExtensionState();

    // Listen for storage changes to update extension state
    const handleStorageChange = (changes, areaName) => {
      if (areaName === 'local' && changes[STORAGE_KEYS.ENABLED]) {
        const state = ExtensionState.fromStorageValue(changes[STORAGE_KEYS.ENABLED].newValue);
        setExtensionEnabled(state.isEnabled());
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  async function loadExtensionState() {
    const adapter = new LocalStorageAdapter();
    const value = await adapter.get(STORAGE_KEYS.ENABLED);
    const state = ExtensionState.fromStorageValue(value);
    setExtensionEnabled(state.isEnabled());
  }

  function handleStartScan() {
    scanning.start();
  }

  useEffect(() => {
    const handleMessage = (event) => {
      // Verifica se a mensagem é do content script
      if (event.data && event.data.type === 'INSTAGRAM_UNFOLLOWERS_START_SCAN' &&
        event.data.source === 'content-script') {
        // Só inicia se estiver no estado inicial
        if (scanning.state.status.isInitial()) {
          handleStartScan();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [scanning]);

  useEffect(() => {
    const isActive = !scanning.state.status.isInitial() && scanning.state.percentage < 100;
    const handler = (e) => {
      if (isActive) {
        e.returnValue = 'Changes you made may not be saved.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [scanning.state.status, scanning.state.percentage]);

  async function loadSettings() {
    const adapter = new SyncStorageAdapter();
    const data = await adapter.get('settings');
    if (data) {
      setSettings(Settings.fromObject(data));
    }
  }

  async function saveSettings(newSettings) {
    const adapter = new SyncStorageAdapter();
    await adapter.set('settings', newSettings.toObject());
    setSettings(newSettings);
    setShowSettings(false);
    showToast('Settings saved!', 'success');
  }

  function showToast(message, style = 'info') {
    setToast({ show: true, message, style });
    setTimeout(() => setToast({ show: false, message: '', style: 'info' }), 3000);
  }

  function handleCopyList() {
    const users = getFilteredUsers();
    ClipboardHelper.copyUsersList(users);
    showToast('List copied to clipboard!', 'success');
  }

  function handleUnfollow(usersToUnfollow = null) {
    const users = usersToUnfollow || selectedResults;
    
    if (users.length === 0) {
      alert('Must select at least a single user to unfollow');
      return;
    }

    if (!confirm('Are you sure?')) {
      return;
    }

    scanning.setState(prev => ({
      ...prev,
      status: ScanState.createUnfollowing(),
      selectedResultsCount: users.length
    }));

    unfollowing.execute(users);
  }

  function getFilteredUsers() {
    const filterService = new UserFilterService();
    return filterService.filter(
      scanning.state.results,
      filter.filter,
      searchTerm,
      whitelist.whitelist,
      currentTab
    );
  }

  function getCurrentPageUsers() {
    const filtered = getFilteredUsers();
    return PaginationService.getCurrentPage(filtered, page);
  }

  function getMaxPage() {
    const filtered = getFilteredUsers();
    return PaginationService.getMaxPage(filtered);
  }

  function handleFilterChange(e) {
    const name = e.target.name;
    const checked = e.target.checked;

    if (selectedResults.length > 0 && !confirm('Changing filter options will clear selected users')) {
      return;
    }

    filter.updateFilter({ [name]: checked });
    setSelectedResults([]);
  }

  function handleToggleUser(checked, user) {
    if (checked) {
      setSelectedResults(prev => [...prev, user]);
      return;
    }

    setSelectedResults(prev => prev.filter(u => !u.equals(user)));
  }

  function handleToggleAllUsers(checked) {
    if (checked) {
      const allUsers = getFilteredUsers();
      setSelectedResults(allUsers);
      return;
    }

    setSelectedResults([]);
  }

  function handleToggleCurrentPageUsers(checked) {
    if (checked) {
      const pageUsers = getCurrentPageUsers();
      setSelectedResults(pageUsers);
      return;
    }

    setSelectedResults([]);
  }

  async function handleWhitelistToggle(user) {
    if (whitelist.contains(user)) {
      await whitelist.remove(user);
      return;
    }

    await whitelist.add(user);
  }

  function handleLogoClick() {
    if (scanning.state.percentage < 100) {
      return;
    }

    if (scanning.state.status.isInitial()) {
      if (confirm('Go back to Instagram?')) {
        location.reload();
      }
      return;
    }

    scanning.setState(prev => ({
      ...prev,
      status: ScanState.createInitial()
    }));
  }

  function isAllSelected() {
    const filtered = getFilteredUsers();
    return filtered.length > 0 && filtered.every(user =>
      selectedResults.some(selected => selected.equals(user))
    );
  }

  function isCurrentPageSelected() {
    const pageUsers = getCurrentPageUsers();
    return pageUsers.length > 0 && pageUsers.every(user =>
      selectedResults.some(selected => selected.equals(user))
    );
  }

  function getUnfollowFilteredLog() {
    const log = unfollowing.state.unfollowLog;
    const searchLower = searchTerm.toLowerCase();
    const filter = unfollowing.state.filter;

    return log.filter(entry => {
      if (!filter.showSucceeded && entry.wasSuccessful()) {
        return false;
      }
      if (!filter.showFailed && entry.wasFailure()) {
        return false;
      }
      if (!searchTerm) {
        return true;
      }
      const username = entry.getUser().getUsername().toLowerCase();
      return username.includes(searchLower);
    });
  }

  const currentState = scanning.state.status.isScanning() ? scanning.state :
    unfollowing.state.status.isUnfollowing() ? unfollowing.state :
      scanning.state;

  const isActiveProcess = !currentState.status.isInitial() && currentState.percentage < 100;

  return (
    <main id="main" role="main" className="iu">
      <section className="overlay">
        <Toolbar
          state={currentState}
          isActiveProcess={isActiveProcess}
          onLogoClick={handleLogoClick}
          onCopyList={handleCopyList}
          onViewUsers={() => setShowUsersPopup(true)}
          onSearchChange={setSearchTerm}
          onToggleAllUsers={(e) => handleToggleAllUsers(e.target.checked)}
          onToggleCurrentPageUsers={(e) => handleToggleCurrentPageUsers(e.target.checked)}
          onSettingsClick={() => setShowSettings(true)}
          showSettings={showSettings}
          settings={settings}
          onSettingsSave={saveSettings}
          onSettingsCancel={() => setShowSettings(false)}
          isAllSelected={isAllSelected()}
          isCurrentPageSelected={isCurrentPageSelected()}
        />
        {renderContent()}
        {toast.show && (
          <Toast
            show={toast.show}
            message={toast.message}
            style={toast.style}
            onClose={() => setToast({ show: false, message: '', style: 'info' })}
          />
        )}
      </section>
      <FloatingPanel
        isExpanded={isExpanded}
        onToggle={toggleFloatingPanel}
        scanningState={scanning.state}
        unfollowingState={unfollowing.state}
        extensionEnabled={extensionEnabled}
        onStartScan={handleStartScan}
        onCopyList={handleCopyList}
        selectedResultsCount={selectedResults.length}
      />
      {showUsersPopup && (
        <UsersPopup
          isOpen={showUsersPopup}
          users={getFilteredUsers()}
          onClose={() => setShowUsersPopup(false)}
          onUnfollow={handleUnfollow}
          onWhitelistToggle={handleWhitelistToggle}
          whitelist={whitelist.whitelist}
        />
      )}
    </main>
  );

  function renderContent() {
    const hasResults = scanning.state.results.length > 0;
    const isScanning = scanning.state.status.isScanning();
    const isPaused = scanning.state.status.isPaused();
    const isCompleted = scanning.state.status.isCompleted();

    // Show NotSearching only if initial and no results
    if (scanning.state.status.isInitial() && !hasResults) {
      return <NotSearching onScan={handleStartScan} />;
    }

    // Show Searching if scanning, paused, or completed (with results)
    if (isScanning || isPaused || isCompleted) {
      return (
        <Searching
          state={{
            ...scanning.state,
            filter: filter.filter,
            currentTab,
            page,
            searchTerm,
            selectedResults
          }}
          onFilterChange={handleFilterChange}
          onToggleUser={handleToggleUser}
          onPause={scanning.pause}
          onResume={scanning.resume}
          onPageChange={setPage}
          onUnfollow={handleUnfollow}
          isPaused={scanning.isPaused || isPaused}
          filteredUsers={getFilteredUsers()}
          currentPageUsers={getCurrentPageUsers()}
          maxPage={getMaxPage()}
          UserCheckIcon={UserCheckIcon}
          UserUncheckIcon={UserUncheckIcon}
          onTabChange={setCurrentTab}
          onWhitelistToggle={handleWhitelistToggle}
        />
      );
    }

    if (unfollowing.state.status.isUnfollowing()) {
      return (
        <Unfollowing
          state={{
            ...unfollowing.state,
            selectedResultsCount: selectedResults.length
          }}
          onFilterChange={(e) => {
            const name = e.target.name;
            const checked = e.target.checked;
            unfollowing.setState(prev => ({
              ...prev,
              filter: { ...prev.filter, [name]: checked }
            }));
          }}
          filteredLog={getUnfollowFilteredLog()}
          onPause={unfollowing.pause}
          onResume={unfollowing.resume}
          isPaused={unfollowing.isPaused}
        />
      );
    }

    return null;
  }
}

