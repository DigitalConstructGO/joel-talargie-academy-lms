import { MOCK_PAYMENT_METHODS } from './mock-payment-methods.data';
import type {
  AdminPaymentMethod,
  CreatePaymentMethodInput,
  PaymentMethodListParams,
  PaymentMethodListResult,
  UpdatePaymentMethodInput,
} from '../types/payment-method.types';

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

const store: AdminPaymentMethod[] = MOCK_PAYMENT_METHODS.map((method) => ({
  ...method,
  instructions: { ...method.instructions },
  config: { ...method.config },
}));

export const mockPaymentMethodsApi = {
  list: async (params: PaymentMethodListParams = {}): Promise<PaymentMethodListResult> => {
    let filtered = store.filter((method) => {
      if (params.type && method.type !== params.type) return false;
      if (params.isActive !== undefined && method.isActive !== params.isActive) return false;
      if (params.search) {
        const needle = params.search.toLowerCase();
        if (
          !method.name.toLowerCase().includes(needle) &&
          !method.code.toLowerCase().includes(needle)
        )
          return false;
      }
      return true;
    });
    if (params.sort) {
      const [field, direction] = params.sort.split(':') as [
        'name' | 'sortOrder' | 'createdAt',
        'asc' | 'desc',
      ];
      const sign = direction === 'asc' ? 1 : -1;
      filtered = [...filtered].sort((a, b) => {
        if (field === 'sortOrder') return (a.sortOrder - b.sortOrder) * sign;
        if (field === 'createdAt') return a.createdAt.localeCompare(b.createdAt) * sign;
        return a.name.localeCompare(b.name) * sign;
      });
    } else {
      filtered = [...filtered].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay({ items: filtered.slice(start, start + pageSize), total: filtered.length });
  },

  detail: async (id: string): Promise<AdminPaymentMethod> => {
    const method = store.find((entry) => entry.id === id);
    if (!method) notFound('Payment method not found');
    return delay({
      ...method,
      instructions: { ...method.instructions },
      config: { ...method.config },
    });
  },

  create: async (input: CreatePaymentMethodInput): Promise<AdminPaymentMethod> => {
    const existing = store.find((entry) => entry.code === input.code.toUpperCase());
    if (existing) {
      const error = new Error('A payment method with this code already exists') as Error & {
        response?: { status: number };
      };
      error.response = { status: 409 };
      throw error;
    }
    const now = new Date().toISOString();
    const method: AdminPaymentMethod = {
      id: `method-${Date.now()}`,
      code: input.code.toUpperCase(),
      name: input.name,
      description: input.description?.trim() || null,
      type: input.type,
      instructions: input.instructions ?? {},
      config: input.config ?? {},
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
      createdBy: null,
      createdAt: now,
      updatedAt: now,
    };
    store.push(method);
    return delay(method);
  },

  update: async (id: string, input: UpdatePaymentMethodInput): Promise<AdminPaymentMethod> => {
    const method = store.find((entry) => entry.id === id);
    if (!method) notFound('Payment method not found');
    if (input.name !== undefined) method.name = input.name;
    if (input.description !== undefined) method.description = input.description?.trim() || null;
    if (input.type !== undefined) method.type = input.type;
    if (input.instructions !== undefined) method.instructions = input.instructions;
    if (input.config !== undefined) method.config = input.config;
    if (input.sortOrder !== undefined) method.sortOrder = input.sortOrder;
    method.updatedAt = new Date().toISOString();
    return delay(method);
  },

  setActive: async (id: string, isActive: boolean): Promise<AdminPaymentMethod> => {
    const method = store.find((entry) => entry.id === id);
    if (!method) notFound('Payment method not found');
    method.isActive = isActive;
    method.updatedAt = new Date().toISOString();
    return delay(method);
  },

  remove: async (id: string): Promise<{ deleted: true }> => {
    const index = store.findIndex((entry) => entry.id === id);
    if (index === -1) notFound('Payment method not found');
    store.splice(index, 1);
    return delay({ deleted: true });
  },
};
