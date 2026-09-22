// FoodWise AI: Enterprise Authentication & Role Management Modal
// Clean, professional institutional credentials login and role switcher

import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Lock,
  Mail,
  Building,
  LogOut,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { UserRole } from '../types.ts';
import { Badge } from './ui/Badge.tsx';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization_id: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onAuthSuccess: (user: AuthUser, token: string) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onLogout
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Kitchen Manager');
  const [organizationName, setOrganizationName] = useState('Campus Central Kitchen #04');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickLogin = async (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: roleEmail, password: rolePass })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }
      localStorage.setItem('foodwise_auth_token', data.token);
      onAuthSuccess(data.user, data.token);
      setSuccessMsg(`Authenticated as ${data.user.name} (${data.user.role})`);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        tab === 'login'
          ? { email, password }
          : { email, password, name, role, organization_name: organizationName };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication error');
      }

      localStorage.setItem('foodwise_auth_token', data.token);
      onAuthSuccess(data.user, data.token);
      setSuccessMsg(tab === 'login' ? 'Signed in successfully' : 'Account created');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('foodwise_auth_token');
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E5E2] rounded-lg w-full max-w-md shadow-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E5E2] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#171717]">Institutional Authentication</h2>
            <p className="text-xs text-[#666666]">Access control and role management</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#666666] hover:bg-[#F0F0EE]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          {currentUser && (
            <div className="p-3 rounded bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-between">
              <div>
                <p className="font-medium text-[#171717]">{currentUser.name}</p>
                <p className="text-[#666666]">{currentUser.email}</p>
                <span className="inline-block mt-1">
                  <Badge variant="verified">{currentUser.role.toUpperCase()}</Badge>
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs border border-[#E5E5E2] bg-white text-[#9B1C1C] hover:bg-[#FDF2F2]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}

          {/* Quick Role Selection Preset */}
          <div>
            <span className="block text-[11px] font-medium uppercase tracking-wider text-[#666666] mb-1.5">
              Quick Role Switch (Enterprise Sandbox)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@foodwise.org', 'Manager123!')}
                className="p-2 rounded border border-[#E5E5E2] bg-[#F7F7F5] hover:bg-[#EAEAE7] text-left transition-colors"
              >
                <span className="block font-medium text-[#171717]">Arjun Rao</span>
                <span className="block text-[11px] text-[#666666]">Kitchen Manager</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('receiver@asha.org', 'Receiver123!')}
                className="p-2 rounded border border-[#E5E5E2] bg-[#F7F7F5] hover:bg-[#EAEAE7] text-left transition-colors"
              >
                <span className="block font-medium text-[#171717]">Dr. Sunita Patel</span>
                <span className="block text-[11px] text-[#666666]">Asha Shelter Receiver</span>
              </button>
            </div>
          </div>

          {/* Login / Register Tab */}
          <div className="pt-2 border-t border-[#E5E5E2]">
            <div className="flex border-b border-[#E5E5E2] mb-3">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`pb-1.5 text-xs font-medium border-b-2 mr-4 transition-colors ${
                  tab === 'login'
                    ? 'border-[#1E3A2B] text-[#1E3A2B]'
                    : 'border-transparent text-[#666666] hover:text-[#171717]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setTab('register')}
                className={`pb-1.5 text-xs font-medium border-b-2 transition-colors ${
                  tab === 'register'
                    ? 'border-[#1E3A2B] text-[#1E3A2B]'
                    : 'border-transparent text-[#666666] hover:text-[#171717]'
                }`}
              >
                Register Staff
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {tab === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                      Role
                    </label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as UserRole)}
                      className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
                    >
                      <option value="Kitchen Manager">Kitchen Manager</option>
                      <option value="Head Chef">Head Chef</option>
                      <option value="Kitchen Staff">Kitchen Staff</option>
                      <option value="Receiver">Receiver / NGO</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
                />
              </div>

              {error && (
                <div className="p-2.5 rounded bg-[#FDF2F2] border border-[#F8B4B4] text-xs text-[#9B1C1C]">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded bg-[#EBF5EE] border border-[#C2E0CC] text-xs text-[#1E5631]">
                  {successMsg}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 rounded text-xs font-medium bg-[#1E3A2B] hover:bg-[#162E22] text-white disabled:opacity-40 transition-colors"
                >
                  {loading ? 'Processing…' : tab === 'login' ? 'Sign in' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
