import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Zap } from './icons';

interface TradierSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSchwabSettings?: () => void;
}

export const TradierSettingsModal: React.FC<TradierSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenSchwabSettings,
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [useSandbox, setUseSandbox] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [isServerProvisioned, setIsServerProvisioned] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [testMessage, setTestMessage] = useState<string>('');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [sampleQuote, setSampleQuote] = useState<{
    symbol: string;
    last: number;
    bid: number;
    ask: number;
    volume?: number;
    change?: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    try {
      // Purge any legacy localStorage keys to comply with security rules
      const legacyKey = localStorage.getItem('tradier_api_key');
      if (legacyKey) {
        sessionStorage.setItem('tradier_api_key', legacyKey);
        localStorage.removeItem('tradier_api_key');
      }

      // Default to empty string: no client bundle fallback keys
      const savedKey = sessionStorage.getItem('tradier_api_key') || '';
      const savedSandbox = (sessionStorage.getItem('tradier_use_sandbox') || localStorage.getItem('tradier_use_sandbox')) === 'true';
      const savedEnabled = (sessionStorage.getItem('tradier_enabled') || localStorage.getItem('tradier_enabled')) !== 'false';

      setApiKey(savedKey);
      setUseSandbox(savedSandbox);
      setIsEnabled(savedEnabled);

      // Probe backend/edge to check if server-provisioned TRADIER_API_KEY is available
      const probeHeaders: Record<string, string> = { Accept: 'application/json' };
      if (savedKey) {
        probeHeaders['Authorization'] = `Bearer ${savedKey}`;
      }

      fetch('/api/v1/options/tradier/status', { headers: probeHeaders })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.server_provisioned && data.status === 'CONNECTED') {
            setIsServerProvisioned(true);
            sessionStorage.setItem('tradier_server_provisioned', 'true');
            if (!savedKey) {
              setTestStatus('CONNECTED');
              setLatencyMs(data.latency_ms || null);
              setSampleQuote(data.sample_quote || null);
              setTestMessage('Tradier API is active via server-provisioned environment variables (Zero-Knowledge Client).');
            }
          } else {
            setIsServerProvisioned(false);
            if (!savedKey) {
              sessionStorage.removeItem('tradier_server_provisioned');
            }
          }
        })
        .catch(() => {
          setIsServerProvisioned(false);
        });
    } catch (e) {
      console.warn('Failed to load Tradier settings from storage', e);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const trimmed = apiKey.trim();
      if (trimmed) {
        sessionStorage.setItem('tradier_api_key', trimmed);
      } else {
        sessionStorage.removeItem('tradier_api_key');
      }
      localStorage.removeItem('tradier_api_key'); // Ensure purged from persistent storage
      sessionStorage.setItem('tradier_use_sandbox', useSandbox ? 'true' : 'false');
      sessionStorage.setItem('tradier_enabled', isEnabled ? 'true' : 'false');

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save Tradier settings', e);
    }
  };

  const handleTestConnection = async () => {
    const token = apiKey.trim();
    if (!token && !isServerProvisioned) {
      setTestStatus('ERROR');
      setTestMessage('Please enter your Tradier API Key or configure TRADIER_API_KEY in server environment.');
      return;
    }

    setTestStatus('TESTING');
    setTestMessage('Testing live Tradier market feed & NBBO latency...');
    const t0 = performance.now();

    // 1. Try Backend / Edge Status Endpoint (Pass token via Authorization header, NEVER in URL query)
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const backendResp = await fetch('/api/v1/options/tradier/status', {
        headers,
      });

      if (backendResp.ok) {
        const data = await backendResp.json();
        if (data.status === 'CONNECTED' && (data.sample_quote || data.connected)) {
          const elapsed = Math.round(performance.now() - t0);
          setTestStatus('CONNECTED');
          setLatencyMs(data.latency_ms || elapsed);
          setSampleQuote(data.sample_quote || null);
          setTestMessage(
            data.server_provisioned
              ? 'Connected via server-provisioned Tradier API! Live market quotes & options chains active.'
              : 'Connected via backend! Tradier is active as Primary market data provider.'
          );
          setIsEnabled(true);
          if (token) {
            handleSave();
          } else if (data.server_provisioned) {
            sessionStorage.setItem('tradier_server_provisioned', 'true');
          }
          return;
        }
      }
    } catch {
      // Backend not running; proceed with direct client-side test if client token entered
    }

    // 2. Direct client-side test (Tradier API supports CORS Access-Control-Allow-Origin: *)
    if (token) {
      try {
        const baseUrl = useSandbox ? 'https://sandbox.tradier.com/v1' : 'https://api.tradier.com/v1';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const resp = await fetch(`${baseUrl}/markets/quotes?symbols=SPY&greeks=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const elapsed = Math.round(performance.now() - t0);

        if (resp.status === 200) {
          const data = await resp.json();
          const quotesContainer = data?.quotes || {};
          let quote = quotesContainer.quote;
          if (Array.isArray(quote) && quote.length > 0) {
            quote = quote[0];
          }

          if (quote && quote.symbol) {
            setTestStatus('CONNECTED');
            setLatencyMs(elapsed);
            setSampleQuote({
              symbol: quote.symbol,
              last: Number(quote.last) || Number(quote.close) || 0,
              bid: Number(quote.bid) || 0,
              ask: Number(quote.ask) || 0,
              volume: Number(quote.volume) || 0,
              change: Number(quote.change) || 0,
            });
            setTestMessage('Direct browser connection to Tradier API successful! Real-time NBBO quotes verified.');
            setIsEnabled(true);
            handleSave();
            return;
          }
        } else if (resp.status === 401) {
          setTestStatus('ERROR');
          setTestMessage('Tradier API rejected the token (HTTP 401 Unauthorized). Please check your key.');
          return;
        }
      } catch (err: any) {
        setTestStatus('ERROR');
        setTestMessage(err.message || 'Connection test failed. Verify network or API key.');
        return;
      }
    }

    setTestStatus('ERROR');
    setTestMessage('Connection test failed. Check token validity or server environment.');
  };

  const handleClearCredentials = () => {
    sessionStorage.removeItem('tradier_api_key');
    sessionStorage.removeItem('tradier_use_sandbox');
    sessionStorage.removeItem('tradier_enabled');
    sessionStorage.removeItem('tradier_server_provisioned');
    localStorage.removeItem('tradier_api_key');
    localStorage.removeItem('tradier_use_sandbox');
    localStorage.removeItem('tradier_enabled');
    setApiKey('');
    setUseSandbox(false);
    setIsEnabled(false);
    setTestStatus('IDLE');
    setTestMessage('');
    setSampleQuote(null);
    setLatencyMs(null);
    setShowClearConfirm(false);
  };

  const isTradierConfigured = (apiKey.trim().length > 0 && isEnabled) || isServerProvisioned;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="tradier-settings-title">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="tradier-settings-title" className="text-base font-bold text-white tracking-wide">Tradier API Settings</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Primary Provider
                </span>
                {isServerProvisioned && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Server-Provisioned
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Institutional-grade NBBO quotes &amp; live option chains with Greeks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Tradier settings dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Security & Privacy Isolation Notice (Matching Schwab Pattern) */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-200 leading-relaxed space-y-1">
              <div className="font-bold text-amber-300 text-xs">Browser Session Storage Notice</div>
              <p>
                Broker API keys entered here are held temporarily in browser <code className="text-amber-300 bg-amber-950/60 px-1 rounded">sessionStorage</code> for this session only and are wiped upon logout or closing the tab. Browser storage is never encrypted. Never enter production credentials on untrusted devices.
              </p>
              <p className="text-amber-300/80">
                To keep credentials off the client entirely, you can configure them server-side via environment variables (<code className="text-amber-300 bg-amber-950/60 px-1 rounded">TRADIER_API_KEY</code> and optional <code className="text-amber-300 bg-amber-950/60 px-1 rounded">TRADIER_USE_SANDBOX</code>) for the edge/backend proxy.
              </p>
            </div>
          </div>

          {/* Status Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  isTradierConfigured ? 'bg-emerald-400 shadow-emerald-400/50 shadow-sm animate-pulse' : 'bg-slate-500'
                }`}
              />
              <div>
                <span className="font-bold text-white text-xs">
                  {isTradierConfigured
                    ? isServerProvisioned && !apiKey.trim()
                      ? 'Tradier API Active (Server-Provisioned Primary)'
                      : 'Tradier API Active (Primary)'
                    : 'Tradier API Unconfigured'}
                </span>
                <p className="text-[10px] text-slate-400">
                  {isTradierConfigured
                    ? 'Connected for direct real-time options and equities feeds.'
                    : 'Configure credentials below or provision TRADIER_API_KEY on the server.'}
                </p>
              </div>
            </div>

            <label className="flex items-center cursor-pointer space-x-2">
              <span className="text-xs text-slate-300 font-semibold">Enable Tradier Feed</span>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* API Key Form */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">Tradier API Token / Key:</label>
                <a
                  href="https://developer.tradier.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 text-[11px] flex items-center gap-1"
                >
                  <span>Tradier Developer Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    isServerProvisioned
                      ? 'Server-provisioned via TRADIER_API_KEY (Leave blank to use server key)'
                      : 'Enter your Tradier API Key'
                  }
                  className="w-full px-3 py-2 pr-16 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 tracking-wider placeholder:text-slate-500"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800 font-semibold transition-colors"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {isServerProvisioned && !apiKey
                  ? 'Server-side key is active. Browser storage remains zero-knowledge.'
                  : 'Key is kept in browser sessionStorage for this session only and is never stored in persistent browser storage.'}
              </p>
            </div>

            <div className="flex items-center space-x-4 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSandbox}
                  onChange={(e) => setUseSandbox(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <span className="text-xs text-slate-300">Use Tradier Sandbox Environment (sandbox.tradier.com)</span>
              </label>
            </div>
          </div>

          {/* Test Status & Diagnostic Results */}
          {testStatus !== 'IDLE' && (
            <div
              className={`p-3.5 rounded-xl border ${
                testStatus === 'CONNECTED'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : testStatus === 'TESTING'
                  ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  {testStatus === 'TESTING' && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
                  {testStatus === 'CONNECTED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {testStatus === 'ERROR' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  <span className="font-bold text-xs">
                    {testStatus === 'CONNECTED'
                      ? 'Live Stream Active (Primary Provider)'
                      : testStatus === 'TESTING'
                      ? 'Testing Connection...'
                      : 'Connection Failed'}
                  </span>
                </div>
                {latencyMs !== null && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/40 border border-emerald-500/20">
                    {latencyMs}ms Latency
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed">{testMessage}</p>

              {/* Sample Quote Card */}
              {sampleQuote && (
                <div className="mt-3 p-2.5 rounded-lg bg-black/50 border border-emerald-500/20 font-mono text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Symbol</span>
                    <span className="text-white font-bold">{sampleQuote.symbol}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Last</span>
                    <span className="text-emerald-400 font-bold">${sampleQuote.last?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Bid / Ask</span>
                    <span className="text-slate-300">
                      ${sampleQuote.bid?.toFixed(2)} / ${sampleQuote.ask?.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Volume</span>
                    <span className="text-slate-300">{sampleQuote.volume?.toLocaleString() || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback Provider Reference */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">Charles Schwab Retail Trader API</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Fallback Provider
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically utilized whenever Tradier is unavailable or unconfigured.
              </p>
            </div>
            {onOpenSchwabSettings && (
              <button
                type="button"
                onClick={onOpenSchwabSettings}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
              >
                Configure Schwab
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            {!showClearConfirm ? (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Clear Credentials
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-rose-400 font-semibold">Delete saved token?</span>
                <button
                  type="button"
                  onClick={handleClearCredentials}
                  className="px-2 py-1 bg-rose-600/30 text-rose-300 border border-rose-500/50 rounded text-[10px] font-bold hover:bg-rose-600/40 cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === 'TESTING' || (!apiKey.trim() && !isServerProvisioned)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'TESTING' ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Save &amp; Connect</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
