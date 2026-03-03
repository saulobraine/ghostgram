// UnfollowProgressModal - Full-screen modal for unfollow progress
import { createElement } from '../utils/DOMRenderer.js';
import { getIconUrl } from './Logo.js';

interface UnfollowLogEntry {
  getUser(): {
    getUsername(): string;
    getProfilePicUrl(): string;
  };
  wasSuccessful(): boolean;
  wasFailure(): boolean;
}

interface UnfollowProgressModalOptions {
  onPause?: (() => void) | null;
  onResume?: (() => void) | null;
  onCancel?: (() => void) | null;
  onClose?: (() => void) | null;
  totalCount?: number;
  timeBetweenUnfollows?: number;
  timeAfterFive?: number;
}

interface ModalRefs {
  title?: HTMLElement;
  progressPct?: HTMLElement;
  barFill?: HTMLElement;
  statusLine?: HTMLElement;
  warning?: HTMLElement;
  list?: HTMLElement;
  pauseBtn?: HTMLButtonElement;
  cancelBtn?: HTMLButtonElement;
  closeBtn?: HTMLButtonElement;
}

/**
 * Modal overlay that shows unfollow progress with user list,
 * progress bar, pause/resume and cancel controls.
 */
export class UnfollowProgressModal {
  private _onPause: (() => void) | null;
  private _onResume: (() => void) | null;
  private _onCancel: (() => void) | null;
  private _onClose: (() => void) | null;
  private _overlay: HTMLElement | null;
  private _refs: ModalRefs;
  private _isPaused: boolean;
  private _isComplete: boolean;
  private _totalCount: number;
  private _timeBetweenUnfollows: number;
  private _timeAfterFive: number;
  private _startTime: number;

  constructor({ onPause, onResume, onCancel, onClose, totalCount, timeBetweenUnfollows, timeAfterFive }: UnfollowProgressModalOptions) {
    this._onPause = onPause || null;
    this._onResume = onResume || null;
    this._onCancel = onCancel || null;
    this._onClose = onClose || null;
    this._overlay = null;
    this._refs = {};
    this._isPaused = false;
    this._isComplete = false;
    this._totalCount = totalCount || 0;
    this._timeBetweenUnfollows = timeBetweenUnfollows || 4000;
    this._timeAfterFive = timeAfterFive || 300000;
    this._startTime = Date.now();
  }

  /**
   * Creates and appends the modal to document.body
   */
  show(): void {
    if (this._overlay) return;

    this._injectStyles();

    // Overlay
    this._overlay = createElement('div', { className: 'iu-unfollow-modal-overlay iu-modal-animate-in' }) as HTMLElement;

    // Modal card
    const modal = createElement('div', { className: 'iu-unfollow-modal iu-modal-card-animate-in' }) as HTMLElement;

    // Header
    const header = createElement('div', { className: 'iu-unfollow-modal-header' }) as HTMLElement;
    this._refs.title = createElement('h2', {}) as HTMLElement;
    const titleIcon = document.createElement('img');
    titleIcon.src = getIconUrl();
    titleIcon.alt = 'GhostGram';
    titleIcon.width = 22;
    titleIcon.height = 22;
    titleIcon.style.verticalAlign = 'middle';
    titleIcon.style.marginRight = '6px';
    this._refs.title.appendChild(titleIcon);
    this._refs.title.appendChild(document.createTextNode('Deixando de seguir...'));
    this._refs.progressPct = createElement('span', { className: 'iu-unfollow-modal-pct' }, '0%') as HTMLElement;
    header.appendChild(this._refs.title);
    header.appendChild(this._refs.progressPct);
    modal.appendChild(header);

    // Progress bar
    const barContainer = createElement('div', { className: 'iu-unfollow-modal-bar' }) as HTMLElement;
    this._refs.barFill = createElement('div', { className: 'iu-unfollow-modal-bar-fill' }) as HTMLElement;
    barContainer.appendChild(this._refs.barFill);
    modal.appendChild(barContainer);

    // Status line: count + estimate
    this._refs.statusLine = createElement('p', { className: 'iu-unfollow-modal-status-line' },
      this._buildStatusText(0)) as HTMLElement;
    modal.appendChild(this._refs.statusLine);

    // Warning
    this._refs.warning = createElement('p', { className: 'iu-unfollow-modal-warning' },
      '⚠️ Não feche esta janela até o processo finalizar') as HTMLElement;
    modal.appendChild(this._refs.warning);

    // Scrollable user list
    this._refs.list = createElement('div', { className: 'iu-unfollow-modal-list' }) as HTMLElement;
    modal.appendChild(this._refs.list);

    // Footer with buttons
    const footer = createElement('div', { className: 'iu-unfollow-modal-footer' }) as HTMLElement;

    this._refs.pauseBtn = createElement('button', {
      className: 'iu-unfollow-modal-btn iu-unfollow-modal-btn-pause',
      onClick: () => this._handlePauseToggle()
    }, '⏸ Pausar') as HTMLButtonElement;
    footer.appendChild(this._refs.pauseBtn);

    this._refs.cancelBtn = createElement('button', {
      className: 'iu-unfollow-modal-btn iu-unfollow-modal-btn-cancel',
      onClick: () => {
        if (this._onCancel) this._onCancel();
      }
    }, '✖ Cancelar') as HTMLButtonElement;
    footer.appendChild(this._refs.cancelBtn);

    this._refs.closeBtn = createElement('button', {
      className: 'iu-unfollow-modal-btn iu-unfollow-modal-btn-close',
      style: { display: 'none' },
      onClick: () => this.destroy()
    }, '✔ Fechar') as HTMLButtonElement;
    footer.appendChild(this._refs.closeBtn);

    modal.appendChild(footer);
    this._overlay.appendChild(modal);
    document.body.appendChild(this._overlay);
  }

