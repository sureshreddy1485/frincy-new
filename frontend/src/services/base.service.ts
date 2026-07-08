import { BaseRepository } from '../repository/base.repository';

export abstract class BaseService<TRepo extends BaseRepository<any, any, any>, TInsert, TSelect> {
  constructor(protected readonly repository: TRepo) {}

  async getById(id: string): Promise<TSelect> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new Error(`Record with id ${id} not found.`);
    }
    return record;
  }

  async getAll(): Promise<TSelect[]> {
    return this.repository.findAll();
  }

  async create(data: Partial<TInsert>): Promise<TSelect> {
    // Add generic validation or business logic here
    return this.repository.create(data);
  }

  async update(id: string, data: Partial<TInsert>): Promise<TSelect> {
    // Ensure record exists before updating
    await this.getById(id);
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    // Ensure record exists before deleting
    await this.getById(id);
    return this.repository.delete(id);
  }
}
