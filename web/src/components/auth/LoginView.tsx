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
    };

    let apiSuccess = false;
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
          responseMsg = data2.message || 'Access request dispatched to administrator.';
        }
      } catch {
        // Both APIs unreachable or offline
      }
    }

    setIsSendingRequest(false);

    if (apiSuccess) {
      setRequestSuccessMessage(
        responseMsg || 'An automated email notification has been dispatched to Frank Maresca (fjmaresca@gmail.com).'
      );
      setRequestAccessSent(true);
    } else {
      // Fail-safe client-side mailto dispatch if APIs are unreachable
      const subject = encodeURIComponent(`DeltaHarvest Client Access Request: ${applicantName || cleanEmail}`);
      const body = encodeURIComponent(
        `Hello Frank,\n\nI am requesting client tenant access to DeltaHarvest Stock & Options Analytics.\n\nName: ${applicantName}\nEmail: ${cleanEmail}\nNotes / Trading Focus: ${applicantNote || 'Options and equity analytics'}\n\nThank you!`
      );
      window.location.href = `mailto:fjmaresca@gmail.com?subject=${subject}&body=${body}`;
      setRequestSuccessMessage('Draft opened in your email client to alert Frank Maresca (fjmaresca@gmail.com).');
      setRequestAccessSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="flex flex-col items-center justify-center mb-4">
          <DeltaHarvestLogo variant="header" layout="vertical" size={52} />
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-medium">
              Multi-Tenant Secure
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-400">
            Options & Equity Analytics Platform
          </p>
        </div>
      </div>

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
                  onClick={() => setIsRequestAccessOpen(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot or need setup?
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
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Login Name Checkbox */}
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

              <span className="text-[11px] text-slate-500 font-mono">256-bit PBKDF2</span>
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

          {/* Request Access Callout */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Need login credentials or seeking client access?
            </p>
            <button
              type="button"
              onClick={() => setIsRequestAccessOpen(true)}
              className="mt-2.5 w-full py-2 px-3 bg-slate-800/90 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-500/80 rounded-lg text-xs font-semibold text-emerald-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Request Login Privileges from Administrator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Access Request / Admin Alert Modal */}
      {isRequestAccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>DeltaHarvest Client Onboarding</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              DeltaHarvest is a secure multi-tenant trading analytics system. Accounts are provisioned and administered directly by{' '}
              <strong className="text-emerald-300">Frank Maresca (Admin)</strong>.
            </p>

            {requestAccessSent ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs text-center space-y-2.5 animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm text-white">Access Request Dispatched</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {requestSuccessMessage || (
                    <>
                      An automated notification email has been transmitted to Super-Administrator Frank Maresca (
                      <strong className="text-emerald-300">fjmaresca@gmail.com</strong>).
                    </>
                  )}
                </p>
                <p className="text-[11px] text-slate-400">
                  Once your tenant account is provisioned, you will receive confirmation and your temporary credentials at{' '}
                  <strong className="text-white font-mono">{applicantEmail}</strong>.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <a
                    href={`mailto:fjmaresca@gmail.com?subject=${encodeURIComponent(
                      `DeltaHarvest Access Request: ${applicantName || applicantEmail}`
                    )}&body=${encodeURIComponent(
                      `Hello Frank,\n\nFollowing up on my access request for DeltaHarvest:\n\nName: ${applicantName}\nEmail: ${applicantEmail}\nTrading Focus: ${applicantNote || 'Options & equity analytics'}\n\nThank you!`
                    )}`}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
                    title="Send a supplemental direct email from your local mail app"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Open in Mail App</span>
                  </a>
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
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer"
                  >
                    Done
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
                  <label className="block text-xs text-slate-300 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Your Email</label>
                  <input
                    type="email"
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Trading Focus / Message (Optional)</label>
                  <textarea
                    rows={2}
                    value={applicantNote}
                    onChange={(e) => setApplicantNote(e.target.value)}
                    placeholder="e.g. Cash-Secured Puts, Covered Calls, Schwab integration..."
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestAccessOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingRequest}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSendingRequest ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Transmitting Alert...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Alert to Admin</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
