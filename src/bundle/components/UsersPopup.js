// UsersPopup - Fullscreen modal for viewing and managing users
// Note: React must be available on window.React
if (!window.React) {
  throw new Error('React must be loaded on window.React before importing UsersPopup');
}

const React = window.React;
import { UserCheckIcon } from './UserCheckIcon.js';
import { UserUncheckIcon } from './UserUncheckIcon.js';

export function UsersPopup({
  isOpen,
  users,
  onClose,
  onUnfollow,
  onWhitelistToggle,
  whitelist = []
}) {
  if (!isOpen) {
    return null;
  }

  const handleUnfollowUser = (user) => {
    if (confirm(`Tem certeza que deseja deixar de seguir ${user.getUsername()}?`)) {
      onUnfollow([user]);
    }
  };

  const isWhitelisted = (user) => {
    return whitelist.some(wlUser => wlUser.equals(user));
  };

  return (
    <div className="users-popup-overlay" onClick={onClose}>
      <div className="users-popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="users-popup-header">
          <h2>Usuários Encontrados ({users.length})</h2>
          <button className="users-popup-close" onClick={onClose}>×</button>
        </div>
        <div className="users-popup-body">
          {users.length === 0 ? (
            <div className="users-popup-empty">Nenhum usuário encontrado</div>
          ) : (
            <div className="users-popup-list">
              {users.map(user => {
                const whitelisted = isWhitelisted(user);
                return (
                  <div key={user.getId()} className="users-popup-item">
                    <div className="users-popup-item-avatar">
                      <img 
                        src={user.getProfilePicUrl()} 
                        alt={user.getUsername()}
                        className="users-popup-avatar-img"
                      />
                      <div 
                        className="users-popup-whitelist-toggle"
                        onClick={() => onWhitelistToggle(user)}
                        title={whitelisted ? "Remover da whitelist" : "Adicionar à whitelist"}
                      >
                        {whitelisted ? <UserUncheckIcon /> : <UserCheckIcon />}
                      </div>
                    </div>
                    <div className="users-popup-item-info">
                      <a 
                        href={`/${user.getUsername()}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="users-popup-username"
                      >
                        {user.getUsername()}
                      </a>
                      {user.getFullName() && (
                        <div className="users-popup-fullname">{user.getFullName()}</div>
                      )}
                      <div className="users-popup-badges">
                        {user.isVerified() && <span className="users-popup-badge verified">✓ Verificado</span>}
                        {user.isPrivate() && <span className="users-popup-badge private">🔒 Privado</span>}
                        {!user.followsViewer() && <span className="users-popup-badge non-follower">Não te segue</span>}
                      </div>
                    </div>
                    <div className="users-popup-item-actions">
                      <button 
                        className="users-popup-unfollow-btn"
                        onClick={() => handleUnfollowUser(user)}
                      >
                        Deixar de seguir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

