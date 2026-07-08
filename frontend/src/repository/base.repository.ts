import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { eq, and, sql } from 'drizzle-orm';
import { database } from '../database';
import { syncQueue } from '../database/schema';
import { SyncStatus, SyncOperation } from '../constants/sync.constants';

export abstract class BaseRepository<
  TTable extends SQLiteTable,
  TInsert extends Record<string, any>,
  TSelect extends Record<string, any>
> {
  constructor(
    protected readonly table: TTable,
    protected readonly tableName: string
  ) {}

  protected getNow(): number {
    return Math.floor(Date.now() / 1000);
  }

  protected generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  protected async queueSync(
    tx: any,
    recordId: string,
    operation: SyncOperation,
    payload?: any
  ) {
    await tx.insert(syncQueue).values({
      id: this.generateId(),
      tableName: this.tableName,
      recordId,
      operation,
      payload: payload ? JSON.stringify(payload) : null,
      createdAt: this.getNow(),
    });
  }

  async findById(id: string): Promise<TSelect | null> {
    const results = await database
      .select()
      .from(this.table)
      .where(and(eq((this.table as any).id, id), sql`${(this.table as any).deletedAt} IS NULL`))
      .limit(1);
    
    return (results[0] as unknown as TSelect) || null;
  }

  async findAll(): Promise<TSelect[]> {
    const results = await database
      .select()
      .from(this.table)
      .where(sql`${(this.table as any).deletedAt} IS NULL`);
    return results as unknown as TSelect[];
  }

  async create(data: Partial<TInsert>): Promise<TSelect> {
    const id = this.generateId();
    const now = this.getNow();
    
    const insertData = {
      ...data,
      id,
      version: 1,
      syncStatus: SyncStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    let result: TSelect;

    await database.transaction(async (tx) => {
      await tx.insert(this.table).values(insertData as any);
      await this.queueSync(tx, id, SyncOperation.CREATE, insertData);
      
      const rows = await tx
        .select()
        .from(this.table)
        .where(eq((this.table as any).id, id))
        .limit(1);
      result = rows[0] as unknown as TSelect;
    });

    return result!;
  }

  async update(id: string, data: Partial<TInsert>): Promise<TSelect> {
    const now = this.getNow();
    const updateData = {
      ...data,
      updatedAt: now,
      syncStatus: SyncStatus.PENDING,
    };

    let result: TSelect;

    await database.transaction(async (tx) => {
      await tx
        .update(this.table)
        .set({
          ...updateData,
          version: sql`${(this.table as any).version} + 1`
        } as any)
        .where(eq((this.table as any).id, id));

      await this.queueSync(tx, id, SyncOperation.UPDATE, updateData);

      const rows = await tx
        .select()
        .from(this.table)
        .where(eq((this.table as any).id, id))
        .limit(1);
      result = rows[0] as unknown as TSelect;
    });

    return result!;
  }

  async delete(id: string): Promise<void> {
    const now = this.getNow();

    await database.transaction(async (tx) => {
      await tx
        .update(this.table)
        .set({
          deletedAt: now,
          syncStatus: SyncStatus.PENDING,
          version: sql`${(this.table as any).version} + 1`
        } as any)
        .where(eq((this.table as any).id, id));

      await this.queueSync(tx, id, SyncOperation.DELETE);
    });
  }
}