  private _injectStyles(): void {
    if (document.getElementById('iu-modal-anim-styles')) return;
    const style = document.createElement('style');
    style.id = 'iu-modal-anim-styles';
    style.textContent = `
      @keyframes iu-overlay-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes iu-overlay-out { from { opacity: 1; } to { opacity: 0; } }
      @keyframes iu-card-in { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes iu-card-out { from { opacity: 1; transform: scale(1) translateY(0); } to { opacity: 0; transform: scale(0.9) translateY(20px); } }
      @keyframes iu-item-slide { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
      .iu-modal-animate-in { animation: iu-overlay-in 0.3s ease-out both; }
      .iu-modal-animate-out { animation: iu-overlay-out 0.25s ease-in both; }
      .iu-modal-card-animate-in { animation: iu-card-in 0.35s ease-out both; }
      .iu-modal-card-animate-out { animation: iu-card-out 0.25s ease-in both; }
      .iu-unfollow-modal-item { animation: iu-item-slide 0.3s ease-out both; }
      .iu-unfollow-modal-status-line {
        font-size: 12px !important;
        color: #a1a1aa !important;
        text-align: center !important;
        margin: 8px 0 4px !important;
        font-family: 'Noto Sans', system-ui, sans-serif !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Calcula estimativa de tempo restante
   */
  private _estimateRemaining(doneCount: number): string {
    const remaining = this._totalCount - doneCount;
    if (remaining <= 0) return '';

    // Tempo médio por unfollow considerando pausas após cada 5
    const fullCycles = Math.floor(remaining / 5);
    const totalMs = (remaining * this._timeBetweenUnfollows) + (fullCycles * this._timeAfterFive);

    if (totalMs < 60000) {
      return `~${Math.ceil(totalMs / 1000)}s`;
    }
    if (totalMs < 3600000) {
      const mins = Math.ceil(totalMs / 60000);
      return `~${mins}min`;
    }
    const finishTime = new Date(Date.now() + totalMs);
    return `até ${finishTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  private _buildStatusText(doneCount: number): string {
    const remaining = this._totalCount - doneCount;
    const estimate = this._estimateRemaining(doneCount);
    let text = `Faltam ${remaining} de ${this._totalCount}`;
    if (estimate) text += ` · Previsão: ${estimate}`;
    return text;
  }

  /**
   * Updates the modal with new progress data
   */
  update(percentage: number, log: UnfollowLogEntry[]): void {
    if (!this._overlay) return;

    (this._refs.barFill as HTMLElement).style.width = `${percentage}%`;
    this._refs.progressPct!.textContent = `${percentage}%`;

    // Update status line
    if (this._refs.statusLine) {
      this._refs.statusLine.textContent = this._buildStatusText(log.length);
    }

    // Update list — append only new entries
    const currentCount = this._refs.list!.children.length;
    for (let i = currentCount; i < log.length; i++) {
      const entry = log[i];
      const user = entry.getUser();
      const success = entry.wasSuccessful();
      const icon = success ? '✅' : '❌';
      const item = createElement('div', {
        className: `iu-unfollow-modal-item ${success ? 'iu-success' : 'iu-error'}`,
        style: { animationDelay: `${(i - currentCount) * 0.05}s` }
      }) as HTMLElement;

      const img = createElement('img', {
        className: 'iu-unfollow-modal-avatar',
        src: user.getProfilePicUrl() || '',
        alt: user.getUsername()
      }) as HTMLElement;
      item.appendChild(img);

      const name = createElement('span', { className: 'iu-unfollow-modal-username' },
        `@${user.getUsername()}`) as HTMLElement;
      item.appendChild(name);

      const status = createElement('span', { className: 'iu-unfollow-modal-status' }, icon) as HTMLElement;
      item.appendChild(status);

      this._refs.list!.appendChild(item);
      // Auto-scroll to bottom
      this._refs.list!.scrollTop = this._refs.list!.scrollHeight;
    }
  }

  /**
   * Marks the process as complete and shows summary
   */
  complete(log: UnfollowLogEntry[]): void {
    if (!this._overlay) return;
    this._isComplete = true;

    const successes = log.filter(e => e.wasSuccessful()).length;
    const failures = log.filter(e => e.wasFailure()).length;
    const elapsed = Math.round((Date.now() - this._startTime) / 1000);
    const elapsedText = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}min ${elapsed % 60}s`;

    this._refs.title!.innerHTML = '';
    const doneIcon = document.createElement('img');
    doneIcon.src = getIconUrl();
    doneIcon.alt = 'GhostGram';
    doneIcon.width = 22;
    doneIcon.height = 22;
    doneIcon.style.verticalAlign = 'middle';
    doneIcon.style.marginRight = '6px';
    this._refs.title!.appendChild(doneIcon);
    this._refs.title!.appendChild(document.createTextNode('Concluído!'));
    this._refs.progressPct!.textContent = '100%';
    (this._refs.barFill as HTMLElement).style.width = '100%';
    this._refs.statusLine!.textContent = `Finalizado em ${elapsedText}`;
    this._refs.warning!.textContent = `✅ ${successes} removidos com sucesso` +
      (failures > 0 ? ` · ❌ ${failures} com erro` : '');
    this._refs.warning!.classList.add('iu-unfollow-modal-summary');

    // Hide pause/cancel, show close
    this._refs.pauseBtn!.style.display = 'none';
    this._refs.cancelBtn!.style.display = 'none';
    this._refs.closeBtn!.style.display = '';
  }

  /**
   * Removes the modal from DOM with exit animation
   */
  destroy(): void {
    if (!this._overlay) return;

    const overlay = this._overlay;
    const modal = overlay.querySelector('.iu-unfollow-modal');
    overlay.classList.remove('iu-modal-animate-in');
    overlay.classList.add('iu-modal-animate-out');
    if (modal) {
      modal.classList.remove('iu-modal-card-animate-in');
      modal.classList.add('iu-modal-card-animate-out');
    }

    setTimeout(() => {
      overlay.remove();
      if (this._overlay === overlay) {
        this._overlay = null;
        this._refs = {};
        if (this._onClose) this._onClose();
      }
    }, 260);
  }

  private _handlePauseToggle(): void {
    if (this._isComplete) return;

    this._isPaused = !this._isPaused;
    if (this._isPaused) {
      this._refs.pauseBtn!.textContent = '▶ Retomar';
      if (this._onPause) this._onPause();
    } else {
      this._refs.pauseBtn!.textContent = '⏸ Pausar';
      if (this._onResume) this._onResume();
    }
  }
}
