'use client';

import { useMutation } from '@tanstack/react-query';
import { promotionsApi } from '../api/promotions.api';
import type { ValidateCouponInput } from '../types/promotion.types';

export function useValidateCoupon() {
  return useMutation({
    mutationFn: (input: ValidateCouponInput) => promotionsApi.validate(input),
  });
}

export function useRedeemCoupon() {
  return useMutation({
    mutationFn: (input: ValidateCouponInput) => promotionsApi.redeem(input),
  });
}
