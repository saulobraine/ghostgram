import React from 'react';

interface MetricCardsProps {
  followingCount: number;
  followersCount: number;
  nonFollowersCount: number;
  whitelistCount: number;
  selectedCount: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  followingCount,
  followersCount,
  nonFollowersCount,
  whitelistCount,
  selectedCount,
}) => {
  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <span className="metric-label">Perfis Seguidos</span>
        <span className="metric-value" style={{ color: '#38bdf8' }}>
          {followingCount}
        </span>
        <span className="metric-subtitle">Contas que você acompanha</span>
      </div>

      <div className="metric-card">
        <span className="metric-label">Seus Seguidores</span>
        <span className="metric-value" style={{ color: '#10b981' }}>
          {followersCount}
        </span>
        <span className="metric-subtitle">Pessoas que te seguem</span>
      </div>

      <div className="metric-card" style={{ borderColor: nonFollowersCount > 0 ? '#f43f5e33' : '#1e293b' }}>
        <span className="metric-label" style={{ color: '#f43f5e' }}>
          Não Te Seguem de Volta
        </span>
        <span className="metric-value" style={{ color: '#f43f5e' }}>
          {nonFollowersCount}
        </span>
        <span className="metric-subtitle">Candidatos a unfollow</span>
      </div>

      <div className="metric-card">
        <span className="metric-label">Whitelist Protegida</span>
        <span className="metric-value" style={{ color: '#f59e0b' }}>
          {whitelistCount}
        </span>
        <span className="metric-subtitle">Contas imunes a unfollow</span>
      </div>

      <div className="metric-card">
        <span className="metric-label">Selecionados</span>
        <span className="metric-value" style={{ color: selectedCount > 0 ? '#06b6d4' : '#64748b' }}>
          {selectedCount}
        </span>
        <span className="metric-subtitle">Prontos para unfollow em lote</span>
      </div>
    </div>
  );
};
