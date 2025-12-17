// NotSearching - Presentation component
// Note: React must be available on window.React
if (!window.React) {
  throw new Error('React must be loaded on window.React before importing NotSearching');
}

const React = window.React;

export function NotSearching({ onScan }) {
  return (
    <button className="run-scan" onClick={onScan}>
      RUN
    </button>
  );
}

