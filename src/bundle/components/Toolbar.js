// Toolbar - Presentation component
// Note: React must be available on window.React
if (!window.React) {
  throw new Error('React must be loaded on window.React before importing Toolbar');
}

const React = window.React;
import { Logo } from './Logo.js';
import { SettingIcon } from './SettingIcon.js';
import { SettingMenu } from './SettingMenu.js';

export function Toolbar({
  state,
  isActiveProcess,
  onLogoClick,
  onCopyList,
  onViewUsers,
  onSearchChange,
  onToggleAllUsers,
  onToggleCurrentPageUsers,
  onSettingsClick,
  showSettings,
  settings,
  onSettingsSave,
  onSettingsCancel,
  isAllSelected,
  isCurrentPageSelected
}) {
  return (
    <header className="app-header">
      {isActiveProcess && (
        <progress className="progressbar" value={state.percentage} max="100" />
      )}
      <div className="app-header-content">
        <div className="logo" onClick={onLogoClick}>
          <Logo />
          <div className="logo-text">
            <span>Instagram</span>
            <span>Unfollowers</span>
          </div>
        </div>
        <button 
          className="copy-list" 
          onClick={onCopyList} 
          disabled={!state.status.isPaused() && !state.status.isCompleted()}
        >
          Copy List
        </button>
        {(state.status.isPaused() || state.status.isCompleted()) && onViewUsers && (
          <button className="view-users" onClick={onViewUsers}>
            Ver usuários
          </button>
        )}
        {state.status.isInitial() && <SettingIcon onClick={onSettingsClick} />}
        <input
          type="text"
          className="search-bar"
          placeholder="Search..."
          disabled={state.status.isInitial()}
          value={state.status.isInitial() ? '' : state.searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {state.status.isScanning() && (
          <>
            <input
              title="Select all on this page"
              type="checkbox"
              disabled={state.percentage < 100}
              checked={isCurrentPageSelected}
              onChange={onToggleCurrentPageUsers}
              className="toggle-all-checkbox"
            />
            <input
              title="Select all"
              type="checkbox"
              disabled={state.percentage < 100}
              checked={isAllSelected}
              onChange={onToggleAllUsers}
              className="toggle-all-checkbox"
            />
          </>
        )}
      </div>
      {showSettings && (
        <SettingMenu
          settings={settings}
          onSave={onSettingsSave}
          onCancel={onSettingsCancel}
        />
      )}
    </header>
  );
}

