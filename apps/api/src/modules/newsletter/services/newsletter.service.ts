import { Injectable, NotFoundException } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  ilike,
  schema,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import type {
  ListSubscribersDto,
  SubscribeNewsletterDto,
} from '../dto/newsletter.dto';

export interface SubscriptionResult {
  success: boolean;
  message: string;
  status: 'subscribed' | 'already_subscribed';
}

@Injectable()
export class NewsletterService {
  constructor(private readonly database: DatabaseService) {}

  private get db() {
    return this.database.client;
  }

  async subscribe(dto: SubscribeNewsletterDto): Promise<SubscriptionResult> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existing = await this.db.query.newsletterSubscribers.findFirst({
      where: eq(schema.newsletterSubscribers.email, normalizedEmail),
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        return {
          success: true,
          message: "You're already subscribed to our newsletter.",
          status: 'already_subscribed',
        };
      }

      await this.db
        .update(schema.newsletterSubscribers)
        .set({
          status: 'ACTIVE',
          subscribedAt: new Date(),
          unsubscribedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.newsletterSubscribers.id, existing.id));

      return {
        success: true,
        message: "You're subscribed successfully!",
        status: 'subscribed',
      };
    }

    await this.db.insert(schema.newsletterSubscribers).values({
      email: normalizedEmail,
      status: 'ACTIVE',
      subscribedAt: new Date(),
    });

    return {
      success: true,
      message: "You're subscribed successfully!",
      status: 'subscribed',
    };
  }

  async listSubscribers(query: ListSubscribersDto) {
    const searchPattern = query.search?.trim()
      ? `%${query.search.trim().replace(/[%_\\]/g, '\\$&')}%`
      : undefined;

    const conditions = [
      query.status ? eq(schema.newsletterSubscribers.status, query.status) : undefined,
      searchPattern ? ilike(schema.newsletterSubscribers.email, searchPattern) : undefined,
    ].filter(Boolean);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await this.db
      .select({
        id: schema.newsletterSubscribers.id,
        email: schema.newsletterSubscribers.email,
        status: schema.newsletterSubscribers.status,
        subscribedAt: schema.newsletterSubscribers.subscribedAt,
        unsubscribedAt: schema.newsletterSubscribers.unsubscribedAt,
        createdAt: schema.newsletterSubscribers.createdAt,
      })
      .from(schema.newsletterSubscribers)
      .where(whereClause)
      .orderBy(desc(schema.newsletterSubscribers.subscribedAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    const [{ total = 0 } = {}] = await this.db
      .select({ total: count() })
      .from(schema.newsletterSubscribers)
      .where(whereClause);

    return {
      items,
      total: Number(total),
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'UNSUBSCRIBED') {
    const existing = await this.db.query.newsletterSubscribers.findFirst({
      where: eq(schema.newsletterSubscribers.id, id),
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'SUBSCRIBER_NOT_FOUND',
        message: 'Subscriber not found',
      });
    }

    const [updated] = await this.db
      .update(schema.newsletterSubscribers)
      .set({
        status,
        ...(status === 'UNSUBSCRIBED' ? { unsubscribedAt: new Date() } : { unsubscribedAt: null }),
        updatedAt: new Date(),
      })
      .where(eq(schema.newsletterSubscribers.id, id))
      .returning();

    return updated;
  }
}
