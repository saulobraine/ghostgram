import React from 'react';
import { UnfollowProgressPayload } from '../types';

interface UnfollowProgressBarProps {
  progress: UnfollowProgressPayload;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export const UnfollowProgressBar: React.FC<UnfollowProgressBarProps> = ({
  progress,
  onPause,
  onResume,
  onCancel,
}) => {
  const isCooldown = progress.status === 'cooling_down';
  const isPaused = progress.status === 'paused';

  const formatSeconds = (sec?: number) => {
    if (!sec) return '00:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="card"
      style={{
        background: isCooldown
          ? 'linear-gradient(180deg, #2a1b0c, #131d33)'
          : 'linear-gradient(180deg, #2b131e, #131d33)',
        borderColor: isCooldown ? '#f59e0b' : '#f43f5e',
        boxShadow: isCooldown
          ? '0 8px 24px rgba(245, 158, 11, 0.2)'
          : '0 8px 24px rgba(244, 63, 94, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{isCooldown ? '⏳' : '🗑️'}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#f8fafc' }}>
              {isCooldown ? (
                <span style={{ color: '#fbbf24' }}>
                  Pausa de Segurança Obrigatória ({formatSeconds(progress.cooldownRemainingSeconds)})
                </span>
              ) : (
                <span>
                  Processando Unfollow em Lote ({progress.currentIndex}/{progress.total})
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {progress.message ||
                (isCooldown
                  ? 'Aguardando intervalo anti-bloqueio para preservar sua conta do Instagram.'
                  : `Deixando de seguir perfil @${progress.currentUser || '...'}`)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: isCooldown ? '#f59e0b' : '#f43f5e' }}>
            {progress.percentage}%
          </span>
          {isPaused ? (
            <button className="btn btn-secondary btn-sm" onClick={onResume}>
              ▶️ Retomar
            </button>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={onPause}>
              ⏸️ Pausar
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={onCancel}>
            🛑 Cancelar
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div
        style={{
          width: '100%',
          height: '10px',
          backgroundColor: '#0b1120',
          borderRadius: '9999px',
          overflow: 'hidden',
          border: '1px solid #1e293b',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress.percentage}%`,
            background: isCooldown
              ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
              : 'linear-gradient(90deg, #f43f5e, #e11d48)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ color: '#10b981' }}>Sucessos: {progress.successCount}</span>
        <span style={{ color: progress.failedCount > 0 ? '#f43f5e' : '#64748b' }}>
          Falhas: {progress.failedCount}
        </span>
        <span style={{ color: '#94a3b8' }}>Restantes: {progress.total - progress.currentIndex}</span>
      </div>
    </div>
  );
};
