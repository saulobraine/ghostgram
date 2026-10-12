import React, { useState } from 'react';
import { WhitelistItem } from '../types';

interface WhitelistManagerModalProps {
  isOpen: boolean;
  whitelist: WhitelistItem[];
  onClose: () => void;
  onAdd: (username: string) => void;
  onRemove: (idOrUsername: string) => void;
}

export const WhitelistManagerModal: React.FC<WhitelistManagerModalProps> = ({
  isOpen,
  whitelist,
  onClose,
  onAdd,
  onRemove,
}) => {
  const [newUsername, setNewUsername] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newUsername.trim().replace(/^@/, '');
    if (clean) {
      onAdd(clean);
      setNewUsername('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🛡️ Gerenciador de Whitelist ({whitelist.length})
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Contas adicionadas à Whitelist ficam permanentemente protegidas de ações de unfollow (individuais ou em lote).
          </p>

          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="input-text"
              placeholder="Digite o @username (ex: @amigo)..."
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={!newUsername.trim()}>
              Adicionar
            </button>
          </form>

          <div
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              backgroundColor: '#0b1120',
            }}
          >
            {whitelist.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                Nenhuma conta cadastrada na Whitelist.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  {whitelist.map((item) => (
                    <tr
                      key={item.id || item.username}
                      style={{ borderBottom: '1px solid #172237' }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#f8fafc' }}>
                        @{item.username}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '11px' }}>
                        {new Date(item.addedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => onRemove(item.id || item.username)}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
