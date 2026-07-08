import { SyncRepository } from '../repositories/sync.repository';
import { logger } from '../config/logger.config';

export class SyncService {
  private repo: SyncRepository;

  constructor() {
    this.repo = new SyncRepository();
  }

  // ── Pull ──────────────────────────────────────────────────────────────────

  async pull(userId: string, lastPulledAt: number, businessId?: string) {
    const start = Date.now();
    logger.info(`[Sync Pull] userId=${userId} lastPulledAt=${lastPulledAt}`);

    // Capture timestamp BEFORE querying to avoid race conditions
    const timestamp = Date.now();
    const changes = await this.repo.pullChanges(userId, lastPulledAt, businessId);

    await this.repo.upsertSyncMetadata(userId, 'pull');

    const downloaded = this.countChangeset(changes);
    const duration = Date.now() - start;
    logger.info(`[Sync Pull] Completed — downloaded=${downloaded} duration=${duration}ms`);

    return { changes, timestamp };
  }

  // ── Push ──────────────────────────────────────────────────────────────────

  async push(userId: string, changes: any, lastPulledAt: number) {
    const start = Date.now();
    logger.info(`[Sync Push] userId=${userId} lastPulledAt=${lastPulledAt}`);

    const result = await this.repo.pushChanges(userId, changes, lastPulledAt);

    await this.repo.upsertSyncMetadata(userId, 'push');

    const duration = Date.now() - start;
    logger.info(
      `[Sync Push] Completed — uploaded=${result.uploaded} conflicts=${result.conflicts} duration=${duration}ms`,
    );

    return { success: true, ...result };
  }

  // ── Initial Sync ─────────────────────────────────────────────────────────

  async initialSync(userId: string, businessId: string) {
    const start = Date.now();
    logger.info(`[Sync Initial] userId=${userId} businessId=${businessId}`);

    const timestamp = Date.now();
    const changes = await this.repo.initialPull(userId, businessId);

    await this.repo.upsertSyncMetadata(userId, 'pull');

    const downloaded = this.countChangeset(changes);
    const duration = Date.now() - start;
    logger.info(`[Sync Initial] Completed — downloaded=${downloaded} duration=${duration}ms`);

    return { changes, timestamp };
  }

  // ── Status ────────────────────────────────────────────────────────────────

  async getStatus(userId: string) {
    return this.repo.getSyncStatus(userId);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private countChangeset(changes: Record<string, any>): number {
    let total = 0;
    for (const key of Object.keys(changes)) {
      const c = changes[key];
      if (c && typeof c === 'object') {
        total += (c.created?.length ?? 0) + (c.updated?.length ?? 0) + (c.deleted?.length ?? 0);
      }
    }
    return total;
  }
}
