import { database } from '../database';
import { folderMembers } from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { BaseRepository } from './base.repository';

// We just map the schema structure
export class FolderMemberRepository extends BaseRepository<typeof folderMembers, any, any> {
  constructor() {
    super(folderMembers, 'folder_members');
  }

  async getMembersByFolder(groupId: string) {
    return database
      .select()
      .from(folderMembers)
      .where(
        and(
          eq(folderMembers.groupId, groupId),
          sql`${folderMembers.deletedAt} IS NULL`
        )
      );
  }
}

export const folderMemberRepository = new FolderMemberRepository();
