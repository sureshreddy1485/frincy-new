import { notificationRepository } from '../repository/notification.repository';
import { and, eq, sql } from 'drizzle-orm';
import { reminderRepository } from '../repository/reminder.repository';
import { customerRepository } from '../repository/customer.repository';
import { productRepository } from '../repository/product.repository';
import { Notification, Reminder } from '../database/models';
import { database } from '../database';
import { customers } from '../database/schema';

class NotificationService {
  
  // ── Notifications (System & User) ─────────────────────────────────────────

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return notificationRepository.getNotificationsByUser(userId);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    return notificationRepository.markAsRead(id);
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    return notificationRepository.markAllAsRead(userId);
  }

  async addSystemNotification(userId: string, title: string, body: string): Promise<Notification> {
    return notificationRepository.create({
      userId,
      title,
      body,
      isRead: false,
    });
  }

  // ── Reminders ─────────────────────────────────────────────────────────────

  async getReminders(businessId: string): Promise<Reminder[]> {
    return reminderRepository.getRemindersByBusiness(businessId);
  }

  async addReminder(businessId: string, title: string, dueDate: Date, relatedId?: string): Promise<Reminder> {
    return reminderRepository.create({
      businessId,
      title,
      dueDate: Math.floor(dueDate.getTime() / 1000),
      status: 'PENDING',
      relatedId: relatedId ?? null,
    });
  }

  async updateReminderStatus(id: string, status: 'PENDING' | 'COMPLETED' | 'SNOOZED', newDate?: Date): Promise<Reminder> {
    const updateData: any = { status };
    if (newDate) {
      updateData.dueDate = Math.floor(newDate.getTime() / 1000);
    }
    return reminderRepository.update(id, updateData);
  }

  async deleteReminder(id: string): Promise<void> {
    return reminderRepository.delete(id);
  }

  // ── Smart Reminders Generation ────────────────────────────────────────────

  async generateSmartReminders(businessId: string): Promise<void> {
    const [overdueCustomers, lowStockProducts, pendingReminders] = await Promise.all([
      database.select().from(customers).where(
        and(eq(customers.businessId, businessId), sql`${customers.balance} < 0`, sql`${customers.deletedAt} IS NULL`)
      ) as any,
      productRepository.getLowStockProducts(businessId),
      reminderRepository.getPendingReminders(businessId),
    ]);

    const existingRelatedIds = new Set(pendingReminders.map(r => r.relatedId));
    const nowTimestamp = Math.floor(Date.now() / 1000);

    // 1. Overdue Customers - Disabled to prevent spam. Users should manually set due dates on transactions.

    // 2. Low Stock Products
    for (const p of lowStockProducts) {
      if (!existingRelatedIds.has(p.id)) {
        await reminderRepository.create({
          businessId,
          title: `Low stock alert: ${p.name} (Quantity: ${p.quantity})`,
          dueDate: nowTimestamp,
          status: 'PENDING',
          relatedId: p.id,
        });
        existingRelatedIds.add(p.id);
      }
    }
  }
}

export const notificationService = new NotificationService();
