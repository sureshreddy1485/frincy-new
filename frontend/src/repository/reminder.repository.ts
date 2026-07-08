import { BaseRepository } from './base.repository';
import { reminders } from '../database/schema';
import { Reminder, NewReminder } from '../database/models';
import { database } from '../database';
import { eq, and, sql, asc } from 'drizzle-orm';
import { SyncOperation } from '../constants/sync.constants';

class ReminderRepository extends BaseRepository<typeof reminders, NewReminder, Reminder> {
  constructor() {
    super(reminders, 'reminders');
  }

  async getRemindersByBusiness(businessId: string): Promise<Reminder[]> {
    const results = await database
      .select()
      .from(reminders)
      .where(and(eq(reminders.businessId, businessId), sql`${reminders.deletedAt} IS NULL`))
      .orderBy(asc(reminders.dueDate));
    return results as unknown as Reminder[];
  }

  async getPendingReminders(businessId: string): Promise<Reminder[]> {
    const results = await database
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.businessId, businessId),
          eq(reminders.status, 'PENDING'),
          sql`${reminders.deletedAt} IS NULL`
        )
      )
      .orderBy(asc(reminders.dueDate));
    return results as unknown as Reminder[];
  }

  async getPendingRemindersByRelatedId(businessId: string, relatedId: string): Promise<Reminder[]> {
    const results = await database
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.businessId, businessId),
          eq(reminders.status, 'PENDING'),
          eq(reminders.relatedId, relatedId),
          sql`${reminders.deletedAt} IS NULL`
        )
      );
    return results as unknown as Reminder[];
  }
}

export const reminderRepository = new ReminderRepository();
