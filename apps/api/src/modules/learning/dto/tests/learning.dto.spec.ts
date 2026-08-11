import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  LearningActivityQueryDto,
  UpdateVideoPositionDto,
} from '../learning.dto';

describe('learning DTOs', () => {
  describe('UpdateVideoPositionDto', () => {
    it('coerces a string position to a number', () => {
      const instance = plainToInstance(UpdateVideoPositionDto, {
        positionSeconds: '120',
      });
      expect(instance.positionSeconds).toBe(120);
    });

    it('rejects a negative position', async () => {
      const errors = await validate(
        plainToInstance(UpdateVideoPositionDto, { positionSeconds: -1 }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a position beyond the 24-hour cap', async () => {
      const errors = await validate(
        plainToInstance(UpdateVideoPositionDto, { positionSeconds: 100_000 }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts a valid position', async () => {
      const errors = await validate(
        plainToInstance(UpdateVideoPositionDto, { positionSeconds: 300 }),
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe('LearningActivityQueryDto', () => {
    it('applies page/pageSize defaults', () => {
      const instance = plainToInstance(LearningActivityQueryDto, {});
      expect(instance.page).toBe(1);
      expect(instance.pageSize).toBe(20);
    });

    it('accepts a fully populated query', async () => {
      const errors = await validate(
        plainToInstance(LearningActivityQueryDto, {
          action: 'lesson.completed',
          createdFrom: '2026-01-01T00:00:00.000Z',
          createdTo: '2026-08-01T00:00:00.000Z',
        }),
      );
      expect(errors).toHaveLength(0);
    });
  });
});
