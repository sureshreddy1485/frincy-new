import { database } from '../database';
import { businesses, businessMembers } from '../database/schema';

export async function runDevSeeder(userId: string): Promise<string> {
  const dummyBusinessId = `dev-business-${Date.now()}`;
  
  try {
    await database.insert(businesses).values({
      id: dummyBusinessId,
      name: 'Development Business',
      currency: 'USD',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).onConflictDoNothing();
    
    await database.insert(businessMembers).values({
      id: `bm-${userId}-${Date.now()}`,
      businessId: dummyBusinessId,
      userId: userId,
      role: 'OWNER',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).onConflictDoNothing();

    console.log('[DevSeeder] Seeded dummy business successfully:', dummyBusinessId);
    return dummyBusinessId;
  } catch (e) {
    console.error('[DevSeeder] Failed to seed dummy business:', e);
    throw e;
  }
}
