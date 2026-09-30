import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react';
import { signIn, registerStaff } from '../services/auth.ts';
import type { UserRole } from '../types.ts';
import type { AuthUser } from './AuthModal.tsx';

interface LoginViewProps {
  onSuccess: (user: AuthUser, token: string) => void;
  initialError?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, initialError }) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Kitchen Manager');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = mode === 'signin'
        ? await signIn(email.trim(), password)
        : await registerStaff({ name: name.trim(), email: email.trim(), password, role });
      localStorage.setItem('foodwise_auth_token', response.token);
      onSuccess(response.user, response.token);
      setMessage(mode === 'signin' ? 'Signed in successfully.' : 'Account created successfully.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to authenticate. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_440px] bg-[#f8f8f6] text-[#202821]">
      <section className="hidden lg:flex flex-col justify-between bg-[#f0f3ef] border-r border-[#e3e7e2] p-12 xl:p-16">
        <a href="/" className="inline-flex items-center gap-3 w-fit text-[#1f5c45] no-underline" aria-label="FoodWise home">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f5c45] text-sm font-bold text-white">FW</span>
          <span className="text-sm font-semibold tracking-[0.12em]">FOODWISE</span>
        </a>
        <div className="max-w-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#567361]">Kitchen operations platform</p>
          <h1 className="max-w-lg text-4xl font-semibold leading-tight tracking-[-0.04em]">
            Predict. Reduce. Redistribute.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#647067]">
            Turn today’s verified kitchen records into clearer production decisions for tomorrow.
          </p>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-3 border-t border-[#d8dfd8] pt-5 text-xs text-[#59675d]">
            <span>Capture waste</span>
            <span>Plan production</span>
            <span>Route surplus</span>
          </div>
        </div>
        <p className="text-xs text-[#7a847c]">Smart India Hackathon 2026 · Problem Statement 26234</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[380px]">
          <a href="/" className="mb-10 flex items-center gap-2.5 text-sm font-semibold tracking-[0.12em] text-[#1f5c45] no-underline lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1f5c45] text-xs text-white">FW</span>
            FOODWISE
          </a>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#768078]">Institutional workspace</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
            {mode === 'signin' ? 'Sign in to FoodWise' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-[#69736c]">
            {mode === 'signin'
              ? 'Use your kitchen or organization account to continue.'
              : 'Ask your organization administrator if you need help choosing a role.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'register' && (
              <>
                <label className="block text-sm font-medium">
                  Full name
                  <input
                    required
                    autoComplete="name"
                    value={name}
                    onChange={event => setName(event.target.value)}
                    className="mt-1.5 h-11 w-full rounded-md border border-[#d8ded8] bg-white px-3 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Role
                  <select
                    value={role}
                    onChange={event => setRole(event.target.value as UserRole)}
                    className="mt-1.5 h-11 w-full rounded-md border border-[#d8ded8] bg-white px-3 text-sm"
                  >
                    <option value="Kitchen Manager">Kitchen Manager</option>
                    <option value="Kitchen Staff">Kitchen Staff</option>
                    <option value="Receiver">Receiver</option>
                  </select>
                </label>
              </>
            )}
            <label className="block text-sm font-medium">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-[#d8ded8] bg-white px-3 text-sm"
              />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input
                type="password"
                required
                minLength={mode === 'register' ? 8 : undefined}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-[#d8ded8] bg-white px-3 text-sm"
              />
            </label>

            {mode === 'signin' && (
              <p className="text-right text-xs text-[#6f7972]">
                Forgot your password? Contact your workspace administrator.
              </p>
            )}

            {error && (
              <div role="alert" className="rounded-md border border-[#efc7c1] bg-[#fff5f3] px-3 py-2.5 text-sm text-[#87372b]">
                {error}
              </div>
            )}
            {message && (
              <div role="status" className="flex items-center gap-2 rounded-md border border-[#cfe0d4] bg-[#f1f7f2] px-3 py-2.5 text-sm text-[#285c3e]">
                <CheckCircle2 className="h-4 w-4" /> {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1f5c45] px-4 text-sm font-medium text-white hover:bg-[#194b39] disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <button
            type="button"
            disabled
            title="Google sign-in is not configured for this workspace."
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#d8ded8] bg-white text-sm text-[#7b847d] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LockKeyhole className="h-4 w-4" />
            Google sign-in not configured
          </button>

          <p className="mt-6 text-center text-sm text-[#69736c]">
            {mode === 'signin' ? 'New to this workspace?' : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'register' : 'signin');
                setError(null);
                setMessage(null);
              }}
              className="font-medium text-[#1f5c45] underline-offset-4 hover:underline"
            >
              {mode === 'signin' ? 'Create account' : 'Sign in'}
            </button>
          </p>
          <p className="mt-8 text-center text-xs leading-5 text-[#7a847c]">
            Your data stays within your organization. AI image analysis is advisory and never replaces operator scale verification.
          </p>
        </div>
      </section>
    </main>
  );
};
