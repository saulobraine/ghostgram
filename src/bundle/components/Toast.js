// Toast - Presentation component
import React from 'react';

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

