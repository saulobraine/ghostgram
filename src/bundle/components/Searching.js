// Searching - Presentation component (simplified, will be enhanced in App)
export function Searching({ 
  state, 
  onFilterChange, 
  onToggleUser, 
  onPause, 
  onResume, 
  onPageChange, 
  onUnfollow,
  isPaused,
  filteredUsers,
  currentPageUsers,
  maxPage,
  UserCheckIcon,
  UserUncheckIcon
}) {
  if (!state.status.isScanning()) {
    return null;
  }

  return (
    <section className="flex">
      <aside className="app-sidebar">
        <menu className="flex column m-clear p-clear">
          <p>Filter</p>
          <label className="badge m-small">
            <input
              type="checkbox"
              name="showNonFollowers"
              checked={state.filter.showNonFollowers()}
              onChange={onFilterChange}
            />
            {' '}Non-Followers
          </label>
          <label className="badge m-small">
            <input
              type="checkbox"
              name="showFollowers"
              checked={state.filter.showFollowers()}
              onChange={onFilterChange}
            />
            {' '}Followers
          </label>
          <label className="badge m-small">
            <input
              type="checkbox"
              name="showVerified"
              checked={state.filter.showVerified()}
              onChange={onFilterChange}
            />
            {' '}Verified
          </label>
          <label className="badge m-small">
            <input
              type="checkbox"
              name="showPrivate"
              checked={state.filter.showPrivate()}
              onChange={onFilterChange}
            />
            {' '}Private
          </label>
          <label className="badge m-small">
            <input
              type="checkbox"
              name="showWithOutProfilePicture"
              checked={state.filter.showWithOutProfilePicture()}
              onChange={onFilterChange}
            />
            {' '}Without Profile Picture
          </label>
        </menu>
        <div className="grow">
          <p>Displayed: {filteredUsers.length}</p>
          <p>Total: {state.results.length}</p>
        </div>
        <div className="controls">
          <button className="button-control button-pause" onClick={isPaused ? onResume : onPause}>
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
        <div className="grow t-center">
          <p>Pages</p>
          <a onClick={() => state.page > 1 && onPageChange(state.page - 1)} className="p-medium">
            ❮
          </a>
          <span>{state.page} / {maxPage}</span>
          <a onClick={() => state.page < maxPage && onPageChange(state.page + 1)} className="p-medium">
            ❯
          </a>
        </div>
        <button className="unfollow" onClick={onUnfollow}>
          UNFOLLOW ({state.selectedResults.length})
        </button>
      </aside>
      <article className="results-container">
        <nav className="tabs-container">
          <div
            className={`tab ${state.currentTab === 'non_whitelisted' ? 'tab-active' : ''}`}
            onClick={() => state.currentTab !== 'non_whitelisted' && onTabChange('non_whitelisted')}
          >
            Non-Whitelisted
          </div>
          <div
            className={`tab ${state.currentTab === 'whitelisted' ? 'tab-active' : ''}`}
            onClick={() => state.currentTab !== 'whitelisted' && onTabChange('whitelisted')}
          >
            Whitelisted
          </div>
        </nav>
        {renderUsers(currentPageUsers, state, onToggleUser, onTabChange, onWhitelistToggle, UserCheckIcon, UserUncheckIcon)}
      </article>
    </section>
  );
}

function renderUsers(users, state, onToggleUser, onTabChange, onWhitelistToggle, UserCheckIcon, UserUncheckIcon) {
  let lastInitial = '';
  
  return users.map(user => {
    const initial = user.getUsername().substring(0, 1).toUpperCase();
    const showInitial = initial !== lastInitial;
    lastInitial = initial;
    
    const isSelected = state.selectedResults.some(u => u.equals(user));
    
    return (
      <React.Fragment key={user.getId()}>
        {showInitial && <div className="alphabet-character">{initial}</div>}
        <label className="result-item">
          <div className="flex grow align-center">
            <div
              className="avatar-container"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onWhitelistToggle(user);
              }}
            >
              <img className="avatar" alt={user.getUsername()} src={user.getProfilePicUrl()} />
              <span className="avatar-icon-overlay-container">
                {state.currentTab === 'non_whitelisted' ? <UserCheckIcon /> : <UserUncheckIcon />}
              </span>
            </div>
            <div className="flex column m-medium">
              <a className="fs-xlarge" target="_blank" href={`/${user.getUsername()}`} rel="noreferrer">
                {user.getUsername()}
              </a>
              <span className="fs-medium">{user.getFullName()}</span>
            </div>
            {user.isVerified() && <div className="verified-badge">✔</div>}
            {user.isPrivate() && (
              <div className="flex justify-center w-100">
                <span className="private-indicator">Private</span>
              </div>
            )}
          </div>
          <input
            className="account-checkbox"
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleUser(e.target.checked, user)}
          />
        </label>
      </React.Fragment>
    );
  });
}

