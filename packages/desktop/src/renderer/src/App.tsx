import React, { useState, useEffect, useCallback } from 'react';
import {
  ScannedUser,
  WhitelistItem,
  DesktopAppSettings,
  UserProfile,
  ScanProgressPayload,
  UnfollowProgressPayload,
} from './types';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { ScanProgressBar } from './components/ScanProgressBar';
import { UnfollowProgressBar } from './components/UnfollowProgressBar';
import { UserTable } from './components/UserTable';
import { WhitelistManagerModal } from './components/WhitelistManagerModal';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  // Estado de Autenticação
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Dados Principais
  const [users, setUsers] = useState<ScannedUser[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<DesktopAppSettings>({
    unfollowDelayMin: 4,
    unfollowDelayMax: 8,
    consecutiveUnfollowLimit: 5,
    cooldownSeconds: 300,
    theme: 'dark',
  });

  // Estado de Escaneamento
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<ScanProgressPayload | null>(null);

  // Estado de Unfollow
  const [isUnfollowing, setIsUnfollowing] = useState<boolean>(false);
  const [unfollowProgress, setUnfollowProgress] = useState<UnfollowProgressPayload | null>(null);

  // Modais
  const [isWhitelistOpen, setIsWhitelistOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [confirmUnfollowModal, setConfirmUnfollowModal] = useState<{
    isOpen: boolean;
    targets: { id: string; username: string }[];
  }>({ isOpen: false, targets: [] });

  // 1. Inicialização e verificação de sessão
  const checkSession = useCallback(async () => {
    try {
      if (window.ghostgramDesktop?.auth) {
        const authData = await window.ghostgramDesktop.auth.checkSession();
        setIsAuthenticated(authData.isAuthenticated);
        setUserProfile(authData.profile);
      }
    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
    }
  }, []);

  // 2. Carregar Whitelist e Configurações
  const loadInitialData = useCallback(async () => {
    try {
      if (window.ghostgramDesktop?.storage) {
        const wl = await window.ghostgramDesktop.storage.getWhitelist();
        setWhitelist(wl || []);
        const s = await window.ghostgramDesktop.storage.getSettings();
        if (s) setSettings(s);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  }, []);

  useEffect(() => {
    void checkSession();
    void loadInitialData();

    // Listeners de progresso
    const cleanupScan = window.ghostgramDesktop?.scan?.onProgress((payload) => {
      setScanProgress(payload);
      if (payload.stage === 'completed' || payload.stage === 'idle' || payload.stage === 'error') {
        setIsScanning(false);
      }
    });

    const cleanupUnfollow = window.ghostgramDesktop?.unfollow?.onProgress((payload) => {
      setUnfollowProgress(payload);
      if (payload.status === 'completed' || payload.status === 'cancelled' || payload.status === 'error') {
        setIsUnfollowing(false);
      }
    });

    return () => {
      if (cleanupScan) cleanupScan();
      if (cleanupUnfollow) cleanupUnfollow();
    };
  }, [checkSession, loadInitialData]);

  // Ações de Autenticação
  const handleLogin = async () => {
    try {
      const res = await window.ghostgramDesktop.auth.login();
      if (res.success) {
        await checkSession();
      }
    } catch (err) {
      alert(`Falha no login: ${String(err)}`);
    }
  };

  const handleLogout = async () => {
    if (confirm('Tem certeza de que deseja sair do Instagram neste app?')) {
      await window.ghostgramDesktop.auth.logout();
      setIsAuthenticated(false);
      setUserProfile(null);
      setUsers([]);
      setSelectedIds(new Set());
    }
  };

  // Ações de Scan
  const handleStartScan = async () => {
    if (!isAuthenticated) {
      await handleLogin();
      return;
    }

    try {
      setIsScanning(true);
      setScanProgress({
        stage: 'following',
        percentage: 0,
        followingCount: 0,
        followersCount: 0,
        nonFollowersCount: 0,
        message: 'Iniciando escaneamento seguro...',
      });

      const results = await window.ghostgramDesktop.scan.start();
      setUsers(results || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg !== 'SCAN_CANCELLED') {
        alert(`Erro ao escanear: ${msg}`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Ações de Unfollow
  const executeUnfollow = async (targets: { id: string; username: string }[]) => {
    setConfirmUnfollowModal({ isOpen: false, targets: [] });
    setIsUnfollowing(true);
    setUnfollowProgress({
      status: 'running',
      currentIndex: 0,
      total: targets.length,
      percentage: 0,
      successCount: 0,
      failedCount: 0,
      message: 'Iniciando fila com proteção de rate limit...',
    });

    try {
      const results = await window.ghostgramDesktop.unfollow.start(targets);

      // Remover os que obtiveram sucesso da lista exibida
      const successfulIds = new Set(results.filter((r) => r.success).map((r) => r.userId));
      setUsers((prev) => prev.filter((u) => !successfulIds.has(u.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        successfulIds.forEach((id) => next.delete(id));
        return next;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg !== 'UNFOLLOW_CANCELLED') {
        alert(`Erro durante unfollow: ${msg}`);
      }
    } finally {
      setIsUnfollowing(false);
    }
  };

  const handleUnfollowSingle = (user: ScannedUser) => {
    setConfirmUnfollowModal({
      isOpen: true,
      targets: [{ id: user.id, username: user.username }],
    });
  };

  const handleUnfollowBulk = () => {
    const targets = users
      .filter((u) => selectedIds.has(u.id))
      .map((u) => ({ id: u.id, username: u.username }));

    if (targets.length === 0) return;

    setConfirmUnfollowModal({
      isOpen: true,
      targets,
    });
  };

  // Whitelist
  const handleToggleWhitelist = async (user: ScannedUser) => {
    const isCurrentlyWhitelisted = whitelist.some((w) => w.id === user.id);
    if (isCurrentlyWhitelisted) {
      const updated = await window.ghostgramDesktop.storage.removeFromWhitelist(user.id);
      setWhitelist(updated);
    } else {
      const updated = await window.ghostgramDesktop.storage.addToWhitelist({
        id: user.id,
        username: user.username,
      });
      setWhitelist(updated);
      // Desmarcar se estiver selecionado
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  const handleAddWhitelistByUsername = async (username: string) => {
    const foundUser = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    const id = foundUser ? foundUser.id : `custom_${Date.now()}`;
    const updated = await window.ghostgramDesktop.storage.addToWhitelist({ id, username });
    setWhitelist(updated);
  };

  const handleRemoveWhitelist = async (idOrUsername: string) => {
    const updated = await window.ghostgramDesktop.storage.removeFromWhitelist(idOrUsername);
    setWhitelist(updated);
  };

  // Configurações
  const handleSaveSettings = async (newSettings: Partial<DesktopAppSettings>) => {
    const updated = await window.ghostgramDesktop.storage.saveSettings(newSettings);
    setSettings(updated);
  };

  // Exportação
  const handleExportCsv = async () => {
    const dataToExport = users.map((u) => ({
      username: u.username,
      full_name: u.fullName,
      id: u.id,
      follows_viewer: u.followsViewer ? 'sim' : 'nao',
      is_verified: u.isVerified ? 'sim' : 'nao',
      is_private: u.isPrivate ? 'sim' : 'nao',
      whitelisted: whitelist.some((w) => w.id === u.id) ? 'sim' : 'nao',
    }));

    const csvContent = await window.ghostgramDesktop.storage.exportCsv(dataToExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ghostgram_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(users, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ghostgram_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Contadores
  const followingCount = users.length;
  const followersCount = users.filter((u) => u.followsViewer).length;
  const nonFollowersCount = users.filter((u) => !u.followsViewer && !whitelist.some((w) => w.id === u.id)).length;

  return (
    <div className="app-container">
      <Header
        user={userProfile}
        isAuthenticated={isAuthenticated}
        isScanning={isScanning}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onStartScan={handleStartScan}
        onOpenWhitelist={() => setIsWhitelistOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="main-content">
        {/* Banner para usuário não autenticado */}
        {!isAuthenticated && (
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(37, 99, 235, 0.1))',
              borderColor: '#0284c7',
              textAlign: 'center',
              padding: '40px 20px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Conecte sua conta do Instagram
            </h2>
            <p style={{ color: '#94a3b8', maxWidth: '520px', margin: '0 auto 20px auto', fontSize: '14px' }}>
              O GhostGram Desktop utiliza uma partição nativa isolada do Electron para realizar login de forma segura e capturar sua sessão localmente, sem enviar suas credenciais para servidores de terceiros.
            </p>
            <button className="btn btn-primary" onClick={handleLogin} style={{ padding: '10px 24px', fontSize: '15px' }}>
              🔐 Abrir Janela Segura de Login
            </button>
          </div>
        )}

        {/* Métricas do Perfil */}
        {isAuthenticated && (
          <MetricCards
            followingCount={followingCount}
            followersCount={followersCount}
            nonFollowersCount={nonFollowersCount}
            whitelistCount={whitelist.length}
            selectedCount={selectedIds.size}
          />
        )}

        {/* Barra de Progresso do Escaneamento */}
        {scanProgress && (scanProgress.stage !== 'idle' || isScanning) && (
          <ScanProgressBar
            progress={scanProgress}
            onPause={() => window.ghostgramDesktop.scan.pause()}
            onResume={() => window.ghostgramDesktop.scan.resume()}
            onCancel={() => window.ghostgramDesktop.scan.cancel()}
          />
        )}

        {/* Barra de Progresso do Unfollow */}
        {unfollowProgress && (unfollowProgress.status !== 'idle' || isUnfollowing) && (
          <UnfollowProgressBar
            progress={unfollowProgress}
            onPause={() => window.ghostgramDesktop.unfollow.pause()}
            onResume={() => window.ghostgramDesktop.unfollow.resume()}
            onCancel={() => window.ghostgramDesktop.unfollow.cancel()}
          />
        )}

        {/* Tabela de Perfis */}
        {isAuthenticated && (
          <UserTable
            users={users}
            whitelist={whitelist}
            selectedIds={selectedIds}
            isUnfollowing={isUnfollowing}
            onToggleSelect={(id) => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            }}
            onSelectAllVisible={(ids) => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                ids.forEach((id) => next.add(id));
                return next;
              });
            }}
            onClearSelection={() => setSelectedIds(new Set())}
            onToggleWhitelist={handleToggleWhitelist}
            onUnfollowSingle={handleUnfollowSingle}
            onUnfollowBulk={handleUnfollowBulk}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
          />
        )}
      </main>

      {/* Modal de Confirmação de Unfollow */}
      {confirmUnfollowModal.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmUnfollowModal({ isOpen: false, targets: [] })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f43f5e' }}>
                ⚠️ Confirmar Ação de Deixar de Seguir
              </h2>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmUnfollowModal({ isOpen: false, targets: [] })}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: '#e2e8f0' }}>
                Você está prestes a deixar de seguir{' '}
                <strong style={{ color: '#f43f5e' }}>{confirmUnfollowModal.targets.length}</strong> conta(s) do Instagram.
              </p>
              <div
                style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  background: '#0b1120',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #1e293b',
                  fontSize: '13px',
                }}
              >
                {confirmUnfollowModal.targets.map((t) => (
                  <div key={t.id} style={{ color: '#94a3b8' }}>
                    @{t.username}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                🛡️ <strong>Proteção Anti-Bloqueio Ativa:</strong> As requisições terão intervalo aleatório de 4 a 8 segundos entre si, com pausa preventiva de 5 minutos a cada 5 perfis para proteger sua conta.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmUnfollowModal({ isOpen: false, targets: [] })}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={() => executeUnfollow(confirmUnfollowModal.targets)}
              >
                Confirmar e Iniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Suporte */}
      <WhitelistManagerModal
        isOpen={isWhitelistOpen}
        whitelist={whitelist}
        onClose={() => setIsWhitelistOpen(false)}
        onAdd={handleAddWhitelistByUsername}
        onRemove={handleRemoveWhitelist}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
};
