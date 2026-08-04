import { BadRequestException, Injectable } from '@nestjs/common';
import { and, desc, eq, schema } from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import { SettingRegistryService } from './settings';
import { SettingsQueryDto, SettingItemDto } from './settings.dto';
@Injectable()
export class PlatformSettingsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly registry: SettingRegistryService,
  ) {}
  async list(q: SettingsQueryDto) {
    const rows = await this.db.client.select().from(schema.platformSettings);
    const map = new Map(rows.map((r) => [r.key, r]));
    return this.registry.definitions
      .filter(
        (d) =>
          (!q.category || d.category === q.category) &&
          (!q.search ||
            d.key.includes(q.search) ||
            d.description.toLowerCase().includes(q.search.toLowerCase())),
      )
      .map((d) => {
        const r = map.get(d.key);
        return {
          ...d,
          value: r?.value ?? d.defaultValue,
          updatedAt: r?.updatedAt ?? null,
          updatedBy: r?.updatedBy ?? null,
        };
      });
  }
  async get(key: string) {
    const d = this.registry.get(key);
    const [row] = await this.db.client
      .select()
      .from(schema.platformSettings)
      .where(eq(schema.platformSettings.key, key))
      .limit(1);
    return {
      ...d,
      value: row?.value ?? d.defaultValue,
      updatedAt: row?.updatedAt ?? null,
      updatedBy: row?.updatedBy ?? null,
    };
  }
  async update(
    actorId: string,
    key: string,
    value: unknown,
    reason: string,
    permissions: string[],
    admin = false,
  ) {
    return this.batch(
      actorId,
      [{ key, value }],
      reason,
      permissions,
      admin,
    ).then((x) => x[0]);
  }
  async batch(
    actorId: string,
    items: SettingItemDto[],
    reason: string,
    permissions: string[],
    admin = false,
  ) {
    if (new Set(items.map((i) => i.key)).size !== items.length)
      throw new BadRequestException('Setting keys must be unique');
    const validated = items.map((i) => {
      const d = this.registry.get(i.key);
      this.registry.authorize(d, permissions, admin);
      this.registry.validate(d, i.value);
      return { ...i, d };
    });
    return this.db.client.transaction(async (tx) => {
      const out = [];
      for (const item of validated) {
        const [old] = await tx
          .select()
          .from(schema.platformSettings)
          .where(eq(schema.platformSettings.key, item.key))
          .limit(1);
        const [saved] = await tx
          .insert(schema.platformSettings)
          .values({ key: item.key, value: item.value, updatedBy: actorId })
          .onConflictDoUpdate({
            target: schema.platformSettings.key,
            set: {
              value: item.value,
              updatedBy: actorId,
              updatedAt: new Date(),
            },
          })
          .returning();
        await tx.insert(schema.activityLogs).values({
          actorId,
          action: 'platform_setting.updated',
          entityType: 'platform_setting',
          entityId: saved.id,
          before: { key: item.key, value: old?.value ?? item.d.defaultValue },
          after: {
            key: item.key,
            value: item.value,
            reason,
            category: item.d.category,
            restartRequired: item.d.restartRequired,
          },
        });
        out.push({
          ...item.d,
          value: saved.value,
          updatedAt: saved.updatedAt,
          updatedBy: actorId,
        });
      }
      return out;
    });
  }
  async history(key: string) {
    this.registry.get(key);
    const rows = await this.db.client
      .select()
      .from(schema.activityLogs)
      .where(
        and(
          eq(schema.activityLogs.action, 'platform_setting.updated'),
          eq(schema.activityLogs.entityType, 'platform_setting'),
        ),
      )
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(500);
    return rows
      .filter((r) => (r.after as any)?.key === key)
      .map((r) => ({
        id: r.id,
        actorId: r.actorId,
        previousValue: (r.before as any)?.value,
        newValue: (r.after as any)?.value,
        reason: (r.after as any)?.reason,
        createdAt: r.createdAt,
      }));
  }
}
