import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Zap, RefreshCw, Key } from '../icons';
import { DeltaHarvestLogo } from '../ui/DeltaHarvestLogo';
import { LegalDisclosuresModal, LegalTab } from '../modals/LegalDisclosuresModal';

import { AuthUser } from '../../types/auth';

interface LoginViewProps {
  onSuccess?: (user?: AuthUser) => void;
}

const STORAGE_REMEMBER_KEY = 'deltaharvest_remember_login_email';

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dedicated Password Reset & Recovery State
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'REQUEST' | 'CONFIRM'>('REQUEST');
  const [resetEmail, setResetEmail] = useState('');
  const [resetUserNote, setResetUserNote] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);

  // Account Request / Inquiry State
  const [isRequestAccessOpen, setIsRequestAccessOpen] = useState(false);
  const [requestAccessSent, setRequestAccessSent] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantNote, setApplicantNote] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState<string | null>(null);
  const [requestErrorMessage, setRequestErrorMessage] = useState<string | null>(null);

  const [requestType, setRequestType] = useState<'NEW_ACCOUNT' | 'PASSWORD_RESET' | 'MAINTENANCE'>('NEW_ACCOUNT');
  const [deliveryDelivered, setDeliveryDelivered] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab | null>(null);

  // Pre-load saved login name if previously selected & check for reset_token query parameter
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(STORAGE_REMEMBER_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Ignore localStorage access errors
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get('reset_token') || params.get('token');
      if (tokenParam && tokenParam.trim()) {
        setResetToken(tokenParam.trim());
        setResetStep('CONFIRM');
        setIsResetPasswordOpen(true);
        // Clean query parameter from URL history without page reload
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  useEffect(() => {
    if (!isRequestAccessOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsRequestAccessOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRequestAccessOpen]);

  useEffect(() => {
    if (!isResetPasswordOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsResetPasswordOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isResetPasswordOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (rememberMe) {
        try {
          localStorage.setItem(STORAGE_REMEMBER_KEY, trimmedEmail);
        } catch {
          // Ignore
        }
      } else {
        try {
          localStorage.removeItem(STORAGE_REMEMBER_KEY);
        } catch {
          // Ignore
        }
      }

      const result = await login({ email: trimmedEmail, password, rememberMe });
      if (result.success) {
        if (onSuccess) {
          onSuccess(result.user);
        } else {
          const isTargetAdmin = result.user?.role === 'ADMIN';
          window.location.href = isTargetAdmin ? '/workflow' : '/dashboard';
        }
      } else {
        setErrorMessage(result.error || 'Invalid credentials or account suspended.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMessage(null);
    setResetSuccessMessage(null);

    if (resetStep === 'REQUEST') {
      const cleanEmail = resetEmail.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setResetErrorMessage('Please enter a valid registered email address.');
        return;
      }

      setIsResettingPassword(true);
      try {
        // 1. Concurrently dispatch administrator inquiry alert (D1, FormSubmit, Discord)
        const inquiryPromise = fetch('/api/admin/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            name: cleanEmail.split('@')[0],
            requestType: 'PASSWORD_RESET',
            note: resetUserNote.trim()
              ? `Account recovery requested for ${cleanEmail}: ${resetUserNote.trim()}`
              : `Password reset requested for ${cleanEmail} from web login portal.`,
          }),
        }).catch(() => null);

        // 2. Also register reset audit trail on backend
        const resetPromise = fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        }).catch(() => null);

        await Promise.all([inquiryPromise, resetPromise]);

        setResetSuccessMessage(
          'Your account recovery request has been logged and transmitted directly to your system administrator (Frank Maresca). Your administrator will verify your account and provide your updated credentials directly. No email tokens are required.'
        );
      } catch {
        setResetErrorMessage('Network error submitting recovery request. Please check your connection.');
      } finally {
        setIsResettingPassword(false);
      }
    } else {
      // Step B: Direct confirmation if an administrative reset token is possessed
      const cleanToken = resetToken.trim();
      if (!cleanToken) {
        setResetErrorMessage('Please enter the administrative reset token.');
        return;
      }
      if (resetNewPassword.length < 8) {
        setResetErrorMessage('New password must be at least 8 characters long.');
        return;
      }
      if (resetNewPassword !== resetConfirmPassword) {
        setResetErrorMessage('New password and confirmation do not match.');
        return;
      }

      setIsResettingPassword(true);
      try {
        const res = await fetch('/api/auth/reset-password/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: cleanToken,
            newPassword: resetNewPassword,
            confirmPassword: resetConfirmPassword,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          setResetSuccessMessage(data.message || 'Password updated successfully! Please sign in with your new credentials.');
          if (resetEmail) {
            setEmail(resetEmail.trim().toLowerCase());
          }
          setPassword('');
          setResetToken('');
          setResetNewPassword('');
          setResetConfirmPassword('');
        } else {
          setResetErrorMessage(data.error || 'Failed to update password. Invalid or expired token.');
        }
      } catch {
        setResetErrorMessage('Network error updating password. Please check your connection.');
      } finally {
        setIsResettingPassword(false);
      }
    }
  };

  const handleRequestAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = applicantEmail.trim();
    if (!cleanEmail) return;

    setIsSendingRequest(true);
    setRequestErrorMessage(null);

    const payload = {
      name: applicantName.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      note: applicantNote.trim(),
      requestType,
    };

    try {
      const resp = await fetch('/api/admin/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.success) {
        setDeliveryDelivered(data.delivered === true);
        setRequestSuccessMessage(data.message || 'Your inquiry has been transmitted to the platform administrator.');
        setRequestAccessSent(true);
      } else if (resp.status === 429) {
        setRequestErrorMessage(data.error || 'Too many submissions. Please wait a minute before trying again.');
      } else {
        setRequestErrorMessage(data.error || 'Unable to submit request at this time. Please contact your administrator.');
      }
    } catch {
      setRequestErrorMessage('Network error submitting inquiry. Please check your connection and try again.');
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <main role="main" className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <header className="mx-auto w-full max-w-md text-center">
        <h1 className="sr-only">DeltaHarvest Institutional - Quantitative Options, Valuation &amp; Volatility Terminal</h1>
        <div className="flex flex-col items-center justify-center mb-4">
          <DeltaHarvestLogo variant="header" layout="vertical" size={52} theme="dark" />
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-medium">
              Multi-Tenant Secure
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-300">
            Options &amp; Equity Analytics Platform
          </p>
        </div>
      </header>

      <div className="mt-6 mx-auto w-full max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/95 py-8 px-6 shadow-2xl shadow-emerald-950/20 rounded-2xl border border-slate-700/60 backdrop-blur-xl sm:px-10 relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {isAuthenticated && user && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Logged in as <strong>{user.email}</strong> ({user.role})</span>
              </div>
              <a
                href="/dashboard"
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
              >
                Go to Workspace
              </a>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in">
                <span className="text-rose-400 font-bold shrink-0">!</span>
                <div>
                  <p className="font-semibold">{errorMessage}</p>
                  <p className="text-[11px] text-rose-300/80 mt-0.5">
                    For password resets or account setups, please contact your administrator.
                  </p>
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email.trim());
                    setResetUserNote('');
                    setResetNewPassword('');
                    setResetConfirmPassword('');
                    setResetErrorMessage(null);
                    setResetSuccessMessage(null);
                    setResetStep('REQUEST');
                    setIsResetPasswordOpen(true);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-10 py-2 bg-slate-950/80 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Security Level */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer accent-emerald-500"
                />
                <span className="text-xs text-slate-300 font-medium">Remember login name</span>
              </label>

              <span className="text-[11px] text-slate-500 font-mono">
                Server-Verified Session
              </span>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-emerald-400/40 rounded-xl shadow-lg shadow-emerald-950/60 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying session...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-emerald-200" />
                    <span>Sign In to DeltaHarvest</span>
                  </>
                )}
              </button>
            </div>

            {/* Institutional Security Notice */}
            <div className="pt-3 border-t border-slate-800/80 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restricted Access • Authenticated Terminal</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                DeltaHarvest is a private institutional analytics environment. Access is granted exclusively via administrator invitation.
              </p>
            </div>
          </form>

          {/* Request Access Callout */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Need new account onboarding or credentials?
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setRequestType('NEW_ACCOUNT');
                  setIsRequestAccessOpen(true);
                }}
                className="w-full py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/60 rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Request New Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Self-Service Password Reset & Administrator Recovery Modal */}
      {isResetPasswordOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-modal-title"
        >
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="reset-password-modal-title" className="text-base font-bold text-white">
                    {resetStep === 'CONFIRM' ? 'Enter Administrative Reset Token' : 'Account Recovery & Password Reset'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    DeltaHarvest Institutional Security • Direct Administrator Recovery
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetPasswordOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-sm"
                title="Close"
              >
                ✕
              </button>
            </div>

            {resetSuccessMessage ? (
              <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs text-center space-y-3.5 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">
                    {resetStep === 'CONFIRM' ? 'Password Updated Successfully!' : 'Recovery Request Dispatched'}
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed mt-1.5">
                    {resetSuccessMessage}
                  </p>
                </div>

                {resetStep === 'REQUEST' && (
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-left font-mono text-[11px] text-slate-300 space-y-1">
                    <div><strong>Account Email:</strong> {resetEmail}</div>
                    <div><strong>Target:</strong> Platform Administrator (Frank Maresca)</div>
                    <div><strong>Action:</strong> Administrator credential verification &amp; reset</div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetPasswordOpen(false);
                      setResetSuccessMessage(null);
                      setResetStep('REQUEST');
                      if (resetEmail) {
                        setEmail(resetEmail.trim().toLowerCase());
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              </div>
            ) : resetStep === 'REQUEST' ? (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    To protect capital and eliminate external email token deliverability failures, DeltaHarvest utilizes verified direct administrator password resets. Submit your registered email below to dispatch an immediate recovery alert.
                  </p>
                </div>

                {resetErrorMessage && (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                    <span className="font-bold shrink-0">!</span>
                    <span>{resetErrorMessage}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="reset-email" className="block text-xs text-slate-300 mb-1 font-semibold">
                    Registered Account Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-note" className="block text-xs text-slate-300 mb-1 font-semibold">
                    Recovery Note / Context (Optional)
                  </label>
                  <textarea
                    id="reset-note"
                    rows={2}
                    value={resetUserNote}
                    onChange={(e) => setResetUserNote(e.target.value)}
                    placeholder="e.g. Lost password, requesting credential update from administrator..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsResetPasswordOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResettingPassword}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isResettingPassword ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Transmitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Submit Recovery Request</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-800 text-center flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep('CONFIRM');
                      setResetErrorMessage(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Have an administrative reset token? Enter token to update password →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetPasswordOpen(false);
                      setRequestType('NEW_ACCOUNT');
                      setApplicantEmail(resetEmail);
                      setIsRequestAccessOpen(true);
                    }}
                    className="text-[11px] text-slate-400 hover:text-teal-300 transition-colors cursor-pointer"
                  >
                    Need new account onboarding or administrator assistance? Contact Admin →
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter the administrative single-use reset token and specify your new password (minimum 8 characters).
                </p>

                {resetErrorMessage && (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                    <span className="font-bold shrink-0">!</span>
                    <span>{resetErrorMessage}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="reset-token" className="block text-xs text-slate-300 mb-1 font-semibold">
                    Administrative Reset Token *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      id="reset-token"
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste 64-character token..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-new-password" className="block text-xs text-slate-300 mb-1 font-semibold">
                    New Password (min. 8 characters) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="reset-new-password"
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-confirm-password" className="block text-xs text-slate-300 mb-1 font-semibold">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="reset-confirm-password"
                      type={showResetConfirm ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(!showResetConfirm)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showResetConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsResetPasswordOpen(false)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResettingPassword}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isResettingPassword ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-800 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep('REQUEST');
                      setResetErrorMessage(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    ← Return to Direct Administrator Recovery Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Access Request / Admin Alert Modal */}
      {isRequestAccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="access-request-modal-title">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
            <h3 id="access-request-modal-title" className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                {requestType === 'PASSWORD_RESET'
                  ? 'Password Reset & Account Recovery'
                  : requestType === 'MAINTENANCE'
                  ? 'Account Maintenance & Support'
                  : 'Client Onboarding & Account Request'}
              </span>
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              DeltaHarvest user credentials and security authorizations are administered directly by your platform administrator. Submit your request below for verification and onboarding.
            </p>

            {/* Request Type Selector Tabs */}
            {!requestAccessSent && (
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-4">
                <button
                  type="button"
                  onClick={() => setRequestType('NEW_ACCOUNT')}
                  className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    requestType === 'NEW_ACCOUNT'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  New Account
                </button>
                <button
                  type="button"
                  onClick={() => setRequestType('PASSWORD_RESET')}
                  className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    requestType === 'PASSWORD_RESET'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Password Reset
                </button>
                <button
                  type="button"
                  onClick={() => setRequestType('MAINTENANCE')}
                  className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    requestType === 'MAINTENANCE'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Maintenance
                </button>
              </div>
            )}

            {requestAccessSent ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs text-center space-y-3 animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-sm text-white">Request Registered & Dispatched</p>
                  <p className="text-slate-300 text-xs leading-relaxed mt-1">
                    {requestSuccessMessage}
                  </p>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-left space-y-1 font-mono text-[11px] text-slate-300">
                  <div><strong>Your Email:</strong> {applicantEmail}</div>
                  <div><strong>Category:</strong> {requestType}</div>
                  <div><strong>Status:</strong> Forwarded to Administrator</div>
                </div>

                <div className="pt-2 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRequestAccessSent(false);
                      setIsRequestAccessOpen(false);
                      setApplicantName('');
                      setApplicantEmail('');
                      setApplicantNote('');
                      setRequestSuccessMessage(null);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestAccessSubmit} className="space-y-3">
                {requestErrorMessage && (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
                    {requestErrorMessage}
                  </div>
                )}
                <div>
                  <label htmlFor="applicant-name" className="block text-xs text-slate-300 mb-1 font-semibold">Your Full Name</label>
                  <input
                    id="applicant-name"
                    name="applicant-name"
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="applicant-email" className="block text-xs text-slate-300 mb-1 font-semibold">
                    {requestType === 'PASSWORD_RESET' ? 'Registered Email Address' : 'Your Email Address'}
                  </label>
                  <input
                    id="applicant-email"
                    name="applicant-email"
                    type="email"
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="applicant-note" className="block text-xs text-slate-300 mb-1 font-semibold">
                    {requestType === 'PASSWORD_RESET'
                      ? 'Reset Note / Context (Optional)'
                      : requestType === 'MAINTENANCE'
                      ? 'Issue or Maintenance Description'
                      : 'Trading Focus / Message (Optional)'}
                  </label>
                  <textarea
                    id="applicant-note"
                    name="applicant-note"
                    rows={2}
                    value={applicantNote}
                    onChange={(e) => setApplicantNote(e.target.value)}
                    placeholder={
                      requestType === 'PASSWORD_RESET'
                        ? 'e.g. Lost access, need password reset for my account...'
                        : requestType === 'MAINTENANCE'
                        ? 'e.g. Update watchlist symbols, API keys, or permissions...'
                        : 'e.g. Options conservative income, Cash-Secured Puts, Schwab integration...'
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestAccessOpen(false)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingRequest}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSendingRequest ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Public Footer with Legal Links & Build Identification */}
      <footer className="mt-8 text-center text-xs text-slate-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
          <button
            type="button"
            onClick={() => setLegalModalTab('TERMS')}
            className="hover:text-slate-200 underline underline-offset-2 cursor-pointer transition-colors"
          >
            Terms of Service
          </button>
          <span className="text-slate-700">•</span>
          <button
            type="button"
            onClick={() => setLegalModalTab('PRIVACY')}
            className="hover:text-slate-200 underline underline-offset-2 cursor-pointer transition-colors"
          >
            Privacy Policy
          </button>
          <span className="text-slate-700">•</span>
          <button
            type="button"
            onClick={() => setLegalModalTab('DISCLAIMER')}
            className="hover:text-slate-200 underline underline-offset-2 cursor-pointer transition-colors"
          >
            Risk Disclaimer
          </button>
        </div>
        <p className="text-[11px] text-slate-600 flex flex-wrap items-center justify-center gap-2">
          <span>&copy; {new Date().getFullYear()} DeltaHarvest Institutional. All rights reserved. &bull;</span>
          <span className="inline-flex items-center gap-1.5 font-mono">
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold tracking-wider">
              {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'v3.4'}
            </span>
            <span className="text-slate-500">
              {typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'v3.4-prod'}
            </span>
          </span>
        </p>
      </footer>

      {/* Institutional Legal & Regulatory Modal */}
      {legalModalTab !== null && (
        <LegalDisclosuresModal
          isOpen={legalModalTab !== null}
          onClose={() => setLegalModalTab(null)}
          initialTab={legalModalTab || 'TERMS'}
        />
      )}
    </main>
  );
};
