'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/api/api-error';
import { cn } from '@/lib/utils';
import { newsletterApi } from '@/features/newsletter/api/newsletter.api';

const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Please enter a valid email address.')
    .email('Please enter a valid email address.'),
});

type NewsletterInput = z.infer<typeof newsletterSchema>;

export function NewsletterForm({ className }: { className?: string }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterInput>({ resolver: zodResolver(newsletterSchema) });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await newsletterApi.subscribe(data.email.trim());
      if (response.status === 'already_subscribed') {
        toast.info('Already subscribed', response.message);
      } else {
        toast.success("You're subscribed!", response.message);
        reset();
      }
    } catch (error) {
      toast.error(
        'Unable to subscribe',
        extractErrorMessage(error, 'Unable to subscribe right now. Please try again.'),
      );
    }
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
          disabled={isSubmitting}
          {...register('email')}
        />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="shrink-0">
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Subscribing...
          </>
        ) : (
          <>
            <Send className="size-4" />
            Subscribe
          </>
        )}
      </Button>
    </form>
  );
}
