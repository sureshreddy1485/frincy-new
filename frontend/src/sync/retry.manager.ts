import { QueueItem } from './sync.types';

export class RetryManager {
  private static MAX_RETRIES = 5;
  private static BASE_DELAY_MS = 2000;

  static calculateNextRetry(retryCount: number): number | null {
    if (retryCount >= this.MAX_RETRIES) {
      return null; // Give up
    }
    
    // Exponential backoff: 2s, 4s, 8s, 16s, 32s
    const delayMs = this.BASE_DELAY_MS * Math.pow(2, retryCount);
    return Math.floor((Date.now() + delayMs) / 1000);
  }

  static canRetry(item: QueueItem): boolean {
    if (item.retryCount >= this.MAX_RETRIES) return false;
    
    const now = Math.floor(Date.now() / 1000);
    if (item.nextRetryAt && now < item.nextRetryAt) {
      return false; // Not time yet
    }
    
    return true;
  }
}
