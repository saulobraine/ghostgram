// Unfollowing - Presentation component
import React from 'react';

export function Unfollowing({ state, onFilterChange, filteredLog }) {
  if (!state.status.isUnfollowing()) {
    return null;
  }

  const isComplete = state.unfollowLog.length === state.selectedResultsCount;

  return (
    <section className="flex">
      <aside className="app-sidebar">
        <menu className="flex column grow m-clear p-clear">
          <p>Filter</p>
          <label className="badge m-small">
            <input
              type="checkbox"
              name="showSucceeded"
              checked={state.filter.showSucceeded}
              onChange={onFilterChange}
            />
            {' '}Succeeded
          </label>
          <label className="badge m-small">
            <input
              type="checkbox"
              name="showFailed"
              checked={state.filter.showFailed}
              onChange={onFilterChange}
            />
            {' '}Failed
          </label>
        </menu>
      </aside>
      <article className="unfollow-log-container">
        {isComplete && (
          <>
            <hr />
            <div className="fs-large p-medium clr-green">All DONE!</div>
            <hr />
          </>
        )}
        {filteredLog.map((entry, index) => renderLogEntry(entry, index, state.selectedResultsCount))}
      </article>
    </section>
  );
}

function renderLogEntry(entry, index, total) {
  if (entry.wasSuccessful()) {
    return (
      <div className="p-medium" key={entry.getUser().getId()}>
        Unfollowed{' '}
        <a className="clr-inherit" target="_blank" href={`../${entry.getUser().getUsername()}`} rel="noreferrer">
          {entry.getUser().getUsername()}
        </a>
        <span className="clr-cyan"> [{index + 1}/{total}]</span>
      </div>
    );
  }

  return (
    <div className="p-medium clr-red" key={entry.getUser().getId()}>
      Failed to unfollow {entry.getUser().getUsername()} [{index + 1}/{total}]
    </div>
  );
}

