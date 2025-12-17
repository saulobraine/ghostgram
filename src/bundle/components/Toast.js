// Toast - Presentation component
// Note: React must be available on window.React
if (!window.React) {
  throw new Error('React must be loaded on window.React before importing Toast');
}

const React = window.React;

export function Toast({ show, message, style, onClose }) {
  const normalizedStyle = style || 'info';
  const normalizedShow = show !== undefined ? show : false;

  return (
    <div className={`toast ${normalizedShow ? 'show' : ''} ${normalizedStyle}`} role="alert">
      <p className="toast__message">{message}</p>
      <button className="toast__close-button" onClick={onClose} title="close">
        ×
      </button>
    </div>
  );
}

