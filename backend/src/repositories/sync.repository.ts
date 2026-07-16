import { prisma } from '../index';
import { logger } from '../config/logger.config';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncChangeset {
  created: Record<string, unknown>[];
  updated: Record<string, unknown>[];
  deleted: string[];
}

interface PullResult {
  businesses: SyncChangeset;
  business_members: SyncChangeset;
  customer_groups: SyncChangeset;
  customers: SyncChangeset;
  ledgers: SyncChangeset;
  categories: SyncChangeset;
  tags: SyncChangeset;
  transactions: SyncChangeset;
  transaction_tags: SyncChangeset;
  attachments: SyncChangeset;
  reminders: SyncChangeset;
  notifications: SyncChangeset;
  folder_members: SyncChangeset;
  folder_permissions: SyncChangeset;
  folder_invites: SyncChangeset;
  activity_logs: SyncChangeset;
  edit_history: SyncChangeset;
  invitations: SyncChangeset;
}

interface PushChanges {
  businesses?: SyncChangeset;
  business_members?: SyncChangeset;
  customer_groups?: SyncChangeset;
  customers?: SyncChangeset;
  ledgers?: SyncChangeset;
  categories?: SyncChangeset;
  tags?: SyncChangeset;
  transactions?: SyncChangeset;
  transaction_tags?: SyncChangeset;
  attachments?: SyncChangeset;
  reminders?: SyncChangeset;
  folder_members?: SyncChangeset;
  folder_permissions?: SyncChangeset;
  folder_invites?: SyncChangeset;
  activity_logs?: SyncChangeset;
  edit_history?: SyncChangeset;
  invitations?: SyncChangeset;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Splits a flat list of records into created / updated / deleted buckets.
 * "Created" = createdAt > lastPulledAt AND not deleted
 * "Updated" = updatedAt > lastPulledAt AND not deleted AND not new
 * "Deleted" = deletedAt is set AND updatedAt > lastPulledAt
 */
function bucket(records: any[], since: Date): SyncChangeset {
  const created: any[] = [];
  const updated: any[] = [];
  const deleted: string[] = [];

  for (const r of records) {
    if (r.deletedAt) {
      deleted.push(r.id);
    } else if (r.createdAt > since) {
      created.push(r);
    } else {
      updated.push(r);
    }
  }

  return { created, updated, deleted };
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class SyncRepository {
  // ── Access helpers ──────────────────────────────────────────────────────────

  async getBusinessIdsForUser(userId: string): Promise<string[]> {
    const memberships = await prisma.businessMember.findMany({
      where: { userId, deletedAt: null },
      select: { businessId: true },
    });
    return memberships.map((m) => m.businessId);
  }

  async assertBusinessAccess(userId: string, businessId: string): Promise<void> {
    const member = await prisma.businessMember.findFirst({
      where: { userId, businessId, deletedAt: null },
    });
    if (!member) {
      throw Object.assign(new Error('Access denied to this business'), { statusCode: 403 });
    }
  }

  // ── Pull ────────────────────────────────────────────────────────────────────

  async pullChanges(userId: string, lastPulledAt: number, businessId?: string): Promise<PullResult> {
    const since = new Date(lastPulledAt);

    // 1. Full Business Access
    const fullMemberships = await prisma.businessMember.findMany({
      where: { userId, deletedAt: null },
      select: { businessId: true },
    });
    let fullBusinessIds = fullMemberships.map((m) => m.businessId);

    // 2. Folder-Level Access
    const folderMemberships = await prisma.folderMember.findMany({
      where: { userId, deletedAt: null },
      select: { groupId: true, group: { select: { businessId: true } } },
    });
    let folderGroupIds = folderMemberships.map((m) => m.groupId);
    let folderBusinessIds = folderMemberships.map((m) => m.group.businessId);

    // Apply specific businessId filter if provided
    if (businessId) {
      if (fullBusinessIds.includes(businessId)) {
        fullBusinessIds = [businessId];
        folderGroupIds = [];
        folderBusinessIds = [];
      } else if (folderBusinessIds.includes(businessId)) {
        fullBusinessIds = [];
        folderBusinessIds = [businessId];
        folderGroupIds = folderMemberships
          .filter(m => m.group.businessId === businessId)
          .map(m => m.groupId);
      } else {
        fullBusinessIds = [];
        folderBusinessIds = [];
        folderGroupIds = [];
      }
    }

    const allBusinessIds = Array.from(new Set([...fullBusinessIds, ...folderBusinessIds]));

    // ── ALWAYS fetch invitations for this user, even if they have no businesses yet ──
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const invitationOrConditions: any[] = [];
    if (allBusinessIds.length > 0) {
      invitationOrConditions.push({ businessId: { in: allBusinessIds } }); // Invites they own/created
    }
    if (user?.email) {
      invitationOrConditions.push({ email: { equals: user.email, mode: 'insensitive' } });
    }
    if (user?.phone) {
      invitationOrConditions.push({ phone: { endsWith: user.phone.slice(-10) } });
    }

    const invitationRecords = invitationOrConditions.length > 0
      ? await prisma.invitation.findMany({
          where: {
            OR: invitationOrConditions,
            updatedAt: { gt: since },
          },
        })
      : [];

    if (allBusinessIds.length === 0) {
      const empty = (): SyncChangeset => ({ created: [], updated: [], deleted: [] });
      return {
        businesses: empty(),
        business_members: empty(),
        customer_groups: empty(),
        customers: empty(),
        ledgers: empty(),
        categories: empty(),
        tags: empty(),
        transactions: empty(),
        transaction_tags: empty(),
        attachments: empty(),
        reminders: empty(),
        notifications: empty(),
        folder_members: empty(),
        folder_permissions: empty(),
        folder_invites: empty(),
        activity_logs: empty(),
        edit_history: empty(),
        invitations: bucket(invitationRecords, since),
      };
    }

    const sinceFilter = { updatedAt: { gt: since } };
    
    // For records where full access gets everything in business, and folder access gets specific groups
    const groupAccessFilter = {
      OR: [
        { businessId: { in: fullBusinessIds } },
        { id: { in: folderGroupIds } }
      ]
    };

    const customerAccessFilter = {
      OR: [
        { businessId: { in: fullBusinessIds } },
        { groupId: { in: folderGroupIds } },
        { groupId: null, businessId: { in: fullBusinessIds } } // unassigned customers only for full members
      ]
    };

    const ledgerAccessFilter = {
      OR: [
        { businessId: { in: fullBusinessIds } },
        { customer: { groupId: { in: folderGroupIds } } }
      ]
    };

    const transactionAccessFilter = {
      OR: [
        { ledger: { businessId: { in: fullBusinessIds } } },
        { ledger: { customer: { groupId: { in: folderGroupIds } } } }
      ]
    };

    // ── Businesses ─────────────────────────────────────────────────────────────
    const bizRecords = await prisma.business.findMany({
      where: { id: { in: allBusinessIds }, updatedAt: { gt: since } },
    });

    // ── Members ────────────────────────────────────────────────────────────────
    const memberRecords = await prisma.businessMember.findMany({
      where: { businessId: { in: allBusinessIds }, ...sinceFilter },
    });

    // ── Customer Groups ────────────────────────────────────────────────────────
    const groupRecords = await prisma.customerGroup.findMany({
      where: { ...groupAccessFilter, ...sinceFilter },
    });

    // ── Customers ──────────────────────────────────────────────────────────────
    const customerRecords = await prisma.customer.findMany({
      where: { ...customerAccessFilter, ...sinceFilter },
    });

    // ── Ledgers ────────────────────────────────────────────────────────────────
    const ledgerRecords = await prisma.ledger.findMany({
      where: { ...ledgerAccessFilter, ...sinceFilter },
    });

    // ── Categories & Tags (Shared at business level) ──────────────────────────
    const categoryRecords = await prisma.category.findMany({
      where: { businessId: { in: allBusinessIds }, ...sinceFilter },
    });
    const tagRecords = await prisma.tag.findMany({
      where: { businessId: { in: allBusinessIds }, ...sinceFilter },
    });

    // ── Transactions ───────────────────────────────────────────────────────────
    const txRecords = await prisma.transaction.findMany({
      where: { ...transactionAccessFilter, ...sinceFilter },
    });

    // ── Transaction Tags ────────────────────────────────────────────────────────
    const txTagRecords = await prisma.transactionTag.findMany({
      where: { transaction: transactionAccessFilter, ...sinceFilter },
    });

    // ── Attachments ─────────────────────────────────────────────────────────────
    const attachmentRecords = await prisma.attachment.findMany({
      where: { transaction: transactionAccessFilter, ...sinceFilter },
    });

    // ── Reminders ──────────────────────────────────────────────────────────────
    const reminderRecords = await prisma.reminder.findMany({
      where: { businessId: { in: allBusinessIds }, ...sinceFilter },
    });

    // ── Notifications (user-scoped) ─────────────────────────────────────────────
    const notificationRecords = await prisma.notification.findMany({
      where: { userId, ...sinceFilter },
    });

    // ── Folder Members, Permissions, Invites ───────────────────────────────────
    const folderMemberRecords = await prisma.folderMember.findMany({
      where: { group: groupAccessFilter, ...sinceFilter },
    });
    const folderPermissionRecords = await prisma.folderPermission.findMany({
      where: { member: { group: groupAccessFilter }, ...sinceFilter },
    });
    const folderInviteRecords = await prisma.folderInvite.findMany({
      where: { group: groupAccessFilter, ...sinceFilter },
    });

    // ── Activity Logs & Edit History ───────────────────────────────────────────
    const activityLogRecords = await prisma.activityLog.findMany({
      where: { businessId: { in: allBusinessIds }, ...sinceFilter },
    });
    const editHistoryRecords = await prisma.editHistory.findMany({
      where: { businessId: { in: allBusinessIds }, ...sinceFilter },
    });

    return {
      businesses: bucket(bizRecords, since),
      business_members: bucket(memberRecords, since),
      customer_groups: bucket(groupRecords, since),
      customers: bucket(customerRecords, since),
      ledgers: bucket(ledgerRecords, since),
      categories: bucket(categoryRecords, since),
      tags: bucket(tagRecords, since),
      transactions: bucket(txRecords, since),
      transaction_tags: bucket(txTagRecords, since),
      attachments: bucket(attachmentRecords, since),
      reminders: bucket(reminderRecords, since),
      notifications: bucket(notificationRecords, since),
      folder_members: bucket(folderMemberRecords, since),
      folder_permissions: bucket(folderPermissionRecords, since),
      folder_invites: bucket(folderInviteRecords, since),
      activity_logs: bucket(activityLogRecords, since),
      edit_history: bucket(editHistoryRecords, since),
      invitations: bucket(invitationRecords, since),
    };
  }

  private emptyPullResult(): PullResult {
    const empty = (): SyncChangeset => ({ created: [], updated: [], deleted: [] });
    return {
      businesses: empty(),
      business_members: empty(),
      customer_groups: empty(),
      customers: empty(),
      ledgers: empty(),
      categories: empty(),
      tags: empty(),
      transactions: empty(),
      transaction_tags: empty(),
      attachments: empty(),
      reminders: empty(),
      notifications: empty(),
      folder_members: empty(),
      folder_permissions: empty(),
      folder_invites: empty(),
      activity_logs: empty(),
      edit_history: empty(),
      invitations: empty(),
    };
  }

  // ── Push ────────────────────────────────────────────────────────────────────

  async pushChanges(
    userId: string,
    changes: PushChanges,
    _lastPulledAt: number,
  ): Promise<{ uploaded: number; conflicts: number }> {
    const syncTime = new Date();
    let uploaded = 0;
    let conflicts = 0;

    await prisma.$transaction(async (tx) => {
      // Build an apply helper that captures businessIds by reference so we can refresh it
      let businessIds = await this.getBusinessIdsForUser(userId);

      const apply = async (
        modelDelegate: any,
        data: SyncChangeset | undefined,
        getBusinessId?: (record: any) => string | undefined,
        preProcess?: (record: any) => Promise<any>
      ) => {
        if (!data) return;

        // ── Creates ──────────────────────────────────────────────────────────
        for (const record of data.created ?? []) {
          // Security: validate business ownership for records with businessId
          const biz = getBusinessId?.(record);
          if (biz && !businessIds.includes(biz)) {
            logger.warn(`[Sync Push] Rejected create — userId=${userId} does not own businessId=${biz}`);
            continue;
          }
          try {
            const processedRecord = preProcess ? await preProcess(record) : record;
            if (!processedRecord) continue; // Skip if preProcess returns null
            await modelDelegate.create({
              data: { ...this.sanitize(processedRecord), createdAt: syncTime, updatedAt: syncTime },
            });
            uploaded++;
          } catch (e: any) {
            logger.warn(`[Sync Push] Create failed: ${e.message}`);
          }
        }

        // ── Updates (Last Write Wins) ─────────────────────────────────────────
        for (const record of data.updated ?? []) {
          if (!record.id) {
            logger.warn(`[Sync Push] Skipping update with missing id`);
            continue;
          }
          const biz = getBusinessId?.(record);
          if (biz && !businessIds.includes(biz)) continue;

          try {
            const existing = await modelDelegate.findUnique({ where: { id: record.id } });
            if (!existing) {
              // Upsert — might have been created server-side
              await modelDelegate.create({
                data: { ...this.sanitize(record), createdAt: syncTime, updatedAt: syncTime },
              });
              uploaded++;
              continue;
            }

            // Conflict detection: server record is newer than what client knows about
            const clientVersion = (record as any).version ?? 0;
            if (existing.version > clientVersion) {
              conflicts++;
              logger.info(
                `[Sync Conflict] server v${existing.version} > client v${clientVersion} for id=${record.id}`,
              );
              // Last-Write-Wins: server timestamp wins when server is newer
              // Skip this update — client will re-pull the server version
              continue;
            }

            const processedRecord = preProcess ? await preProcess(record) : record;
            if (!processedRecord) continue;

            await modelDelegate.update({
              where: { id: processedRecord.id },
              data: {
                ...this.sanitize(processedRecord),
                updatedAt: syncTime,
                version: { increment: 1 },
              },
            });
            uploaded++;
          } catch (e: any) {
            logger.warn(`[Sync Push] Update failed for id=${record.id}: ${e.message}`);
          }
        }

        // ── Deletes (soft) ────────────────────────────────────────────────────
        for (const id of data.deleted ?? []) {
          if (!id) continue;
          try {
            const existing = await modelDelegate.findUnique({ where: { id } });
            if (!existing) continue;

            const biz = getBusinessId?.(existing);
            if (biz && !businessIds.includes(biz)) continue;

            await modelDelegate.update({
              where: { id },
              data: { deletedAt: syncTime, version: { increment: 1 } },
            });
            uploaded++;
          } catch (e: any) {
            logger.warn(`[Sync Push] Delete failed for id=${id}: ${e.message}`);
          }
        }
      };

      const biz = (r: any) => r.businessId;
      
      const resolveMemberUser = async (record: any) => {
        // If userId is an email or phone, look up the real UUID
        if (record.userId && !record.userId.includes('-')) {
          const u = await prisma.user.findFirst({
            where: {
              OR: [
                { email: record.userId },
                { phone: record.userId }
              ]
            }
          });
          if (u) {
            return { ...record, userId: u.id };
          }
          return null; // Reject if user not found
        }
        return record;
      };

      // ── Step 1: Apply businesses — NO ownership check (user creates their own business) ──
      await apply(tx.business, changes.businesses, undefined);

      // ── Step 2: Apply business members ──────────────────────────────────────
      // Allow if: the user is a member of the business (existing) OR the record is for themselves
      // This handles the bootstrapping case where an owner syncs their own membership for a new business
      const bizWithSelfOverride = (record: any) => {
        const recordBizId = record.businessId;
        // If the member record is for the authenticated user, always allow (they're setting themselves up)
        if (record.userId === userId) return undefined; // undefined = no check = allow
        return recordBizId; // For OTHER users' memberships, enforce ownership
      };
      await apply(tx.businessMember, changes.business_members, bizWithSelfOverride, resolveMemberUser);

      // ── Step 3: REFRESH businessIds — now includes any just-created memberships ──
      const freshMemberships = await tx.businessMember.findMany({
        where: { userId, deletedAt: null },
        select: { businessId: true },
      });
      businessIds = freshMemberships.map((m: any) => m.businessId);

      // ── Step 4: Apply the rest using the updated ownership list ─────────────
      await apply(tx.customerGroup, changes.customer_groups, biz);
      await apply(tx.customer, changes.customers, biz);
      await apply(tx.ledger, changes.ledgers, biz);
      await apply(tx.category, changes.categories, biz);
      await apply(tx.tag, changes.tags, biz);
      await apply(tx.transaction, changes.transactions); // no direct businessId — rely on ledgerId FK
      await apply(tx.transactionTag, changes.transaction_tags);
      await apply(tx.attachment, changes.attachments);
      await apply(tx.reminder, changes.reminders, biz);
      await apply(tx.folderMember, changes.folder_members, undefined, resolveMemberUser);
      await apply(tx.folderPermission, changes.folder_permissions);
      await apply(tx.folderInvite, changes.folder_invites);
      await apply(tx.activityLog, changes.activity_logs, biz);
      await apply(tx.editHistory, changes.edit_history, biz);
      await apply(tx.invitation, changes.invitations, biz);
    });

    return { uploaded, conflicts };
  }

  // ── Initial Sync ────────────────────────────────────────────────────────────

  async initialPull(userId: string, businessId: string): Promise<PullResult> {
    await this.assertBusinessAccess(userId, businessId);
    // Pull everything from epoch 0
    return this.pullChanges(userId, 0, businessId);
  }

  // ── Status ──────────────────────────────────────────────────────────────────

  async getSyncStatus(userId: string) {
    const meta = await prisma.syncMetadata.findUnique({ where: { userId } });
    return meta ?? { userId, lastPulledAt: null, lastPushedAt: null };
  }

  async upsertSyncMetadata(userId: string, type: 'pull' | 'push') {
    const now = new Date();
    await prisma.syncMetadata.upsert({
      where: { userId },
      create: {
        userId,
        lastPulledAt: type === 'pull' ? now : null,
        lastPushedAt: type === 'push' ? now : null,
      },
      update: {
        lastPulledAt: type === 'pull' ? now : undefined,
        lastPushedAt: type === 'push' ? now : undefined,
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Strip any client-supplied fields that should never be trusted or are not in the Prisma schema */
  private sanitize(record: any): any {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _status, _changed, syncStatus, deviceId, serverId, updatedBy, ...safe } = record;
    return safe;
  }
}
