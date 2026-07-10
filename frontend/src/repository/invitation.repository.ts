import { BaseRepository } from './base.repository';
import { invitations } from '../database/schema';
import { Invitation, NewInvitation } from '../database/models';
import { database } from '../database';
import { eq, and, sql, or, like } from 'drizzle-orm';

class InvitationRepository extends BaseRepository<typeof invitations, NewInvitation, Invitation> {
  constructor() {
    super(invitations, 'invitations');
  }

  async getPendingByBusiness(businessId: string): Promise<Invitation[]> {
    const results = await database
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.businessId, businessId),
          eq(invitations.status, 'PENDING'),
          sql`${invitations.deletedAt} IS NULL`
        )
      );
    return results as unknown as Invitation[];
  }

  async getPendingForUser(email: string | null, phone: string | null): Promise<Invitation[]> {
    const conditions = [];
    if (email) conditions.push(sql`LOWER(${invitations.email}) = LOWER(${email})`);
    if (phone) {
      const last10 = phone.slice(-10);
      conditions.push(like(invitations.phone, `%${last10}`));
    }
    if (conditions.length === 0) return [];

    const results = await database
      .select()
      .from(invitations)
      .where(
        and(
          or(...conditions),
          eq(invitations.status, 'PENDING'),
          sql`${invitations.deletedAt} IS NULL`
        )
      );
    return results as unknown as Invitation[];
  }
}

export const invitationRepository = new InvitationRepository();
