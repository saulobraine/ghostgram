/**
 * Sync Service
 * Handles automatic synchronization with API when online
 */

import { apiClient } from './ApiClient';
import type { IUserObject } from '@ghostgram/shared';

export class SyncService {
  private syncInterval: number | null = null;
  private isOnline: boolean = false;

  async initialize() {
    this.isOnline = await apiClient.isOnline();
    
    // Check online status every 30 seconds
    setInterval(() => this.checkOnlineStatus(), 30000);
    
    // Auto-sync every 5 minutes if online and authenticated
    if (this.isOnline && apiClient.isAuthenticated()) {
      this.startAutoSync();
    }
  }

  private async checkOnlineStatus() {
    const wasOnline = this.isOnline;
    this.isOnline = await apiClient.isOnline();
    
    // If just came online, trigger sync
    if (!wasOnline && this.isOnline && apiClient.isAuthenticated()) {
      console.log('[SyncService] Came online, triggering sync...');
      await this.syncAll();
      this.startAutoSync();
    } else if (wasOnline && !this.isOnline) {
      console.log('[SyncService] Went offline');
      this.stopAutoSync();
    }
  }

  private startAutoSync() {
    if (this.syncInterval) return;
    
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && apiClient.isAuthenticated()) {
        this.syncAll().catch(console.error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  private stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncAll(): Promise<void> {
    if (!this.isOnline || !apiClient.isAuthenticated()) {
      return;
    }

    try {
      await Promise.all([
        this.syncWhitelist(),
        this.syncHistory()
      ]);
      console.log('[SyncService] Sync completed');
    } catch (error) {
      console.error('[SyncService] Sync failed:', error);
    }
  }

  private async syncWhitelist(): Promise<void> {
    try {
      // Get local whitelist
      const result = await chrome.storage.sync.get('iu_whitelisted-results');
      const localWhitelist = result['iu_whitelisted-results'] || [];
      
      if (localWhitelist.length === 0) return;

      // Get current IG username (from localStorage in content script)
      const [tab] = await chrome.tabs.query({ active: true, url: 'https://www.instagram.com/*' });
      if (!tab?.id) return;

      // For now, we'll skip the accountId requirement and just sync
      // In a real implementation, we'd get the accountId from the user's IG accounts
      const usernames = localWhitelist.map((user: IUserObject) => 
        user.username || user._username || ''
      ).filter(Boolean);

      if (usernames.length > 0) {
        // This would need the accountId in a real scenario
        console.log('[SyncService] Would sync whitelist:', usernames.length, 'users');
      }
    } catch (error) {
      console.error('[SyncService] Whitelist sync failed:', error);
    }
  }

  private async syncHistory(): Promise<void> {
    try {
      // Get local action history
      const result = await chrome.storage.local.get('ghostgram_actions_history');
      const localHistory = result.ghostgram_actions_history || [];
      
      if (localHistory.length === 0) return;

      // Similar to whitelist, this needs accountId
      console.log('[SyncService] Would sync history:', localHistory.length, 'actions');
    } catch (error) {
      console.error('[SyncService] History sync failed:', error);
    }
  }

  async syncScanResult(result: {
    totalFollowing: number;
    nonFollowers: number;
    users: IUserObject[];
  }): Promise<void> {
    if (!this.isOnline || !apiClient.isAuthenticated()) {
      return;
    }

    try {
      // This would need the accountId
      console.log('[SyncService] Would sync scan result:', {
        totalFollowing: result.totalFollowing,
        nonFollowers: result.nonFollowers,
        usersCount: result.users.length
      });
    } catch (error) {
      console.error('[SyncService] Scan sync failed:', error);
    }
  }

  getStatus(): { online: boolean; authenticated: boolean } {
    return {
      online: this.isOnline,
      authenticated: apiClient.isAuthenticated()
    };
  }
}

// Singleton instance
export const syncService = new SyncService();
