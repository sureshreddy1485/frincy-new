import { BaseRepository } from './base.repository';
import { products } from '../database/schema';
import { database } from '../database';
import { eq, and, sql, lte } from 'drizzle-orm';

import { Product, NewProduct } from '../database/models';

class ProductRepository extends BaseRepository<typeof products, NewProduct, Product> {
  constructor() {
    super(products, 'products');
  }

  async getLowStockProducts(businessId: string) {
    return database
      .select()
      .from(products)
      .where(
        and(
          eq(products.businessId, businessId),
          lte(products.quantity, 5),
          sql`${products.deletedAt} IS NULL`
        )
      );
  }
}

export const productRepository = new ProductRepository();
