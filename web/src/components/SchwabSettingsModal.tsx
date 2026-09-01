import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Key, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Lock } from './icons';

interface SchwabSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchwabSettingsModal: React.FC<SchwabSettingsModalProps> = ({ isOpen, onClose }) => {
  const [appKey, setAppKey] = useState<string>('');
  const [appSecret, setAppSecret] = useState<string>('');
  const [callbackUrl, setCallbackUrl] = useState<string>('https://127.0.0.1');
  const [authCode, setAuthCode] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('schwab_app_key') || '';
      const savedSecret = localStorage.getItem('schwab_app_secret') || '';
      const savedCallback = localStorage.getItem('schwab_callback_url') || 'https://127.0.0.1';
      const savedEnabled = localStorage.getItem('schwab_enabled') === 'true';

      setAppKey(savedKey);
      setAppSecret(savedSecret);
      setCallbackUrl(savedCallback);
      setIsEnabled(savedEnabled);
    } catch (e) {
      console.warn('Failed to load Schwab settings from storage', e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      localStorage.setItem('schwab_app_key', appKey.trim());
      localStorage.setItem('schwab_app_secret', appSecret.trim());
      localStorage.setItem('schwab_callback_url', callbackUrl.trim());
      localStorage.setItem('schwab_enabled', isEnabled ? 'true' : 'false');

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save Schwab settings', e);
    }
  };

  const handleClearCredentials = () => {
    localStorage.removeItem('schwab_app_key');
    localStorage.removeItem('schwab_app_secret');
    localStorage.removeItem('schwab_callback_url');
    localStorage.removeItem('schwab_enabled');
    setAppKey('');
    setAppSecret('');
    setCallbackUrl('https://127.0.0.1');
    setIsEnabled(false);
    setAuthCode('');
    setShowClearConfirm(false);
  };

  const schwabAuthUrl = appKey.trim()
    ? `https://api.schwabapi.com/v1/oauth/authorize?client_id=${encodeURIComponent(
        appKey.trim()
      )}&redirect_uri=${encodeURIComponent(callbackUrl.trim())}`
    : '';

  const maskValue = (val: string) =>
    val.length > 8 ? val.slice(0, 4) + '•'.repeat(val.length - 8) + val.slice(-4) : '•'.repeat(val.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Charles Schwab Retail Trader API Provisioning</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Live Real-Time Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct NBBO Level 1 quotes &amp; live options chains with institutional Greeks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">

          {/* Security Isolation Notice */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-200 leading-relaxed space-y-1">
              <div className="font-bold text-emerald-300 text-xs">Credentials stored locally only — never sent to GitHub</div>
              <p>
                Your App Key and App Secret are saved exclusively in your <strong>browser's localStorage</strong>, 
                which is private to this machine and browser profile. They are <strong>never written to any file</strong> 
                in the project directory and cannot be committed or pushed to the public repository.
              </p>
              <p className="text-emerald-300/70">
                To keep credentials off disk entirely, you can also set them in a local <code className="text-emerald-300 bg-emerald-950/60 px-1 rounded">.env</code> file 
                (already in <code className="text-emerald-300 bg-emerald-950/60 px-1 rounded">.gitignore</code>) for the backend Python fetcher.
              </p>
            </div>
          </div>

          {/* Status Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  appKey && appSecret && isEnabled ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-amber-400'
                }`}
              />
              <div>
                <span className="font-bold text-white text-xs">
                  {appKey && appSecret && isEnabled ? 'Schwab API Ingestion Active' : 'Schwab API Keys Pending'}
                </span>
                <p className="text-[11px] text-slate-400">
                  {isEnabled
                    ? 'Configured for direct real-time options and equities feeds.'
                    : 'Configure credentials below to enable live sub-second Schwab data.'}
                </p>
              </div>
            </div>

            <label className="flex items-center cursor-pointer space-x-2">
              <span className="text-xs text-slate-300 font-semibold">Enable Schwab Feed</span>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Key Form */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">App Key (Client ID):</label>
                <a
                  href="https://developer.schwab.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-[11px] flex items-center gap-1"
                >
                  <span>Schwab Developer Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={appKey}
                  onChange={(e) => setAppKey(e.target.value)}
                  placeholder="e.g. 32-character Schwab App Key"
                  className="w-full px-3 py-2 pr-16 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800 font-semibold"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">App Secret:</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder="e.g. Schwab App Secret"
                  className="w-full px-3 py-2 pr-16 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800 font-semibold"
                >
                  {showSecret ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Stored credential preview (masked) */}
            {(appKey || appSecret) && (
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] font-mono text-slate-500 space-y-0.5">
                <div>Key stored: <span className="text-slate-300">{appKey ? maskValue(appKey) : '—'}</span></div>
                <div>Secret stored: <span className="text-slate-300">{appSecret ? maskValue(appSecret) : '—'}</span></div>
                <div className="text-[9px] text-slate-600 pt-0.5">Values above are obfuscated — toggle Show to reveal for editing</div>
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-300 block mb-1">OAuth Callback URL (Redirect URI):</label>
              <input
                type="text"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                placeholder="https://127.0.0.1"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Must match the Redirect URI registered in your Schwab Developer App settings (typically https://127.0.0.1).
              </span>
            </div>
          </div>

          {/* Step 2: Ingestion & Authorization Link */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>OAuth Authorization Workflow</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              1. Click the link below to authenticate with your Charles Schwab retail account.
              <br />
              2. Schwab will redirect your browser to your callback URL (e.g. <code className="text-cyan-400">https://127.0.0.1/?code=...</code>).
              <br />
              3. Copy the full redirect URL or the <code className="text-cyan-400">code=</code> parameter and paste it below.
            </p>

            {schwabAuthUrl ? (
              <a
                href={schwabAuthUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
              >
                <span>Authorize on Schwab.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <div className="text-[11px] text-slate-500 italic">
                Enter your App Key above to generate your authorization link.
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Paste Returned Authorization Code / URL:</label>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Paste code or full redirect URL here..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Backend .env guidance */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-700/60 space-y-2">
            <div className="font-bold text-slate-300 text-xs uppercase tracking-wider">
              Backend Python Fetcher (.env — optional)
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              If you use the Python backend (<code className="text-cyan-400">main.py</code> / <code className="text-cyan-400">server.py</code>), 
              create a <code className="text-cyan-400">.env</code> file in the project root (it is already in <code className="text-cyan-400">.gitignore</code> — never committed):
            </p>
            <pre className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[10px] font-mono text-emerald-300 whitespace-pre overflow-x-auto">
{`SCHWAB_APP_KEY=your_app_key_here
SCHWAB_APP_SECRET=your_app_secret_here
SCHWAB_CALLBACK_URL=https://127.0.0.1
SCHWAB_ENABLED=true`}
            </pre>
            <p className="text-[10px] text-slate-500">
              ⚠️ Never paste credentials directly into any <code>.py</code> or <code>.ts</code> source file. Always use <code>.env</code> or browser localStorage.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            {savedSuccess && (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Credentials saved to localStorage (local only)!</span>
              </span>
            )}
            {!savedSuccess && (
              showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-rose-400 font-semibold">Clear all saved credentials?</span>
                  <button
                    onClick={handleClearCredentials}
                    className="px-2 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white text-[10px] font-bold transition-colors"
                  >
                    Yes, Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-[11px] text-slate-500 hover:text-rose-400 font-semibold transition-colors underline"
                >
                  Clear saved credentials
                </button>
              )
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all"
            >
              Save Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};