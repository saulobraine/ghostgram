import React from 'react';
import { ScanProgressPayload } from '../types';

interface ScanProgressBarProps {
  progress: ScanProgressPayload;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export const ScanProgressBar: React.FC<ScanProgressBarProps> = ({
  progress,
  onPause,
  onResume,
  onCancel,
}) => {
  const isPaused = progress.stage === 'paused';

  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(180deg, #131d33, #0f172a)',
        borderColor: '#0284c7',
        boxShadow: '0 8px 24px rgba(2, 132, 199, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>⚡</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#f8fafc' }}>
              {progress.stage === 'following' && 'Fase 1/2: Coletando perfis seguidos...'}
              {progress.stage === 'followers' && 'Fase 2/2: Coletando seguidores para cruzamento...'}
              {progress.stage === 'analyzing' && 'Processando: Cruzando listas e gerando relatório...'}
              {progress.stage === 'completed' && 'Varredura concluída com sucesso!'}
              {progress.stage === 'paused' && 'Varredura pausada pelo usuário'}
              {progress.stage === 'error' && 'Erro durante o escaneamento'}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {progress.message || 'Por favor, aguarde enquanto as páginas são processadas de forma segura.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>
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
            background: isPaused
              ? '#f59e0b'
              : 'linear-gradient(90deg, #06b6d4, #3b82f6, #10b981)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
        <span>Seguidos analisados: {progress.followingCount}</span>
        <span>Seguidores comparados: {progress.followersCount}</span>
        <span style={{ color: '#f43f5e', fontWeight: 600 }}>
          Não te seguem: {progress.nonFollowersCount}
        </span>
      </div>
    </div>
  );
};
