import { BaseRepository } from './base.repository';
import { invitations } from '../database/schema';
import { Invitation, NewInvitation } from '../database/models';
import { database } from '../database';
import { eq, and, sql } from 'drizzle-orm';

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
}

export const invitationRepository = new InvitationRepository();
