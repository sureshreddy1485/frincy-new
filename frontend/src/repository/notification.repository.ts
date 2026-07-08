import { BaseRepository } from './base.repository';
import { notifications } from '../database/schema';
import { Notification, NewNotification } from '../database/models';
import { database } from '../database';
import { eq, desc, and } from 'drizzle-orm';
import { SyncOperation } from '../constants/sync.constants';

class NotificationRepository extends BaseRepository<typeof notifications, NewNotification, Notification> {
  constructor() {
    super(notifications, 'notifications');
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const results = await database
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    return results as unknown as Notification[];
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const results = await database
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.createdAt));
    return results as unknown as Notification[];
  }

  async markAsRead(id: string): Promise<void> {
    const now = this.getNow();
    await database.transaction(async (tx) => {
      await tx.update(notifications)
        .set({ isRead: true, updatedAt: now })
        .where(eq(notifications.id, id));
        
      await this.queueSync(tx, id, SyncOperation.UPDATE, { isRead: true });
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const unread = await this.getUnreadNotifications(userId);
    if (unread.length === 0) return;

    const now = this.getNow();
    await database.transaction(async (tx) => {
      await tx.update(notifications)
        .set({ isRead: true, updatedAt: now })
        .where(eq(notifications.userId, userId));
        
      for (const n of unread) {
        await this.queueSync(tx, n.id, SyncOperation.UPDATE, { isRead: true });
      }
    });
  }
}

export const notificationRepository = new NotificationRepository();
