'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHECKOUT_STEPS, type CheckoutStepId } from '../types/checkout.types';

interface CheckoutStepperProps {
  currentStep: CheckoutStepId;
}

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  const progressPercent = ((currentStep - 1) / (CHECKOUT_STEPS.length - 1)) * 100;

  return (
    <div className="relative pb-2">
      <div
        className="absolute left-0 right-0 top-4 h-1 rounded-full bg-border"
        aria-hidden="true"
      />
      <div
        className="absolute left-0 top-4 h-1 rounded-full bg-brand transition-all duration-500 ease-out"
        style={{ width: `${progressPercent}%` }}
        aria-hidden="true"
      />
      <ol className="relative flex items-start justify-between">
        {CHECKOUT_STEPS.map((step) => {
          const isComplete = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          return (
            <li
              key={step.id}
              className="flex flex-col items-center gap-2 bg-background px-1.5 text-center"
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
                  isComplete || isCurrent
                    ? 'bg-brand text-brand-foreground shadow-sm'
                    : 'border-2 border-border bg-card text-muted-foreground',
                  isCurrent && 'ring-4 ring-brand/15',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isComplete ? <Check className="size-4" /> : step.id}
              </span>
              <span
                className={cn(
                  'hidden max-w-20 text-[10px] font-bold uppercase tracking-wider sm:block',
                  isComplete || isCurrent ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
