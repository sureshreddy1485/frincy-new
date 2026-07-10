import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { database } from '../database';
import { businesses, businessMembers } from '../database/schema';
import { eq, sql, and, desc, or } from 'drizzle-orm';
import { Business } from '../database/models';
import { BusinessRole } from '../services/permission.service';
import { useAuthStore } from './authStore';

interface BusinessState {
  activeBusinessId: string | null;
  activeBusinessRole: BusinessRole | null;
  businessesList: Business[];
  isLoading: boolean;
  
  setActiveBusiness: (id: string) => Promise<void>;
  loadBusinesses: (userId: string) => Promise<Business[]>;
  clearBusinessData: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  activeBusinessId: null,
  activeBusinessRole: null,
  businessesList: [],
  isLoading: false,

  setActiveBusiness: async (id: string) => {
    await SecureStore.setItemAsync('active_business_id', id);
    
    // Fetch the role for the selected business
    const userId = useAuthStore.getState().user?.id;
    let role: BusinessRole | null = null;
    if (userId) {
      const result = await database
        .select({ role: businessMembers.role })
        .from(businessMembers)
        .where(
          and(
            eq(businessMembers.businessId, id),
            eq(businessMembers.userId, userId),
            sql`${businessMembers.deletedAt} IS NULL`
          )
        )
        .orderBy(desc(businessMembers.createdAt))
        .limit(1);
      if (result.length > 0) role = result[0].role as BusinessRole;
    }
    
    set({ activeBusinessId: id, activeBusinessRole: role });
  },

  loadBusinesses: async (userId: string) => {
    set({ isLoading: true });
    try {
      const userState = useAuthStore.getState().user;
      
      // Resolve any pending offline invitations (email/phone to UUID mapping)
      if (userState) {
        const conditions = [];
        if (userState.email) conditions.push(eq(businessMembers.userId, userState.email));
        if (userState.phone) conditions.push(eq(businessMembers.userId, userState.phone));
        if (conditions.length > 0) {
          await database.update(businessMembers).set({ userId: userId }).where(or(...conditions));
        }
      }

      // Find all businesses where the user is a member
      const memberRecords = await database
        .select({ businessId: businessMembers.businessId })
        .from(businessMembers)
        .where(
          and(
            eq(businessMembers.userId, userId),
            sql`${businessMembers.deletedAt} IS NULL`
          )
        );

      const businessIds = memberRecords.map(r => r.businessId);

      if (businessIds.length === 0) {
        set({ businessesList: [], activeBusinessId: null, isLoading: false });
        return [];
      }

      // Load full business data
      const loadedBusinesses = [];
      for (const bId of businessIds) {
        const b = await database
          .select()
          .from(businesses)
          .where(
            and(
              eq(businesses.id, bId),
              sql`${businesses.deletedAt} IS NULL`
            )
          )
          .limit(1);
          
        if (b.length > 0) {
          loadedBusinesses.push(b[0] as unknown as Business);
        }
      }

      if (loadedBusinesses.length === 0) {
        await SecureStore.deleteItemAsync('active_business_id');
        set({ businessesList: [], activeBusinessId: null, isLoading: false });
        return [];
      }

      // Try restoring last active business
      let activeId = await SecureStore.getItemAsync('active_business_id');
      
      // If none restored or restored is no longer valid, default to the first one
      if (!activeId || !loadedBusinesses.find(b => b.id === activeId)) {
        activeId = loadedBusinesses[0].id;
        await SecureStore.setItemAsync('active_business_id', activeId);
      }

      // Fetch role for activeId
      let role: BusinessRole | null = null;
      const result = await database
        .select({ role: businessMembers.role })
        .from(businessMembers)
        .where(
          and(
            eq(businessMembers.businessId, activeId),
            eq(businessMembers.userId, userId),
            sql`${businessMembers.deletedAt} IS NULL`
          )
        )
        .orderBy(desc(businessMembers.createdAt))
        .limit(1);
      if (result.length > 0) role = result[0].role as BusinessRole;

      set({ businessesList: loadedBusinesses, activeBusinessId: activeId, activeBusinessRole: role, isLoading: false });
      return loadedBusinesses;

    } catch (e) {
      console.error('Failed to load businesses:', e);
      set({ businessesList: [], activeBusinessId: null, isLoading: false });
      return [];
    }
  },

  clearBusinessData: async () => {
    await SecureStore.deleteItemAsync('active_business_id');
    set({ activeBusinessId: null, activeBusinessRole: null, businessesList: [], isLoading: false });
  },

  refreshRole: async () => {
    const userId = useAuthStore.getState().user?.id;
    const activeId = get().activeBusinessId;
    if (userId && activeId) {
      const result = await database
        .select({ role: businessMembers.role })
        .from(businessMembers)
        .where(
          and(
            eq(businessMembers.businessId, activeId),
            eq(businessMembers.userId, userId),
            sql`${businessMembers.deletedAt} IS NULL`
          )
        )
        .orderBy(desc(businessMembers.createdAt))
        .limit(1);
      if (result.length > 0) set({ activeBusinessRole: result[0].role as BusinessRole });
    }
  }
}));
