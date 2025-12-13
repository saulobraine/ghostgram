// NotSearching - Presentation component
import React from 'react';

export function NotSearching({ onScan }) {
  return (
    <button className="run-scan" onClick={onScan}>
      RUN
    </button>
  );
}

