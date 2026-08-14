import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, sql, schema } from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import type { ListPaymentMethodsDto } from '../dto/payment-methods.dto';

export interface PaymentMethodInput {
  code: string;
  name: string;
  description?: string | null;
  type: string;
  instructions: Record<string, unknown>;
  config: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
}

const SORT_COLUMNS = {
  name: (dir: 'asc' | 'desc') => dir === 'asc' ? asc(schema.paymentMethods.name) : desc(schema.paymentMethods.name),
  sortOrder: (dir: 'asc' | 'desc') => dir === 'asc' ? asc(schema.paymentMethods.sortOrder) : desc(schema.paymentMethods.sortOrder),
  createdAt: (dir: 'asc' | 'desc') => dir === 'asc' ? asc(schema.paymentMethods.createdAt) : desc(schema.paymentMethods.createdAt),
} as const;

@Injectable()
export class PaymentMethodsRepository {
  constructor(private readonly database: DatabaseService) {}
  private get db() {
    return this.database.client;
  }

  async list(query: ListPaymentMethodsDto) {
    const conditions = [
      query.search
        ? sql`(${schema.paymentMethods.name} ILIKE ${`%${query.search}%`} OR ${schema.paymentMethods.code} ILIKE ${`%${query.search.toUpperCase()}%`})`
        : undefined,
      query.type ? eq(schema.paymentMethods.type, query.type) : undefined,
      query.isActive === undefined
        ? undefined
        : eq(schema.paymentMethods.isActive, query.isActive),
    ];
    const where = and(...conditions);
    const [{ total = 0 } = {}] = await this.db
      .select({ total: count() })
      .from(schema.paymentMethods)
      .where(where);
    const sort = query.sort ? SORT_COLUMNS[query.sort.split(':')[0] as 'name' | 'sortOrder' | 'createdAt'](query.sort.split(':')[1] as 'asc' | 'desc') : asc(schema.paymentMethods.sortOrder);
    const items = await this.db
      .select({
        id: schema.paymentMethods.id,
        code: schema.paymentMethods.code,
        name: schema.paymentMethods.name,
        description: schema.paymentMethods.description,
        type: schema.paymentMethods.type,
        isActive: schema.paymentMethods.isActive,
        sortOrder: schema.paymentMethods.sortOrder,
        createdAt: schema.paymentMethods.createdAt,
        updatedAt: schema.paymentMethods.updatedAt,
      })
      .from(schema.paymentMethods)
      .where(where)
      .orderBy(sort, asc(schema.paymentMethods.name))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    return { items, total: Number(total) };
  }

  detail(id: string) {
    return this.db.query.paymentMethods.findFirst({
      where: eq(schema.paymentMethods.id, id),
    });
  }

  /** Public-safe shape for student surfaces - never includes `config`. */
  activePublic() {
    return this.db
      .select({
        id: schema.paymentMethods.id,
        code: schema.paymentMethods.code,
        name: schema.paymentMethods.name,
        description: schema.paymentMethods.description,
        type: schema.paymentMethods.type,
        instructions: schema.paymentMethods.instructions,
        sortOrder: schema.paymentMethods.sortOrder,
      })
      .from(schema.paymentMethods)
      .where(eq(schema.paymentMethods.isActive, true))
      .orderBy(asc(schema.paymentMethods.sortOrder), asc(schema.paymentMethods.name));
  }

  activeById(id: string) {
    return this.db.query.paymentMethods.findFirst({
      where: and(
        eq(schema.paymentMethods.id, id),
        eq(schema.paymentMethods.isActive, true),
      ),
    });
  }

  findByCode(code: string) {
    return this.db.query.paymentMethods.findFirst({
      where: eq(schema.paymentMethods.code, code),
    });
  }

  create(actorId: string, input: PaymentMethodInput) {
    return this.db
      .insert(schema.paymentMethods)
      .values({
        code: input.code,
        name: input.name,
        description: input.description ?? null,
        type: input.type as never,
        instructions: input.instructions,
        config: input.config,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
        createdBy: actorId,
      })
      .returning();
  }

  update(id: string, input: Partial<PaymentMethodInput>) {
    return this.db
      .update(schema.paymentMethods)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.type !== undefined ? { type: input.type as never } : {}),
        ...(input.instructions !== undefined
          ? { instructions: input.instructions }
          : {}),
        ...(input.config !== undefined ? { config: input.config } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        updatedAt: new Date(),
      })
      .where(eq(schema.paymentMethods.id, id))
      .returning();
  }

  setActive(id: string, isActive: boolean) {
    return this.db
      .update(schema.paymentMethods)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(schema.paymentMethods.id, id))
      .returning();
  }

  delete(id: string) {
    return this.db
      .delete(schema.paymentMethods)
      .where(eq(schema.paymentMethods.id, id))
      .returning({ id: schema.paymentMethods.id });
  }

  async referencedPaymentCount(id: string) {
    const [{ total = 0 } = {}] = await this.db
      .select({ total: count() })
      .from(schema.payments)
      .where(eq(schema.payments.paymentMethodId, id));
    return Number(total);
  }
}
