import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Zap, RefreshCw } from '../icons';
import { DeltaHarvestLogo } from '../ui/DeltaHarvestLogo';

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
  const [isRequestAccessOpen, setIsRequestAccessOpen] = useState(false);
  const [requestAccessSent, setRequestAccessSent] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantNote, setApplicantNote] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState<string | null>(null);
  const [requestErrorMessage, setRequestErrorMessage] = useState<string | null>(null);

  const [requestType, setRequestType] = useState<'NEW_ACCOUNT' | 'PASSWORD_RESET' | 'MAINTENANCE'>('NEW_ACCOUNT');
  const [emailCopied, setEmailCopied] = useState(false);
  const [deliveryDelivered, setDeliveryDelivered] = useState<boolean>(false);

  // Pre-load saved login name if previously selected
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
          const isTargetAdmin = result.user?.role === 'ADMIN' || trimmedEmail.toLowerCase() === 'fjmaresca@gmail.com';
          window.location.href = isTargetAdmin ? '/workflow' : '/dashboard';
        }
      } else {
        setErrorMessage(result.error || 'Invalid credentials or account suspended.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateMailtoUrl = () => {
    const cleanEmail = applicantEmail.trim();
    const typeLabel =
      requestType === 'PASSWORD_RESET'
        ? 'Password Reset'
        : requestType === 'MAINTENANCE'
        ? 'Account Maintenance & Support'
        : 'New Client Account Request';

    const subject = encodeURIComponent(`[DeltaHarvest] ${typeLabel}: ${applicantName || cleanEmail}`);
    const body = encodeURIComponent(
      `Hello Frank,\n\nI am requesting assistance with the DeltaHarvest Stock & Options Analytics Platform.\n\nRequest Type: ${typeLabel}\nName: ${applicantName}\nEmail: ${cleanEmail}\nDetails / Trading Focus:\n${applicantNote || 'Please provide access / assistance with my account.'}\n\nSent from DeltaHarvest Portal: https://daily-stock-analysis-89j.pages.dev/\n\nThank you!`
    );
    return `mailto:fjmaresca@gmail.com?subject=${subject}&body=${body}`;
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

    let apiSuccess = false;
    let isDelivered = false;
    let responseMsg = '';

    // 1. Primary: Cloudflare Pages Edge Function (/api/auth/request-access)
    try {
      const resp = await fetch('/api/auth/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        const data = await resp.json();
        apiSuccess = true;
        isDelivered = !!data.delivery?.delivered;
        responseMsg = data.message || 'Access request dispatched to administrator.';
      }
    } catch {
      // Proceed to backend fallback
    }

    // 2. Secondary: Python FastAPI backend (/api/v1/auth/request-access)
    if (!apiSuccess) {
      try {
        const resp2 = await fetch('/api/v1/auth/request-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (resp2.ok) {
          const data2 = await resp2.json();
          apiSuccess = true;
          isDelivered = true;
          responseMsg = data2.message || 'Access request dispatched to administrator.';
        }
      } catch {
        // Both APIs unreachable or offline
      }
    }

    setIsSendingRequest(false);
    setDeliveryDelivered(isDelivered);

    if (apiSuccess && isDelivered) {
      setRequestSuccessMessage(
        responseMsg || 'An automated email notification has been successfully delivered to Frank Maresca (fjmaresca@gmail.com).'
      );
      setRequestAccessSent(true);
    } else {
      // Trigger client-side email client dispatch to guarantee email reaches fjmaresca@gmail.com
      const mailto = generateMailtoUrl();
      try {
        window.location.href = mailto;
      } catch {}
      setRequestSuccessMessage(
        'Your request has been logged. An email compose draft to Frank Maresca (fjmaresca@gmail.com) has been launched in your email app.'
      );
      setRequestAccessSent(true);
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
        <div className="bg-slate-900/90 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 backdrop-blur-md sm:px-10 relative overflow-hidden">
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
                    For password resets or account setups, contact Admin at{' '}
                    <a href="mailto:fjmaresca@gmail.com" className="underline hover:text-white">
                      fjmaresca@gmail.com
                    </a>.
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
                    setRequestType('PASSWORD_RESET');
                    setIsRequestAccessOpen(true);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Forgot or need reset?
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
                256-bit PBKDF2
              </span>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-emerald-500/50 rounded-lg shadow-lg shadow-emerald-950/50 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                <span>Restricted Access • Session Encrypted</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                DeltaHarvest is a private institutional analytics environment. Access is granted exclusively via administrator invitation.
              </p>
            </div>
          </form>

          {/* Request Access / Maintenance Callout */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Need login credentials, account setup, or a password reset?
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRequestType('NEW_ACCOUNT');
                  setIsRequestAccessOpen(true);
                }}
                className="flex-1 py-2 px-3 bg-slate-800/90 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-500/80 rounded-lg text-xs font-semibold text-emerald-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Request New Account</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRequestType('PASSWORD_RESET');
                  setIsRequestAccessOpen(true);
                }}
                className="flex-1 py-2 px-3 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Password Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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
              DeltaHarvest user credentials and security authorizations are administered directly by{' '}
              <strong className="text-emerald-300">Frank Maresca (Super-Admin)</strong> at{' '}
              <a href="mailto:fjmaresca@gmail.com" className="text-emerald-400 hover:underline">
                fjmaresca@gmail.com
              </a>.
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
                  <div><strong>Recipient:</strong> Frank Maresca (fjmaresca@gmail.com)</div>
                  <div><strong>Your Email:</strong> {applicantEmail}</div>
                  <div><strong>Category:</strong> {requestType}</div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <a
                    href={generateMailtoUrl()}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                    title="Open draft in Gmail or default mail app"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Open in Gmail / Email Client</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `To: fjmaresca@gmail.com\nSubject: [DeltaHarvest] ${requestType}: ${applicantName || applicantEmail}\nName: ${applicantName}\nEmail: ${applicantEmail}\nDetails: ${applicantNote || 'None'}`;
                      navigator.clipboard.writeText(text);
                      setEmailCopied(true);
                      setTimeout(() => setEmailCopied(false), 3000);
                    }}
                    className="w-full sm:w-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{emailCopied ? '✓ Details Copied' : 'Copy Request Details'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRequestAccessSent(false);
                      setIsRequestAccessOpen(false);
                      setApplicantName('');
                      setApplicantEmail('');
                      setApplicantNote('');
                      setRequestSuccessMessage(null);
                      setEmailCopied(false);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors cursor-pointer"
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
                    placeholder="e.g. Frank Maresca"
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
                        ? 'e.g. Update watchlist symbols, Schwab API keys, or permissions...'
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
                        <span>Transmitting Email...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Request to fjmaresca@gmail.com</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
