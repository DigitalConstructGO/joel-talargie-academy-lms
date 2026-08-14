export type PaymentMethodType = 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';

/** Public display info shown at checkout. `config` is never exposed to students. */
export interface PaymentMethodInstructions {
  tagline?: string;
  tips?: string[];
  securityNotice?: string;
  transactionIdLabel?: string;
  transactionIdPlaceholder?: string;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: PaymentMethodType;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Admin-safe shape - includes the secret `config` block. */
export interface AdminPaymentMethod extends PaymentMethod {
  instructions: PaymentMethodInstructions;
  config: Record<string, unknown>;
  createdBy: string | null;
}

export interface PaymentMethodListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: PaymentMethodType;
  isActive?: boolean;
  sort?: string;
}

export interface PaymentMethodListResult {
  items: AdminPaymentMethod[];
  total: number;
}

export interface CreatePaymentMethodInput {
  code: string;
  name: string;
  description?: string;
  type: PaymentMethodType;
  instructions?: PaymentMethodInstructions;
  config?: Record<string, unknown>;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePaymentMethodInput {
  name?: string;
  description?: string;
  type?: PaymentMethodType;
  instructions?: PaymentMethodInstructions;
  config?: Record<string, unknown>;
  sortOrder?: number;
}
