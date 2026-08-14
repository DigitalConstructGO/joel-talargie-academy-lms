import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import type {
  CreatePaymentMethodDto,
  ListPaymentMethodsDto,
  UpdatePaymentMethodDto,
} from '../dto/payment-methods.dto';
import {
  PaymentMethodsRepository,
  type PaymentMethodInput,
} from '../repositories/payment-methods.repository';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly repository: PaymentMethodsRepository) {}

  list(query: ListPaymentMethodsDto) {
    return this.repository.list(query);
  }

  /** Public, active-only list for students - never includes `config`. */
  listActive() {
    return this.repository.activePublic();
  }

  async detail(id: string) {
    const method = await this.repository.detail(id);
    if (!method)
      throw new NotFoundException({
        code: 'PAYMENT_METHOD_NOT_FOUND',
        message: 'Payment method not found',
      });
    return method;
  }

  /** Admin-safe single lookup (with `config`). */
  adminDetail(id: string) {
    return this.detail(id);
  }

  async create(actor: AuthUser, dto: CreatePaymentMethodDto) {
    if (!actor.emailVerified)
      throw new UnprocessableEntityException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'A verified email is required',
      });
    const existing = await this.repository.findByCode(dto.code);
    if (existing)
      throw new ConflictException({
        code: 'PAYMENT_METHOD_CODE_EXISTS',
        message: 'A payment method with this code already exists',
      });
    const input: PaymentMethodInput = {
      code: dto.code,
      name: dto.name,
      description: dto.description?.trim() || null,
      type: dto.type,
      instructions: dto.instructions ?? {},
      config: dto.config ?? {},
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
    };
    const [method] = await this.repository.create(actor.id, input);
    return method;
  }

  async update(id: string, dto: UpdatePaymentMethodDto) {
    await this.detail(id);
    const input: Partial<PaymentMethodInput> = {};
    if (dto.name !== undefined) input.name = dto.name;
    if (dto.description !== undefined) input.description = dto.description.trim() || null;
    if (dto.type !== undefined) input.type = dto.type;
    if (dto.instructions !== undefined) input.instructions = dto.instructions;
    if (dto.config !== undefined) input.config = dto.config;
    if (dto.sortOrder !== undefined) input.sortOrder = dto.sortOrder;
    if (!Object.keys(input).length)
      throw new BadRequestException({
        code: 'PAYMENT_METHOD_NO_FIELDS',
        message: 'No fields were provided to update',
      });
    const [method] = await this.repository.update(id, input);
    return method;
  }

  async setActive(id: string, isActive: boolean) {
    await this.detail(id);
    const [method] = await this.repository.setActive(id, isActive);
    return method;
  }

  async remove(id: string) {
    await this.detail(id);
    const references = await this.repository.referencedPaymentCount(id);
    if (references > 0)
      throw new ConflictException({
        code: 'PAYMENT_METHOD_IN_USE',
        message:
          'This payment method is referenced by existing payments and cannot be deleted. Deactivate it instead.',
      });
    await this.repository.delete(id);
    return { deleted: true };
  }

  /** Validates that a method exists and is active - used by payment submission. */
  async requireActiveById(id: string) {
    const method = await this.repository.activeById(id);
    if (!method)
      throw new UnprocessableEntityException({
        code: 'PAYMENT_METHOD_UNAVAILABLE',
        message: 'The selected payment method is not available',
      });
    return method;
  }

  private map(error: unknown): never {
    const value = String(error);
    if (value.includes('NOT_FOUND'))
      throw new NotFoundException({
        code: 'PAYMENT_METHOD_NOT_FOUND',
        message: 'Payment method not found',
      });
    if (value.includes('CODE_EXISTS'))
      throw new ConflictException({
        code: 'PAYMENT_METHOD_CODE_EXISTS',
        message: 'A payment method with this code already exists',
      });
    if (value.includes('IN_USE'))
      throw new ConflictException({
        code: 'PAYMENT_METHOD_IN_USE',
        message: 'Payment method is referenced by payments and cannot be deleted',
      });
    if (value.includes('UNAVAILABLE'))
      throw new UnprocessableEntityException({
        code: 'PAYMENT_METHOD_UNAVAILABLE',
        message: 'The selected payment method is not available',
      });
    throw error;
  }
}
