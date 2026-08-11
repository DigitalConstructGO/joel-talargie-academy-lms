'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const newsletterSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type NewsletterInput = z.infer<typeof newsletterSchema>;

export function NewsletterForm({ className }: { className?: string }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterInput>({ resolver: zodResolver(newsletterSchema) });

  const onSubmit = handleSubmit(async () => {
    // No newsletter subscription endpoint exists on the backend yet -
    // acknowledge the signup honestly instead of faking a stored subscription.
    await new Promise((resolve) => setTimeout(resolve, 400));
    toast.info(
      'Newsletter signup coming soon',
      "We're not accepting subscriptions yet, but thanks for the interest!",
    );
    reset();
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn('flex flex-col gap-2 sm:flex-row', className)}
    >
      <div className="flex-1">
        <Input
          type="email"
          placeholder="you@example.com"
          aria-label="Email address"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="shrink-0">
        <Send className="size-4" />
        Subscribe
      </Button>
    </form>
  );
}
