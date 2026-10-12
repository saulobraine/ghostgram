import React, { useState, useMemo } from 'react';
import { ScannedUser, WhitelistItem } from '../types';

interface UserTableProps {
  users: ScannedUser[];
  whitelist: WhitelistItem[];
  selectedIds: Set<string>;
  isUnfollowing: boolean;
  onToggleSelect: (userId: string) => void;
  onSelectAllVisible: (ids: string[]) => void;
  onClearSelection: () => void;
  onToggleWhitelist: (user: ScannedUser) => void;
  onUnfollowSingle: (user: ScannedUser) => void;
  onUnfollowBulk: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  whitelist,
  selectedIds,
  isUnfollowing,
  onToggleSelect,
  onSelectAllVisible,
  onClearSelection,
  onToggleWhitelist,
  onUnfollowSingle,
  onUnfollowBulk,
  onExportCsv,
  onExportJson,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'non_followers' | 'followers' | 'verified' | 'private' | 'whitelisted'>('non_followers');

  const whitelistSet = useMemo(() => {
    return new Set(whitelist.map((w) => w.id));
  }, [whitelist]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const isWhitelisted = whitelistSet.has(user.id);

      // Search match
      const term = searchTerm.toLowerCase();
      const matchSearch =
        user.username.toLowerCase().includes(term) ||
        user.fullName.toLowerCase().includes(term);

      if (!matchSearch) return false;

      // Filter modes
      if (filterMode === 'non_followers') {
        return !user.followsViewer && !isWhitelisted;
      }
      if (filterMode === 'followers') {
        return user.followsViewer;
      }
      if (filterMode === 'verified') {
        return user.isVerified;
      }
      if (filterMode === 'private') {
        return user.isPrivate;
      }
      if (filterMode === 'whitelisted') {
        return isWhitelisted;
      }

      return true;
    });
  }, [users, whitelistSet, searchTerm, filterMode]);

  const visibleIds = useMemo(() => filteredUsers.map((u) => u.id), [filteredUsers]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Controls Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '280px' }}>
          <input
            type="text"
            className="input-text"
            placeholder="Buscar por @username ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', maxWidth: '320px' }}
          />

          <select
            className="input-text"
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as any)}
            style={{ cursor: 'pointer' }}
          >
            <option value="non_followers">❌ Não Te Seguem ({users.filter((u) => !u.followsViewer && !whitelistSet.has(u.id)).length})</option>
            <option value="all">👥 Todos ({users.length})</option>
            <option value="followers">✅ Te Seguem ({users.filter((u) => u.followsViewer).length})</option>
            <option value="verified">⭐ Verificados ({users.filter((u) => u.isVerified).length})</option>
            <option value="private">🔒 Privados ({users.filter((u) => u.isPrivate).length})</option>
            <option value="whitelisted">🛡️ Whitelist ({whitelist.length})</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedIds.size > 0 ? (
            <>
              <button
                className="btn btn-danger"
                disabled={isUnfollowing}
                onClick={onUnfollowBulk}
              >
                🗑️ Deixar de Seguir ({selectedIds.size})
              </button>
              <button className="btn btn-secondary btn-sm" onClick={onClearSelection}>
                Limpar Seleção
              </button>
            </>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              disabled={filteredUsers.length === 0}
              onClick={() => onSelectAllVisible(visibleIds)}
            >
              Selecionar Visíveis ({filteredUsers.length})
            </button>
          )}

          <div style={{ width: '1px', height: '24px', backgroundColor: '#1e293b', margin: '0 4px' }} />

          <button className="btn btn-secondary btn-sm" onClick={onExportCsv} title="Exportar para CSV">
            📥 CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onExportJson} title="Exportar para JSON">
            📥 JSON
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        {filteredUsers.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#94a3b8' }}>Nenhum perfil encontrado</div>
            <div style={{ fontSize: '13px' }}>
              {users.length === 0
                ? 'Clique em "Escanear Conta" no topo para analisar seus seguidores e seguidos.'
                : 'Ajuste os filtros ou a busca acima para encontrar perfis correspondentes.'}
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={() => {
                      if (allVisibleSelected) {
                        onClearSelection();
                      } else {
                        onSelectAllVisible(visibleIds);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th>Perfil</th>
                <th>Nome Completo</th>
                <th>Status</th>
                <th>Vínculo</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isSelected = selectedIds.has(user.id);
                const isWhitelisted = whitelistSet.has(user.id);

                return (
                  <tr key={user.id} style={{ backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.05)' : undefined }}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        disabled={isWhitelisted}
                        checked={isSelected}
                        onChange={() => onToggleSelect(user.id)}
                        style={{ cursor: isWhitelisted ? 'not-allowed' : 'pointer' }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {user.profilePicUrl ? (
                          <img
                            src={user.profilePicUrl}
                            alt={user.username}
                            referrerPolicy="no-referrer"
                            style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: '#1e293b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                            }}
                          >
                            👤
                          </div>
                        )}
                        <div>
                          <a
                            href={`https://www.instagram.com/${user.username}/`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: '#38bdf8',
                              textDecoration: 'none',
                              fontWeight: 600,
                              fontSize: '14px',
                            }}
                          >
                            @{user.username}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#cbd5e1' }}>{user.fullName || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {user.isVerified && (
                          <span className="badge badge-cyan" title="Conta Verificada">
                            ⭐ Verificado
                          </span>
                        )}
                        {user.isPrivate && (
                          <span className="badge badge-amber" title="Perfil Privado">
                            🔒 Privado
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {isWhitelisted ? (
                        <span className="badge badge-amber">🛡️ Whitelist</span>
                      ) : user.followsViewer ? (
                        <span className="badge badge-emerald">✅ Te Segue</span>
                      ) : (
                        <span className="badge badge-rose">❌ Não Te Segue</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onToggleWhitelist(user)}
                          title={isWhitelisted ? 'Remover da Whitelist' : 'Proteger na Whitelist'}
                        >
                          {isWhitelisted ? '🔓 Desproteger' : '🛡️ Proteger'}
                        </button>

                        {!user.followsViewer && !isWhitelisted && (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={isUnfollowing}
                            onClick={() => onUnfollowSingle(user)}
                            title="Deixar de Seguir Imediatamente"
                          >
                            🗑️ Deixar de Seguir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
