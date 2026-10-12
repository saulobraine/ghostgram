import React, { useState } from 'react';
import { DesktopAppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: DesktopAppSettings;
  onClose: () => void;
  onSave: (settings: Partial<DesktopAppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<DesktopAppSettings>({ ...settings });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ Configurações & Segurança Anti-Bloqueio
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                Intervalo Mínimo entre Unfollows (segundos)
              </label>
              <input
                type="number"
                min={2}
                max={30}
                className="input-text"
                value={form.unfollowDelayMin}
                onChange={(e) => setForm({ ...form, unfollowDelayMin: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: '#64748b' }}>Padrão: 4 segundos</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                Intervalo Máximo entre Unfollows (segundos)
              </label>
              <input
                type="number"
                min={4}
                max={60}
                className="input-text"
                value={form.unfollowDelayMax}
                onChange={(e) => setForm({ ...form, unfollowDelayMax: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: '#64748b' }}>Padrão: 8 segundos</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                Limite de Unfollows Consecutivos para Pausa
              </label>
              <input
                type="number"
                min={1}
                max={20}
                className="input-text"
                value={form.consecutiveUnfollowLimit}
                onChange={(e) => setForm({ ...form, consecutiveUnfollowLimit: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: '#64748b' }}>Padrão: 5 ações consecutivas antes de pausar</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                Tempo de Resfriamento da Pausa (segundos)
              </label>
              <input
                type="number"
                min={30}
                max={1800}
                step={30}
                className="input-text"
                value={form.cooldownSeconds}
                onChange={(e) => setForm({ ...form, cooldownSeconds: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: '#64748b' }}>Padrão: 300 segundos (5 minutos)</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
