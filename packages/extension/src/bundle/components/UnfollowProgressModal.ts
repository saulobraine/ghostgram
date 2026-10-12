// UnfollowProgressModal - Full-screen modal for unfollow progress
import { createElement } from '../utils/DOMRenderer.js';
import { getIconUrl } from './Logo.js';
import type { UnfollowProgressUiState } from '../services/UnfollowService.js';

interface UnfollowLogEntry {
  getUser(): {
    getUsername(): string;
    getProfilePicUrl(): string;
  };
  wasSuccessful(): boolean;
  wasFailure(): boolean;
  getErrorMessage?(): string | null;
}

interface UnfollowProgressModalOptions {
  onPause?: (() => void) | null;
  onResume?: (() => void) | null;
  onCancel?: (() => void) | null;
  onClose?: (() => void) | null;
  onMinimize?: (() => void) | null;
  onMaximize?: (() => void) | null;
  totalCount?: number;
  timeBetweenUnfollows?: number;
  timeAfterFive?: number;
  unfollowsPerCycle?: number;
}

interface ModalRefs {
  modal?: HTMLElement;
  title?: HTMLElement;
  progressPct?: HTMLElement;
  barFill?: HTMLElement;
  statusLine?: HTMLElement;
  warning?: HTMLElement;
  listContainer?: HTMLElement;
  pauseState?: HTMLElement;
  pauseCountdown?: HTMLElement;
  pauseReason?: HTMLElement;
  list?: HTMLElement;
  pauseBtn?: HTMLButtonElement;
  cancelBtn?: HTMLButtonElement;
  closeBtn?: HTMLButtonElement;
  minimizeBtn?: HTMLButtonElement;
  miniWidget?: HTMLElement;
  miniBarFill?: HTMLElement;
  miniPct?: HTMLElement;
  miniCount?: HTMLElement;
  miniStatus?: HTMLElement;
  miniPauseBtn?: HTMLButtonElement;
  miniMaximizeBtn?: HTMLButtonElement;
  miniPauseReason?: HTMLElement;
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
  private _onMinimize: (() => void) | null;
  private _onMaximize: (() => void) | null;
  private _overlay: HTMLElement | null;
  private _refs: ModalRefs;
  private _isPaused: boolean;
  private _isComplete: boolean;
  private _isMinimized: boolean;
  private _isTransitioning: boolean;
  private _transitionTimeout: number | null;
  private _totalCount: number;
  private _timeBetweenUnfollows: number;
  private _timeAfterFive: number;
  private _unfollowsPerCycle: number;
  private _startTime: number;
  private _currentPercentage: number;
  private _currentDoneCount: number;
  private _currentUiState?: UnfollowProgressUiState;

