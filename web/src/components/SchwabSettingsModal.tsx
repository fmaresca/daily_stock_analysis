import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Key, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw } from './icons';

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

  const schwabAuthUrl = appKey.trim()
    ? `https://api.schwabapi.com/v1/oauth/authorize?client_id=${encodeURIComponent(
        appKey.trim()
      )}&redirect_uri=${encodeURIComponent(callbackUrl.trim())}`
    : '';

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
              <input
                type="text"
                value={appKey}
                onChange={(e) => setAppKey(e.target.value)}
                placeholder="e.g. 32-character Schwab App Key"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">App Secret:</label>
              <input
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                placeholder="e.g. Schwab App Secret"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

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
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs">
            {savedSuccess && (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Schwab API credentials saved!</span>
              </span>
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
