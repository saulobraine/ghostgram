import React from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isScanning: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onStartScan: () => void;
  onOpenWhitelist: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isAuthenticated,
  isScanning,
  onLogin,
  onLogout,
  onStartScan,
  onOpenWhitelist,
  onOpenSettings,
}) => {
  return (
    <header
      style={{
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
            fontWeight: 800,
            fontSize: '18px',
            color: '#fff',
          }}
        >
          👻
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            GhostGram <span style={{ fontSize: '12px', color: '#06b6d4', fontWeight: 600 }}>Desktop</span>
          </h1>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Gestão Segura de Seguidores do Instagram</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated ? (
          <>
            {user && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#131d33',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '4px 12px 4px 6px',
                }}
              >
                {user.profile_pic_url ? (
                  <img
                    src={user.profile_pic_url}
                    alt={user.username}
                    referrerPolicy="no-referrer"
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                    }}
                  >
                    👤
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                    @{user.username}
                  </div>
                  {user.follower_count !== undefined && (
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {user.follower_count} seg. | {user.following_count} seguidos
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={onStartScan}
              disabled={isScanning}
              style={{ fontWeight: 600 }}
            >
              {isScanning ? '⏳ Escaneando...' : '🔍 Escanear Conta'}
            </button>

            <button className="btn btn-secondary btn-sm" onClick={onOpenWhitelist} title="Whitelist">
              🛡️ Whitelist
            </button>

            <button className="btn btn-secondary btn-sm" onClick={onOpenSettings} title="Configurações">
              ⚙️ Opções
            </button>

            <button className="btn btn-secondary btn-sm" onClick={onLogout} title="Desconectar">
              🚪 Sair
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onLogin}>
            🔐 Fazer Login no Instagram
          </button>
        )}
      </div>
    </header>
  );
};