  constructor({ onPause, onResume, onCancel, onClose, onMinimize, onMaximize, totalCount, timeBetweenUnfollows, timeAfterFive, unfollowsPerCycle }: UnfollowProgressModalOptions) {
    this._onPause = onPause || null;
    this._onResume = onResume || null;
    this._onCancel = onCancel || null;
    this._onClose = onClose || null;
    this._onMinimize = onMinimize || null;
    this._onMaximize = onMaximize || null;
    this._overlay = null;
    this._refs = {};
    this._isPaused = false;
    this._isComplete = false;
    this._isMinimized = false;
    this._isTransitioning = false;
    this._transitionTimeout = null;
    this._totalCount = totalCount || 0;
    this._timeBetweenUnfollows = timeBetweenUnfollows || 4000;
    this._timeAfterFive = timeAfterFive || 300000;
    this._unfollowsPerCycle = unfollowsPerCycle || 5;
    this._startTime = Date.now();
    this._currentPercentage = 0;
    this._currentDoneCount = 0;
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
    this._refs.modal = modal;

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

    const headerActions = createElement('div', { className: 'iu-unfollow-modal-header-actions' }) as HTMLElement;
    this._refs.progressPct = createElement('span', { className: 'iu-unfollow-modal-pct' }, '0%') as HTMLElement;
    this._refs.minimizeBtn = createElement('button', {
      className: 'iu-unfollow-modal-btn-minimize',
      title: 'Minimizar',
      'aria-label': 'Minimizar',
      onClick: () => this.minimize()
    }, '🗕') as HTMLButtonElement;

    headerActions.appendChild(this._refs.progressPct);
    headerActions.appendChild(this._refs.minimizeBtn);

    header.appendChild(this._refs.title);
    header.appendChild(headerActions);
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

    const listContainer = createElement('div', { className: 'iu-unfollow-modal-list-container' }) as HTMLElement;
    this._refs.listContainer = listContainer;

    // Scrollable user list
    this._refs.list = createElement('div', { className: 'iu-unfollow-modal-list' }) as HTMLElement;
    listContainer.appendChild(this._refs.list);
    modal.appendChild(listContainer);

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
      @keyframes iu-mini-in { from { opacity: 0.6; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      @keyframes iu-modal-morph-to-mini {
        0% {
          transform: translate(0, 0);
          width: 90vw;
          max-width: 480px;
          max-height: 80vh;
          border-radius: 16px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
          opacity: 1;
        }
        35% {
          max-height: 85px;
          width: var(--target-width, 320px);
          border-radius: 12px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55);
        }
        90% {
          opacity: 0.85;
        }
        100% {
          transform: translate(var(--morph-x, calc(50vw - 184px)), var(--morph-y, calc(54px - 50vh)));
          width: var(--target-width, 320px);
          max-height: var(--target-height, 62px);
          border-radius: 12px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
          opacity: 0;
        }
      }
      @keyframes iu-modal-morph-from-mini {
        0% {
          transform: translate(var(--morph-x, calc(50vw - 184px)), var(--morph-y, calc(54px - 50vh)));
          width: var(--target-width, 320px);
          max-height: var(--target-height, 62px);
          border-radius: 12px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
          opacity: 0.95;
        }
        60% {
          transform: translate(0, 0);
          width: 90vw;
          max-width: 480px;
          border-radius: 16px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
          opacity: 1;
        }
        100% {
          transform: translate(0, 0);
          width: 90vw;
          max-width: 480px;
          max-height: 80vh;
          border-radius: 16px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
          opacity: 1;
        }
      }
      .iu-modal-animate-in { animation: iu-overlay-in 0.3s ease-out both; }
      .iu-modal-animate-out { animation: iu-overlay-out 0.25s ease-in both; }
      .iu-modal-card-animate-in { animation: iu-card-in 0.35s ease-out both; }
      .iu-modal-card-animate-out { animation: iu-card-out 0.25s ease-in both; }
      .iu-mini-animate-in { animation: iu-mini-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .iu-unfollow-modal-overlay.iu-hidden,
      .iu-unfollow-modal-overlay[style*="display: none"],
      .iu-unfollow-modal-overlay[style*="display:none"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      .iu-unfollow-modal.iu-hidden {
        display: none !important;
        visibility: hidden !important;
      }
      .iu-overlay-minimizing {
        background: rgba(0, 0, 0, 0) !important;
        backdrop-filter: blur(0px) !important;
        -webkit-backdrop-filter: blur(0px) !important;
        pointer-events: none !important;
        transition: background 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                    backdrop-filter 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                    -webkit-backdrop-filter 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .iu-overlay-maximizing {
        animation: iu-overlay-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) both !important;
      }
      .iu-modal-morph-to-mini {
        animation: iu-modal-morph-to-mini 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        pointer-events: none !important;
        overflow: hidden !important;
        transform-origin: center center !important;
      }
      .iu-modal-morph-to-mini .iu-unfollow-modal-list-container,
      .iu-modal-morph-to-mini .iu-unfollow-modal-warning,
      .iu-modal-morph-to-mini .iu-unfollow-modal-footer,
      .iu-modal-morph-to-mini .iu-unfollow-modal-status-line,
      .iu-modal-morph-to-mini .iu-unfollow-modal-pause-state {
        opacity: 0 !important;
        max-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        pointer-events: none !important;
        transition: opacity 0.12s ease-out, max-height 0.24s cubic-bezier(0.16, 1, 0.3, 1), margin 0.2s ease, padding 0.2s ease !important;
      }
      .iu-modal-morph-to-mini .iu-unfollow-modal-header {
        padding: 10px 14px 4px !important;
        transition: padding 0.24s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .iu-modal-morph-to-mini .iu-unfollow-modal-header h2 {
        font-size: 12px !important;
        transition: font-size 0.2s ease !important;
      }
      .iu-modal-morph-to-mini .iu-unfollow-modal-pct {
        font-size: 12px !important;
        transition: font-size 0.2s ease !important;
      }
      .iu-modal-morph-to-mini .iu-unfollow-modal-bar {
        margin: 4px 14px 10px !important;
        height: 4px !important;
        transition: margin 0.24s cubic-bezier(0.16, 1, 0.3, 1), height 0.24s ease !important;
      }
      .iu-modal-morph-from-mini {
        animation: iu-modal-morph-from-mini 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        overflow: hidden !important;
        transform-origin: center center !important;
      }
      .iu-modal-morph-from-mini .iu-unfollow-modal-list-container,
      .iu-modal-morph-from-mini .iu-unfollow-modal-warning,
      .iu-modal-morph-from-mini .iu-unfollow-modal-footer,
      .iu-modal-morph-from-mini .iu-unfollow-modal-status-line,
      .iu-modal-morph-from-mini .iu-unfollow-modal-pause-state {
        animation: iu-overlay-in 0.25s 0.12s ease-out both !important;
      }
      .iu-unfollow-modal-item { animation: iu-item-slide 0.3s ease-out both; }
      .iu-unfollow-modal-list-container {
        position: relative !important;
        flex: 1 1 auto !important;
        min-height: 100px !important;
        max-height: 45vh !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
      }
      .iu-unfollow-modal-pause-state {
        position: absolute !important;
        inset: 0 20px 10px !important;
        z-index: 10 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 16px 18px !important;
        border-radius: 12px !important;
        background: rgba(17, 17, 17, 0.92) !important;
        border: 1px solid rgba(252, 175, 69, 0.28) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
        text-align: center !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
      }
      .iu-unfollow-modal-list {
        flex: 1 1 auto !important;
        min-height: 0 !important;
        max-height: 100% !important;
        height: 100% !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        box-sizing: border-box !important;
        padding: 0 20px 10px !important;
        overscroll-behavior: contain !important;
        scrollbar-width: thin !important;
        scrollbar-color: #3f3f46 transparent !important;
      }
      .iu-unfollow-modal-list::-webkit-scrollbar {
        width: 6px !important;
      }
      .iu-unfollow-modal-list::-webkit-scrollbar-track {
        background: transparent !important;
      }
      .iu-unfollow-modal-list::-webkit-scrollbar-thumb {
        background: #3f3f46 !important;
        border-radius: 3px !important;
      }
      .iu-unfollow-modal-list::-webkit-scrollbar-thumb:hover {
        background: #52525b !important;
      }
      .iu-unfollow-modal-footer {
        display: flex !important;
        gap: 10px !important;
        padding: 12px 20px 16px !important;
        justify-content: center !important;
        flex-shrink: 0 !important;
        background: #111 !important;
        position: relative !important;
        z-index: 5 !important;
        border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
      }
      .iu-unfollow-modal-header,
      .iu-unfollow-modal-bar,
      .iu-unfollow-modal-status-line,
      .iu-unfollow-modal-warning {
        flex-shrink: 0 !important;
      }
      .iu-unfollow-modal-header-actions {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
      }
      .iu-unfollow-modal-btn-minimize {
        background: transparent !important;
        border: none !important;
        color: #a1a1aa !important;
        font-size: 15px !important;
        cursor: pointer !important;
        padding: 4px 6px !important;
        border-radius: 6px !important;
        line-height: 1 !important;
        transition: color 0.15s ease, background 0.15s ease !important;
      }
      .iu-unfollow-modal-btn-minimize:hover {
        color: #f4f4f5 !important;
        background: #27272a !important;
      }
      .iu-unfollow-mini-widget {
        position: fixed !important;
        top: 24px !important;
        right: 24px !important;
        z-index: auto !important;
        width: 320px !important;
        background: #111111 !important;
        border: 1px solid #27272a !important;
        border-radius: 12px !important;
        padding: 10px 14px !important;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6) !important;
        font-family: 'Noto Sans', system-ui, sans-serif !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
        cursor: pointer !important;
        transition: transform 0.15s ease, border-color 0.15s ease !important;
      }
      .iu-unfollow-mini-widget:hover {
        border-color: #3f3f46 !important;
        transform: translateY(-2px) !important;
      }
      .iu-unfollow-mini-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
      }
      .iu-unfollow-mini-info {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        overflow: hidden !important;
      }
      .iu-unfollow-mini-title {
        font-size: 12px !important;
        font-weight: 600 !important;
        color: #f4f4f5 !important;
        white-space: nowrap !important;
      }
      .iu-unfollow-mini-pct {
        font-size: 12px !important;
        font-weight: 700 !important;
        background: linear-gradient(135deg, #833ab4, #e1306c, #fcaf45) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
      }
      .iu-unfollow-mini-count {
        font-size: 11px !important;
        color: #a1a1aa !important;
      }
      .iu-unfollow-mini-actions {
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
      }
      .iu-unfollow-mini-btn {
        background: #27272a !important;
        color: #f4f4f5 !important;
        border: none !important;
        border-radius: 6px !important;
        padding: 4px 8px !important;
        font-size: 12px !important;
        cursor: pointer !important;
        line-height: 1 !important;
        transition: opacity 0.15s ease, background 0.15s ease !important;
      }
      .iu-unfollow-mini-btn:hover {
        opacity: 0.85 !important;
        background: #3f3f46 !important;
      }
      .iu-unfollow-mini-bar {
        height: 4px !important;
        background: #1a1a1a !important;
        border-radius: 2px !important;
        overflow: hidden !important;
      }
      .iu-unfollow-mini-bar-fill {
        height: 100% !important;
        border-radius: 2px !important;
        background: linear-gradient(90deg, #833ab4, #e1306c, #fcaf45) !important;
        transition: width 0.3s ease !important;
      }
      .iu-unfollow-mini-pause-reason {
        font-size: 11px !important;
        color: #fcaf45 !important;
        text-align: center !important;
      }
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

  private _getRemainingCycles(remaining: number): number {
    if (remaining <= 0) {
      return 0;
    }

    return Math.ceil(remaining / this._unfollowsPerCycle);
  }

  /**
   * Calcula estimativa de tempo restante
   */
  private _estimateRemaining(doneCount: number, uiState?: UnfollowProgressUiState): string {
    const remaining = this._totalCount - doneCount;
    if (remaining <= 0) return '';

    const remainingCycles = this._getRemainingCycles(remaining);
    const scheduledPauseCount = Math.max(remainingCycles - 1, 0);
    const currentCyclePauseMs = uiState?.state === 'cycle_pause'
      ? uiState.remainingMs ?? this._timeAfterFive
      : 0;
    const futurePauseCount = Math.max(scheduledPauseCount - (uiState?.state === 'cycle_pause' ? 1 : 0), 0);
    const unfollowRequestOverheadMs = remaining * 1000;
    const totalMs =
      (remaining * this._timeBetweenUnfollows) +
      unfollowRequestOverheadMs +
      currentCyclePauseMs +
      (futurePauseCount * this._timeAfterFive);

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

  private _buildStatusText(doneCount: number, uiState?: UnfollowProgressUiState): string {
    const remaining = this._totalCount - doneCount;
    const remainingCycles = this._getRemainingCycles(remaining);
    const estimate = this._estimateRemaining(doneCount, uiState);
    let text = `Faltam ${remaining} de ${this._totalCount}`;
    if (remainingCycles > 0) {
      text += ` · ${remainingCycles} ${remainingCycles === 1 ? 'ciclo' : 'ciclos'}`;
    }
    if (estimate) text += ` · Previsão: ${estimate}`;
    return text;
  }

  private _formatCountdown(remainingMs: number | null): string {
    if (remainingMs === null) {
      return '--:--';
    }

    const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private _removePauseState(): void {
    if (this._refs.pauseState) {
      this._refs.pauseState.remove();
    }
    this._refs.pauseState = undefined;
    this._refs.pauseCountdown = undefined;
    this._refs.pauseReason = undefined;
  }

  private _ensurePauseState(): void {
    if (!this._refs.listContainer || this._refs.pauseState) {
      return;
    }

    const pauseState = createElement('div', {
      className: 'iu-unfollow-modal-pause-state'
    }) as HTMLElement;
    this._refs.pauseState = pauseState;
    this._refs.pauseCountdown = createElement('div', { className: 'iu-unfollow-modal-pause-countdown' }) as HTMLElement;
    this._refs.pauseReason = createElement('p', { className: 'iu-unfollow-modal-pause-reason' }) as HTMLElement;
    pauseState.appendChild(this._refs.pauseCountdown);
    pauseState.appendChild(this._refs.pauseReason);
    this._refs.listContainer.appendChild(pauseState);
  }

  private _renderPauseState(uiState?: UnfollowProgressUiState): void {
    if (!this._overlay) {
      return;
    }

    if (!uiState || uiState.state === 'running' || uiState.state === 'cooldown') {
      this._overlay.classList.remove('iu-unfollow-modal-overlay-paused');
      this._removePauseState();
      return;
    }

    this._ensurePauseState();
    if (!this._refs.pauseState || !this._refs.pauseCountdown || !this._refs.pauseReason) {
      return;
    }

    this._overlay.classList.add('iu-unfollow-modal-overlay-paused');
    this._refs.pauseCountdown.textContent = `Retomando em ${this._formatCountdown(uiState.remainingMs)}`;
    this._refs.pauseReason.textContent = uiState.reason || 'Pausa automática do ciclo em andamento.';
  }

  /**
   * Minimiza o modal para um mini-widget flutuante compacto com animação de morph
   */
  minimize(animated: boolean = true, forceAnimation: boolean = false): void {
    if (this._isMinimized || !this._overlay || this._isTransitioning) return;

    this._isMinimized = true;
    document.body.style.overflow = '';
    const modal = (this._refs.modal || this._overlay.querySelector('.iu-unfollow-modal')) as HTMLElement | null;

    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if ((!animated || isTest) && !forceAnimation) {
      this._overlay.style.setProperty('display', 'none', 'important');
      this._overlay.style.display = 'none';
      this._overlay.classList.add('iu-hidden');
      if (modal) {
        modal.classList.add('iu-hidden');
      }
      this._createMiniWidget();
      if (this._onMinimize) {
        this._onMinimize();
      }
      return;
    }

    this._isTransitioning = true;

    if (modal) {
      const modalRect = modal.getBoundingClientRect();
      const targetRight = 24;
      const targetTop = 24;
      const targetWidth = 320;
      const isPaused = this._currentUiState?.state === 'cycle_pause';
      const targetHeight = isPaused ? 78 : 58;

      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1024;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 768;

      const targetCenterX = viewportWidth - targetRight - targetWidth / 2;
      const targetCenterY = targetTop + targetHeight / 2;

      const modalWidth = modalRect.width || 480;
      const modalHeight = modalRect.height || 360;
      const currentCenterX = modalRect.width ? (modalRect.left + modalWidth / 2) : (viewportWidth / 2);
      const currentCenterY = modalRect.height ? (modalRect.top + modalHeight / 2) : (viewportHeight / 2);

      const deltaX = targetCenterX - currentCenterX;
      const deltaY = targetCenterY - currentCenterY;

      modal.style.setProperty('--morph-x', `${Math.round(deltaX)}px`);
      modal.style.setProperty('--morph-y', `${Math.round(deltaY)}px`);
      modal.style.setProperty('--target-width', `${targetWidth}px`);
      modal.style.setProperty('--target-height', `${targetHeight}px`);

      this._overlay.classList.remove('iu-overlay-maximizing');
      this._overlay.classList.add('iu-overlay-minimizing');
      modal.classList.remove('iu-modal-morph-from-mini');
      modal.classList.add('iu-modal-morph-to-mini');
    }

    if (this._transitionTimeout) {
      clearTimeout(this._transitionTimeout);
    }

    this._transitionTimeout = window.setTimeout(() => {
      this._isTransitioning = false;
      this._transitionTimeout = null;

      if (!this._isMinimized || !this._overlay) return;

      this._overlay.style.setProperty('display', 'none', 'important');
      this._overlay.style.display = 'none';
      this._overlay.classList.add('iu-hidden');
      this._overlay.classList.remove('iu-overlay-minimizing');
      if (modal) {
        modal.classList.add('iu-hidden');
        modal.classList.remove('iu-modal-morph-to-mini');
      }

      this._createMiniWidget();

      if (this._onMinimize) {
        this._onMinimize();
      }
    }, 280);
  }

  /**
   * Restaura o modal a partir do estado minimizado com animação de expansão
   */
  maximize(animated: boolean = true, forceAnimation: boolean = false): void {
    if (!this._isMinimized || !this._overlay || this._isTransitioning) return;

    this._isMinimized = false;
    document.body.style.overflow = 'hidden';

    const modal = (this._refs.modal || this._overlay.querySelector('.iu-unfollow-modal')) as HTMLElement | null;

    if (modal) {
      modal.classList.remove('iu-hidden');
      modal.style.removeProperty('display');
    }
    this._overlay.classList.remove('iu-hidden');
    this._overlay.style.removeProperty('display');
    this._overlay.style.display = '';

    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if ((!animated || isTest) && !forceAnimation) {
      this._removeMiniWidget();
      if (this._onMaximize) {
        this._onMaximize();
      }
      return;
    }

    this._isTransitioning = true;

    if (modal) {
      const targetRight = 24;
      const targetTop = 24;
      const targetWidth = 320;
      const isPaused = this._currentUiState?.state === 'cycle_pause';
      const targetHeight = isPaused ? 78 : 58;

      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1024;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 768;

      const targetCenterX = viewportWidth - targetRight - targetWidth / 2;
      const targetCenterY = targetTop + targetHeight / 2;

      const modalRect = modal.getBoundingClientRect();
      const modalWidth = modalRect.width || 480;
      const modalHeight = modalRect.height || 360;
      const currentCenterX = modalRect.width ? (modalRect.left + modalWidth / 2) : (viewportWidth / 2);
      const currentCenterY = modalRect.height ? (modalRect.top + modalHeight / 2) : (viewportHeight / 2);

      const deltaX = targetCenterX - currentCenterX;
      const deltaY = targetCenterY - currentCenterY;

      modal.style.setProperty('--morph-x', `${Math.round(deltaX)}px`);
      modal.style.setProperty('--morph-y', `${Math.round(deltaY)}px`);
      modal.style.setProperty('--target-width', `${targetWidth}px`);
      modal.style.setProperty('--target-height', `${targetHeight}px`);

      this._overlay.classList.remove('iu-overlay-minimizing');
      this._overlay.classList.add('iu-overlay-maximizing');
      modal.classList.remove('iu-modal-morph-to-mini');
      modal.classList.add('iu-modal-morph-from-mini');
    }

    this._removeMiniWidget();

    if (this._transitionTimeout) {
      clearTimeout(this._transitionTimeout);
    }

    this._transitionTimeout = window.setTimeout(() => {
      this._isTransitioning = false;
      this._transitionTimeout = null;

      if (this._isMinimized || !this._overlay) return;

      this._overlay.classList.remove('iu-overlay-maximizing');
      if (modal) {
        modal.classList.remove('iu-modal-morph-from-mini');
      }

      if (this._onMaximize) {
        this._onMaximize();
      }
    }, 300);
  }

  isMinimized(): boolean {
    return this._isMinimized;
  }

  private _createMiniWidget(): void {
    if (this._refs.miniWidget) return;

    const widget = createElement('div', { className: 'iu-unfollow-mini-widget iu-mini-animate-in' }) as HTMLElement;

    // Header / Top row
    const header = createElement('div', { className: 'iu-unfollow-mini-header' }) as HTMLElement;
    const info = createElement('div', { className: 'iu-unfollow-mini-info' }) as HTMLElement;

    const icon = document.createElement('img');
    icon.src = getIconUrl();
    icon.alt = 'GhostGram';
    icon.width = 18;
    icon.height = 18;
    icon.style.verticalAlign = 'middle';
    icon.style.flexShrink = '0';
    info.appendChild(icon);

    this._refs.miniStatus = createElement('span', { className: 'iu-unfollow-mini-title' },
      this._isPaused ? 'Pausado' : 'Deixando de seguir...') as HTMLElement;
    info.appendChild(this._refs.miniStatus);

    this._refs.miniPct = createElement('span', { className: 'iu-unfollow-mini-pct' },
      `${this._currentPercentage}%`) as HTMLElement;
    info.appendChild(this._refs.miniPct);

    this._refs.miniCount = createElement('span', { className: 'iu-unfollow-mini-count' },
      `(${this._currentDoneCount}/${this._totalCount})`) as HTMLElement;
    info.appendChild(this._refs.miniCount);

    header.appendChild(info);

    // Actions
    const actions = createElement('div', { className: 'iu-unfollow-mini-actions' }) as HTMLElement;

    this._refs.miniPauseBtn = createElement('button', {
      className: 'iu-unfollow-mini-btn iu-unfollow-mini-btn-pause',
      title: this._isPaused ? 'Retomar' : 'Pausar',
      'aria-label': this._isPaused ? 'Retomar' : 'Pausar',
      onClick: (e: Event) => {
        e.stopPropagation();
        this._handlePauseToggle();
      }
    }, this._isPaused ? '▶' : '⏸') as HTMLButtonElement;
    actions.appendChild(this._refs.miniPauseBtn);

    this._refs.miniMaximizeBtn = createElement('button', {
      className: 'iu-unfollow-mini-btn iu-unfollow-mini-btn-maximize',
      title: 'Expandir',
      'aria-label': 'Expandir modal',
      onClick: (e: Event) => {
        e.stopPropagation();
        this.maximize();
      }
    }, '🗖') as HTMLButtonElement;
    actions.appendChild(this._refs.miniMaximizeBtn);

    header.appendChild(actions);
    widget.appendChild(header);

    // Mini progress bar
    const bar = createElement('div', { className: 'iu-unfollow-mini-bar' }) as HTMLElement;
    this._refs.miniBarFill = createElement('div', {
      className: 'iu-unfollow-mini-bar-fill',
      style: { width: `${this._currentPercentage}%` }
    }) as HTMLElement;
    bar.appendChild(this._refs.miniBarFill);
    widget.appendChild(bar);

    // Pause reason / countdown if paused
    if (this._currentUiState?.state === 'cycle_pause') {
      this._refs.miniPauseReason = createElement('div', { className: 'iu-unfollow-mini-pause-reason' },
        `Retomando em ${this._formatCountdown(this._currentUiState.remainingMs)}`) as HTMLElement;
      widget.appendChild(this._refs.miniPauseReason);
    }

    // Permite clicar no próprio widget para maximizar também
    widget.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() !== 'button') {
        this.maximize();
      }
    });

    this._refs.miniWidget = widget;
    document.body.appendChild(widget);
  }

  private _removeMiniWidget(): void {
    if (this._refs.miniWidget) {
      this._refs.miniWidget.remove();
      this._refs.miniWidget = undefined;
      this._refs.miniBarFill = undefined;
      this._refs.miniPct = undefined;
      this._refs.miniCount = undefined;
      this._refs.miniStatus = undefined;
      this._refs.miniPauseBtn = undefined;
      this._refs.miniMaximizeBtn = undefined;
      this._refs.miniPauseReason = undefined;
    }
  }

  private _syncPauseButtonState(): void {
    if (this._refs.pauseBtn) {
      this._refs.pauseBtn.textContent = this._isPaused ? '▶ Retomar' : '⏸ Pausar';
    }
    if (this._refs.miniPauseBtn) {
      this._refs.miniPauseBtn.textContent = this._isPaused ? '▶' : '⏸';
      this._refs.miniPauseBtn.title = this._isPaused ? 'Retomar' : 'Pausar';
    }
    if (this._refs.miniStatus) {
      this._refs.miniStatus.textContent = this._isPaused ? 'Pausado' : 'Deixando de seguir...';
    }
  }

  /**
   * Updates the modal with new progress data
   */
  update(percentage: number, log: UnfollowLogEntry[], uiState?: UnfollowProgressUiState): void {
    if (!this._overlay) return;

    this._currentPercentage = percentage;
    this._currentDoneCount = log.length;
    this._currentUiState = uiState;

    (this._refs.barFill as HTMLElement).style.width = `${percentage}%`;
    this._refs.progressPct!.textContent = `${percentage}%`;

    if (this._refs.statusLine) {
      this._refs.statusLine.textContent = this._buildStatusText(log.length, uiState);
    }

    this._renderPauseState(uiState);

    // Update mini widget if open
    if (this._refs.miniWidget) {
      if (this._refs.miniBarFill) {
        this._refs.miniBarFill.style.width = `${percentage}%`;
      }
      if (this._refs.miniPct) {
        this._refs.miniPct.textContent = `${percentage}%`;
      }
      if (this._refs.miniCount) {
        this._refs.miniCount.textContent = `(${log.length}/${this._totalCount})`;
      }
      if (uiState?.state === 'cycle_pause') {
        if (!this._refs.miniPauseReason) {
          this._refs.miniPauseReason = createElement('div', { className: 'iu-unfollow-mini-pause-reason' },
            `Retomando em ${this._formatCountdown(uiState.remainingMs)}`) as HTMLElement;
          this._refs.miniWidget.appendChild(this._refs.miniPauseReason);
        } else {
          this._refs.miniPauseReason.textContent = `Retomando em ${this._formatCountdown(uiState.remainingMs)}`;
        }
      } else if (this._refs.miniPauseReason) {
        this._refs.miniPauseReason.remove();
        this._refs.miniPauseReason = undefined;
      }
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

    if (this._transitionTimeout) {
      clearTimeout(this._transitionTimeout);
      this._transitionTimeout = null;
    }
    this._isTransitioning = false;

    if (this._isMinimized) {
      this.maximize(false);
    }

    this._overlay.classList.remove('iu-hidden');
    this._overlay.style.removeProperty('display');
    this._overlay.style.display = '';
    const modal = (this._refs.modal || this._overlay.querySelector('.iu-unfollow-modal')) as HTMLElement | null;
    if (modal) {
      modal.classList.remove('iu-hidden');
      modal.style.removeProperty('display');
    }

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

    const firstFailure = log.find(e => e.wasFailure());
    const firstError = firstFailure && typeof firstFailure.getErrorMessage === 'function' ? firstFailure.getErrorMessage() : null;
    const is400 = firstError && (firstError.includes('400') || firstError.toLowerCase().includes('próximo dia'));

    if (is400) {
      this._refs.warning!.textContent = `⚠️ Erro 400: Para evitar bloqueio da conta, continue no próximo dia. (${successes} removidos)`;
      this._refs.warning!.classList.remove('iu-unfollow-modal-summary');
    }

    if (!is400) {
      this._refs.warning!.textContent = `✅ ${successes} removidos com sucesso` +
        (failures > 0 ? ` · ❌ ${failures} com erro` : '');
      this._refs.warning!.classList.add('iu-unfollow-modal-summary');
    }

    this._renderPauseState({ state: 'running', remainingMs: null, reason: null });

    if (this._refs.minimizeBtn) {
      this._refs.minimizeBtn.style.display = 'none';
    }

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

    if (this._transitionTimeout) {
      clearTimeout(this._transitionTimeout);
      this._transitionTimeout = null;
    }
    this._isTransitioning = false;

    this._removeMiniWidget();
    if (this._isMinimized) {
      document.body.style.overflow = '';
      this._isMinimized = false;
    }

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
    this._syncPauseButtonState();
    if (this._isPaused) {
      if (this._onPause) this._onPause();
    } else {
      if (this._onResume) this._onResume();
    }
  }
}
