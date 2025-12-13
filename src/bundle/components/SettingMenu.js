// SettingMenu - Presentation component
import { useState } from 'react';
import { Settings } from '../../domain/Settings.js';

export function SettingMenu({ settings, onSave, onCancel }) {
  const [timeBetweenSearchCycles, setTimeBetweenSearchCycles] = useState(
    settings.getTimeBetweenSearchCycles()
  );
  const [timeToWaitAfterFiveSearchCycles, setTimeToWaitAfterFiveSearchCycles] = useState(
    settings.getTimeToWaitAfterFiveSearchCycles()
  );
  const [timeBetweenUnfollows, setTimeBetweenUnfollows] = useState(
    settings.getTimeBetweenUnfollows()
  );
  const [timeToWaitAfterFiveUnfollows, setTimeToWaitAfterFiveUnfollows] = useState(
    settings.getTimeToWaitAfterFiveUnfollows()
  );

  function handleSubmit(e) {
    e.preventDefault();
    const newSettings = new Settings(
      timeBetweenSearchCycles,
      timeToWaitAfterFiveSearchCycles,
      timeBetweenUnfollows,
      timeToWaitAfterFiveUnfollows
    );
    onSave(newSettings);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="backdrop">
        <div className="setting-menu">
          <div>
            <h3>Settings</h3>
          </div>
          <div className="row">
            <label className="minimun-width">Default time between search cycles</label>
            <input
              type="number"
              id="searchCycles"
              name="searchCycles"
              min="500"
              max="999999"
              value={timeBetweenSearchCycles}
              onChange={(e) => setTimeBetweenSearchCycles(Number(e.target.value))}
            />
            <label className="margin-between-input-and-label">(ms)</label>
          </div>
          <div className="row">
            <label className="minimun-width">Default time to wait after five search cycles</label>
            <input
              type="number"
              id="fiveSearchCycles"
              name="fiveSearchCycles"
              min="4000"
              max="999999"
              value={timeToWaitAfterFiveSearchCycles}
              onChange={(e) => setTimeToWaitAfterFiveSearchCycles(Number(e.target.value))}
            />
            <label className="margin-between-input-and-label">(ms)</label>
          </div>
          <div className="row">
            <label className="minimun-width">Default time between unfollows</label>
            <input
              type="number"
              id="timeBetweenUnfollow"
              name="timeBetweenUnfollow"
              min="1000"
              max="999999"
              value={timeBetweenUnfollows}
              onChange={(e) => setTimeBetweenUnfollows(Number(e.target.value))}
            />
            <label className="margin-between-input-and-label">(ms)</label>
          </div>
          <div className="row">
            <label className="minimun-width">Default time to wait after five unfollows</label>
            <input
              type="number"
              id="timeAfterFiveUnfollows"
              name="timeAfterFiveUnfollows"
              min="70000"
              max="999999"
              value={timeToWaitAfterFiveUnfollows}
              onChange={(e) => setTimeToWaitAfterFiveUnfollows(Number(e.target.value))}
            />
            <label className="margin-between-input-and-label">(ms)</label>
          </div>
          <div>
            <h3 className="warning">
              <b>WARNING:</b> Modifying these settings can lead to your account being banned.
            </h3>
            <h3 className="warning">USE IT AT YOUR OWN RISK!!!!</h3>
          </div>
          <div className="btn-container">
            <button className="btn" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn" type="submit">
              Save
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

