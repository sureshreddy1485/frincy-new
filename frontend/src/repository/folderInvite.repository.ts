import { database } from '../database';
import { folderInvites } from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { BaseRepository } from './base.repository';

export class FolderInviteRepository extends BaseRepository<typeof folderInvites, any, any> {
  constructor() {
    super(folderInvites, 'folder_invites');
  }

  async getInvitesByFolder(groupId: string) {
    return database
      .select()
      .from(folderInvites)
      .where(
        and(
          eq(folderInvites.groupId, groupId),
          sql`${folderInvites.deletedAt} IS NULL`
        )
      );
  }

  async findByToken(token: string) {
    const results = await database
      .select()
      .from(folderInvites)
      .where(
        and(
          eq(folderInvites.token, token),
          eq(folderInvites.status, 'ACTIVE'),
          sql`${folderInvites.deletedAt} IS NULL`
        )
      )
      .limit(1);
    return results.length > 0 ? results[0] : null;
  }
}

export const folderInviteRepository = new FolderInviteRepository();
