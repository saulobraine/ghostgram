import { BrowserWindow } from 'electron';
import { DesktopInstagramApiClient } from './DesktopInstagramApiClient';

export interface UnfollowTarget {
  id: string;
  username: string;
}

export type UnfollowStatus =
  | 'idle'
  | 'running'
  | 'cooling_down'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'error';

export interface UnfollowProgressPayload {
  status: UnfollowStatus;
  currentIndex: number;
  total: number;
  currentUser?: string;
  percentage: number;
  successCount: number;
  failedCount: number;
  cooldownRemainingSeconds?: number;
  message?: string;
}

export interface UnfollowResultEntry {
  userId: string;
  username: string;
  success: boolean;
  timestamp: number;
  error?: string;
}

export interface UnfollowEngineOptions {
  minDelayMs?: number;
  maxDelayMs?: number;
  consecutiveLimit?: number;
  cooldownSeconds?: number;
}

export class DesktopUnfollowEngine {
  private client: DesktopInstagramApiClient;
  private isRunning = false;
  private isPaused = false;
  private isCancelled = false;
  private options: Required<UnfollowEngineOptions>;

  constructor(client: DesktopInstagramApiClient, options?: UnfollowEngineOptions) {
    this.client = client;
    this.options = {
      minDelayMs: options?.minDelayMs ?? 4000,
      maxDelayMs: options?.maxDelayMs ?? 8000,
      consecutiveLimit: options?.consecutiveLimit ?? 5,
      cooldownSeconds: options?.cooldownSeconds ?? 300,
    };
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isCancelled: this.isCancelled,
    };
  }

  public pause(): void {
    if (this.isRunning) {
      this.isPaused = true;
    }
  }

  public resume(): void {
    if (this.isRunning) {
      this.isPaused = false;
    }
  }

  public cancel(): void {
    this.isCancelled = true;
    this.isPaused = false;
  }

  private async sleep(ms: number): Promise<void> {
    if (ms <= 0) return;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async checkPauseOrCancel(): Promise<void> {
    while (this.isPaused && !this.isCancelled) {
      await this.sleep(400);
    }
    if (this.isCancelled) {
      throw new Error('UNFOLLOW_CANCELLED');
    }
  }

  private emitProgress(window: BrowserWindow | null, payload: UnfollowProgressPayload): void {
    if (window && !window.isDestroyed()) {
      window.webContents.send('unfollow:progress', payload);
    }
  }

  public async runUnfollowQueue(
    targets: UnfollowTarget[],
    csrftoken: string,
    window: BrowserWindow | null
  ): Promise<UnfollowResultEntry[]> {
    if (this.isRunning) {
      throw new Error('Fila de unfollow já está em execução');
    }

    this.isRunning = true;
    this.isPaused = false;
    this.isCancelled = false;

    const results: UnfollowResultEntry[] = [];
    const total = targets.length;
    let successCount = 0;
    let failedCount = 0;
    let consecutiveCount = 0;

    try {
      for (let i = 0; i < total; i++) {
        await this.checkPauseOrCancel();

        const target = targets[i];
        const percentage = Math.round((i / total) * 100);

        this.emitProgress(window, {
          status: 'running',
          currentIndex: i + 1,
          total,
          currentUser: target.username,
          percentage,
          successCount,
          failedCount,
          message: `Deixando de seguir @${target.username} (${i + 1}/${total})...`,
        });

        try {
          await this.client.unfollowUser(target.id, csrftoken);
          successCount++;
          consecutiveCount++;
          results.push({
            userId: target.id,
            username: target.username,
            success: true,
            timestamp: Date.now(),
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          failedCount++;
          results.push({
            userId: target.id,
            username: target.username,
            success: false,
            timestamp: Date.now(),
            error: errMsg,
          });
        }

        // Se ainda restam usuários
        if (i < total - 1) {
          // A cada N unfollows consecutivos, aplicar resfriamento
          if (consecutiveCount >= this.options.consecutiveLimit) {
            consecutiveCount = 0;
            const cooldownSeconds = this.options.cooldownSeconds;
            for (let s = cooldownSeconds; s > 0; s--) {
              await this.checkPauseOrCancel();

              this.emitProgress(window, {
                status: 'cooling_down',
                currentIndex: i + 1,
                total,
                currentUser: target.username,
                percentage: Math.round(((i + 1) / total) * 100),
                successCount,
                failedCount,
                cooldownRemainingSeconds: s,
                message: `Pausa de segurança ativa contra bloqueios do Instagram. Retomando em ${s}s...`,
              });

              await this.sleep(1000);
            }
          } else {
            // Intervalo configurado
            const min = this.options.minDelayMs;
            const max = this.options.maxDelayMs;
            const delayMs = max > min ? Math.floor(Math.random() * (max - min)) + min : min;
            const stepDuration = 500;
            const steps = Math.floor(delayMs / stepDuration);
            for (let step = 0; step < steps; step++) {
              await this.checkPauseOrCancel();
              await this.sleep(stepDuration);
            }
            // Resto do delay se houver
            const remainder = delayMs % stepDuration;
            if (remainder > 0) {
              await this.checkPauseOrCancel();
              await this.sleep(remainder);
            }
          }
        }
      }

      this.emitProgress(window, {
        status: 'completed',
        currentIndex: total,
        total,
        percentage: 100,
        successCount,
        failedCount,
        message: `Ação finalizada! ${successCount} contas deixadas de seguir com sucesso.`,
      });

      return results;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg === 'UNFOLLOW_CANCELLED') {
        this.emitProgress(window, {
          status: 'cancelled',
          currentIndex: results.length,
          total,
          percentage: Math.round((results.length / total) * 100),
          successCount,
          failedCount,
          message: 'Processo de unfollow cancelado pelo usuário.',
        });
        return results;
      }

      this.emitProgress(window, {
        status: 'error',
        currentIndex: results.length,
        total,
        percentage: Math.round((results.length / total) * 100),
        successCount,
        failedCount,
        message: `Erro na fila de unfollow: ${errorMsg}`,
      });
      throw err;
    } finally {
      this.isRunning = false;
      this.isPaused = false;
      this.isCancelled = false;
    }
  }
}
