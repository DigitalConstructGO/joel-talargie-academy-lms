'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, KeyRound, Lock, Mail, User } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth.store';
import { GoogleLoginButton } from './google-login-button';
import { authClient, unwrap } from '@/lib/api/auth-client';
import { extractErrorMessage, extractFieldErrors } from '@/lib/api/api-error';
import { ROUTES } from '@/constants/routes';
import { siteConfig } from '@/config/site.config';
import { isSafeRedirectPath, resolvePostLoginRedirect } from '@/lib/authorization/redirect';
import { toast } from '@/lib/toast';
const strong = z
  .string()
  .min(8)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/\d/)
  .regex(/[^A-Za-z\d]/);
const schemas = {
  login: z.object({
    email: z.email(),
    password: z.string().min(1),
    rememberMe: z.boolean().optional(),
  }),
  register: z
    .object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.email(),
      password: strong,
      confirmPassword: z.string(),
    })
    .refine((v) => v.password === v.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    }),
  forgot: z.object({ email: z.email() }),
  reset: z
    .object({ token: z.string().min(20), password: strong, confirmPassword: z.string() })
    .refine((v) => v.password === v.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    }),
  verify: z.object({ token: z.string().min(20) }),
};
type Kind = keyof typeof schemas;
type Values = Record<string, string | boolean>;
const fields: Record<Kind, string[]> = {
  login: ['email', 'password'],
  register: ['firstName', 'lastName', 'email', 'password', 'confirmPassword'],
  forgot: ['email'],
  reset: ['token', 'password', 'confirmPassword'],
  verify: ['token'],
};
const fieldIcons: Record<string, typeof Mail> = {
  email: Mail,
  password: Lock,
  confirmPassword: Lock,
  token: KeyRound,
  firstName: User,
  lastName: User,
};
const copy: Record<Kind, [string, string]> = {
  login: ['Welcome Back', `Sign in to ${siteConfig.name}`],
  register: ['Create your account', `Join ${siteConfig.name}`],
  forgot: ['Forgot password?', 'Request secure reset instructions'],
  reset: ['Reset password', 'Choose a new secure password'],
  verify: ['Verify your email', 'Activate your academy account'],
};
const submitLoadingText: Record<Kind, string> = {
  login: 'Signing in...',
  register: 'Creating account...',
  forgot: 'Sending...',
  reset: 'Resetting...',
  verify: 'Verifying...',
};
export function AuthForm({ kind }: { kind: Kind }) {
  const router = useRouter();
  const search = useSearchParams();
  const store = useAuthStore();
  const [title, subtitle] = copy[kind];
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const redirectParam = search.get('redirect');
  const redirectQuery = isSafeRedirectPath(redirectParam)
    ? `?redirect=${encodeURIComponent(redirectParam)}`
    : '';
  const form = useForm<Values>({
    resolver: zodResolver(schemas[kind]) as unknown as Resolver<Values>,
    defaultValues: {
      token: search.get('token') ?? '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      rememberMe: false,
    },
  });
  const submit = form.handleSubmit(async (values) => {
    setSuccessMessage(null);
    form.clearErrors('root');
    try {
      if (kind === 'login') {
        await store.login({
          email: String(values.email ?? ''),
          password: String(values.password ?? ''),
        });
        // Default lands on `/` - a preserved `?redirect=` (set by
        // middleware.ts when this visitor was bounced here from a
        // protected route) wins if present and safe, re-validated against
        // the account's actual area once `user.roles` is known.
        const { user } = useAuthStore.getState();
        router.replace(resolvePostLoginRedirect(search.get('redirect'), user?.roles ?? []));
        return;
      }
      if (kind === 'register') {
        await store.register({
          firstName: String(values.firstName ?? ''),
          lastName: String(values.lastName ?? ''),
          email: String(values.email ?? ''),
          password: String(values.password ?? ''),
          confirmPassword: String(values.confirmPassword ?? ''),
        });
        // Registration doesn't log the user in (email verification comes
        // first) - carry the redirect target forward through verify-email
        // so it survives to reach login, which already honors it.
        router.push(`${ROUTES.auth.verifyEmail}${redirectQuery}`);
        return;
      }
      const endpoint =
        kind === 'forgot'
          ? 'forgot-password'
          : kind === 'reset'
            ? 'reset-password'
            : 'verify-email';
      const result = unwrap<{ message: string }>(
        await authClient.post(`/auth/${endpoint}`, values),
      );
      if (kind === 'reset' || kind === 'verify') {
        // Password reset / email verification both leave the account ready
        // to sign in - send them straight to login rather than stranding
        // them on a form with no more fields to submit. The success
        // message is surfaced as a toast (not the inline box below) since
        // this page is about to be replaced.
        toast.success(result.message);
        router.push(`${ROUTES.auth.login}${redirectQuery}`);
        return;
      }
      setSuccessMessage(result.message);
    } catch (error) {
      const fieldErrors = extractFieldErrors(error);
      if (fieldErrors.length > 0) {
        for (const { field, message } of fieldErrors) {
          form.setError(field, { message });
        }
      } else {
        form.setError('root', { message: extractErrorMessage(error, 'Request failed') });
      }
    }
  });
  const has = (name: string) => fields[kind].includes(name);
  const isSocial = kind === 'login' || kind === 'register';
  return (
    <div>
      <h2 className="text-center text-2xl font-bold text-foreground">{title}</h2>
      <p className="mt-1.5 text-center text-sm text-muted-foreground">{subtitle}</p>
      {isSocial && (
        <div className="mt-8">
          <GoogleLoginButton redirectTo={search.get('redirect')} />
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            Or continue with
            <span className="h-px flex-1 bg-border" />
          </div>
        </div>
      )}
      <form className={isSocial ? 'space-y-4' : 'mt-8 space-y-4'} onSubmit={submit}>
        {has('firstName') && (
          <div className="grid grid-cols-2 gap-3">
            <Field name="firstName" label="First name" form={form} />
            <Field name="lastName" label="Last name" form={form} />
          </div>
        )}
        {has('email') && (
          <Field
            name="email"
            label="Email Address"
            type="email"
            placeholder="student@example.com"
            form={form}
          />
        )}
        {has('password') && (
          <Field
            name="password"
            label={kind === 'reset' ? 'New password' : 'Password'}
            type="password"
            form={form}
            labelExtra={
              kind === 'login' && (
                <Link
                  href={ROUTES.auth.forgotPassword}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Forgot Password?
                </Link>
              )
            }
          />
        )}
        {has('confirmPassword') && (
          <Field name="confirmPassword" label="Confirm password" type="password" form={form} />
        )}
        {has('token') && <Field name="token" label="Secure token" form={form} />}
        {kind === 'login' && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="rememberMe"
              checked={Boolean(form.watch('rememberMe'))}
              onCheckedChange={(checked) => form.setValue('rememberMe', checked === true)}
            />
            <Label htmlFor="rememberMe" className="text-sm font-normal text-muted-foreground">
              Remember me for 30 days
            </Label>
          </div>
        )}
        {successMessage && (
          <p className="rounded-lg bg-success/10 p-3 text-sm text-success">{successMessage}</p>
        )}
        {form.formState.errors.root?.message && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        <LoadingButton
          type="submit"
          className="w-full"
          loading={form.formState.isSubmitting}
          loadingText={submitLoadingText[kind]}
        >
          {title === 'Welcome Back' ? 'Sign In' : title}
        </LoadingButton>
      </form>
      <div className="mt-6 text-center text-sm">
        {kind === 'login' ? (
          <p className="text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href={`${ROUTES.auth.register}${redirectQuery}`}
              className="font-medium text-brand hover:underline"
            >
              Create an Account
            </Link>
          </p>
        ) : (
          <Link
            href={`${ROUTES.auth.login}${redirectQuery}`}
            className="font-medium text-brand hover:underline"
          >
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
function Field({
  name,
  label,
  type = 'text',
  placeholder,
  form,
  labelExtra,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  form: ReturnType<typeof useForm<Values>>;
  labelExtra?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const error = form.formState.errors[name]?.message;
  const Icon = fieldIcons[name];
  const isPassword = type === 'password';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={name}>{label}</Label>
        {labelExtra}
      </div>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        )}
        <Input
          id={name}
          type={isPassword && visible ? 'text' : type}
          placeholder={placeholder}
          className={Icon ? (isPassword ? 'pl-9 pr-9' : 'pl-9') : undefined}
          {...form.register(name)}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{String(error)}</p>}
    </div>
  );
}
