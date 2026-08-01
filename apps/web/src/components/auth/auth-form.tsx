'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth.store';
import { GoogleLoginButton } from './google-login-button';
import { authClient, unwrap } from '@/lib/api/auth-client';
const strong = z
  .string()
  .min(8)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/\d/)
  .regex(/[^A-Za-z\d]/);
const schemas = {
  login: z.object({ email: z.email(), password: z.string().min(1) }),
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
type Values = Record<string, string>;
const fields: Record<Kind, string[]> = {
  login: ['email', 'password'],
  register: ['firstName', 'lastName', 'email', 'password', 'confirmPassword'],
  forgot: ['email'],
  reset: ['token', 'password', 'confirmPassword'],
  verify: ['token'],
};
const copy: Record<Kind, [string, string]> = {
  login: ['Welcome back', 'Sign in to continue learning'],
  register: ['Create your account', 'Join Joel Talargie Academy'],
  forgot: ['Forgot password?', 'Request secure reset instructions'],
  reset: ['Reset password', 'Choose a new secure password'],
  verify: ['Verify your email', 'Activate your academy account'],
};
export function AuthForm({ kind }: { kind: Kind }) {
  const router = useRouter();
  const search = useSearchParams();
  const store = useAuthStore();
  const [title, subtitle] = copy[kind];
  const form = useForm<Values>({
    resolver: zodResolver(schemas[kind]) as unknown as Resolver<Values>,
    defaultValues: {
      token: search.get('token') ?? '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  });
  const submit = form.handleSubmit(async (values) => {
    try {
      if (kind === 'login') {
        await store.login({ email: values.email ?? '', password: values.password ?? '' });
        router.replace('/dashboard');
        return;
      }
      if (kind === 'register') {
        await store.register({
          firstName: values.firstName ?? '',
          lastName: values.lastName ?? '',
          email: values.email ?? '',
          password: values.password ?? '',
          confirmPassword: values.confirmPassword ?? '',
        });
        router.push('/auth/verify-email');
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
      form.setError('root', { message: result.message });
    } catch {
      form.setError('root', { message: store.error ?? 'Request failed' });
    }
  });
  const has = (name: string) => fields[kind].includes(name);
  return (
    <div>
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
      {(kind === 'login' || kind === 'register') && (
        <div className="mt-8">
          <GoogleLoginButton />
          <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-800" />
            OR
            <span className="h-px flex-1 bg-slate-800" />
          </div>
        </div>
      )}
      <form
        className={kind === 'login' || kind === 'register' ? 'space-y-4' : 'mt-8 space-y-4'}
        onSubmit={submit}
      >
        {has('firstName') && (
          <div className="grid grid-cols-2 gap-3">
            <Field name="firstName" label="First name" form={form} />
            <Field name="lastName" label="Last name" form={form} />
          </div>
        )}
        {has('email') && <Field name="email" label="Email address" type="email" form={form} />}{' '}
        {has('password') && (
          <Field
            name="password"
            label={kind === 'reset' ? 'New password' : 'Password'}
            type="password"
            form={form}
          />
        )}{' '}
        {has('confirmPassword') && (
          <Field name="confirmPassword" label="Confirm password" type="password" form={form} />
        )}{' '}
        {has('token') && <Field name="token" label="Secure token" form={form} />}{' '}
        {form.formState.errors.root?.message && (
          <p className="rounded-md bg-slate-800 p-3 text-sm text-blue-200">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Please wait...' : title}
        </Button>
      </form>
      <div className="mt-6 flex justify-between text-sm text-blue-400">
        {kind === 'login' ? (
          <>
            <Link href="/auth/register">Create account</Link>
            <Link href="/auth/forgot-password">Forgot password?</Link>
          </>
        ) : (
          <Link href="/auth/login">Back to sign in</Link>
        )}
      </div>
    </div>
  );
}
function Field({
  name,
  label,
  type = 'text',
  form,
}: {
  name: string;
  label: string;
  type?: string;
  form: ReturnType<typeof useForm<Values>>;
}) {
  const error = form.formState.errors[name]?.message;
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} {...form.register(name)} />
      {error && <p className="text-xs text-red-400">{String(error)}</p>}
    </div>
  );
}
