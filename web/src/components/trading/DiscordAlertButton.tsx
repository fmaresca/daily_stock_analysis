/**
 * DiscordAlertButton.tsx
 *
 * A self-contained button + dropdown that stores the user's Discord Webhook URL
 * in localStorage and dispatches a rich OptionsAlertData embed via discordNotifier.
 *
 * Props:
 *   alertData — full OptionsAlertData object. When the required fields
 *               (strikePrice, expirationDate, dte, premiumMid) are not yet
 *               available (e.g. no option selected), pass `null`; the button
 *               will render as disabled with a tooltip.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  sendDiscordAlert,
  DISCORD_WEBHOOK_LS_KEY,
  type OptionsAlertData,
} from '../../utils/discordNotifier';

// ─── Discord SVG icon (inline, no external deps) ──────────────────────────────

const DiscordIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DiscordAlertButtonProps {
  /** Full options alert context. Pass `null` to show a disabled placeholder. */
  alertData: OptionsAlertData | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DiscordAlertButton: React.FC<DiscordAlertButtonProps> = ({ alertData }) => {
  const [isOpen, setIsOpen]       = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(
    () => localStorage.getItem(DISCORD_WEBHOOK_LS_KEY) ?? ''
  );
  const [sending, setSending]     = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isError, setIsError]     = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setStatusMsg(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const saveWebhook = (url: string) => {
    if (url.trim()) localStorage.setItem(DISCORD_WEBHOOK_LS_KEY, url.trim());
  };

  const handleSend = async () => {
    if (!alertData) return;

    if (!webhookUrl.trim()) {
      setIsError(true);
      setStatusMsg('Paste your Discord Webhook URL first.');
      return;
    }

    setSending(true);
    setStatusMsg(null);
    setIsError(false);
    saveWebhook(webhookUrl);

    const res = await sendDiscordAlert(webhookUrl.trim(), alertData);
    setSending(false);

    if (res.success) {
      setIsError(false);
      setStatusMsg('✅ Alert posted to Discord!');
      setTimeout(() => {
        setStatusMsg(null);
        setIsOpen(false);
      }, 1800);
    } else {
      setIsError(true);
      setStatusMsg(`❌ ${res.message ?? `HTTP ${res.status}`}`);
    }
  };

  const isDisabled = !alertData;
  const ticker = alertData?.ticker ?? '—';

  return (
    <div ref={panelRef} className="relative inline-block">
      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <button
        id={`discord-alert-btn-${ticker}`}
        onClick={() => {
          if (!isDisabled) {
            setIsOpen((v) => !v);
            setStatusMsg(null);
          }
        }}
        disabled={isDisabled}
        title={
          isDisabled
            ? 'Open a ticker audit with a CSP or CC setup to enable Discord alerts'
            : `Send $${ticker} options alert to Discord`
        }
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
          border transition-all cursor-pointer
          ${isDisabled
            ? 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
            : 'bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] hover:text-white border-[#5865F2]/30 hover:border-[#5865F2]/60'
          }`}
      >
        <DiscordIcon className="w-3.5 h-3.5" />
        <span>Discord Alert</span>
        {!isDisabled && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`w-3 h-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {/* ── Configuration panel ────────────────────────────────────────── */}
      {isOpen && alertData && (
        <div
          className="absolute right-0 top-full mt-1.5 w-80 bg-slate-900 border border-slate-700
            rounded-xl shadow-2xl shadow-slate-950/60 z-50 overflow-hidden
            animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <DiscordIcon className="w-4 h-4 text-[#5865F2]" />
              <span className="text-xs font-bold text-white">Send to Discord</span>
            </div>
            <button
              onClick={() => { setIsOpen(false); setStatusMsg(null); }}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Alert preview card */}
          <div className="px-4 py-3 border-b border-slate-800">
            <div
              className="rounded-lg border-l-4 bg-slate-950/60 px-3 py-2.5 space-y-1.5"
              style={{ borderLeftColor: '#10b981' }}
            >
              <p className="text-[11px] font-bold text-white">
                📊 {alertData.ticker} — {alertData.strategy}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] font-mono text-slate-400">
                <span>Price <span className="text-slate-200">${alertData.currentPrice.toFixed(2)}</span></span>
                <span>Strike <span className="text-emerald-300">${alertData.strikePrice.toFixed(2)}</span></span>
                <span>RSI <span className="text-slate-200">{alertData.rsi?.toFixed(1) ?? 'N/A'}</span></span>
                <span>Exp <span className="text-slate-200">{alertData.expirationDate}</span></span>
                <span>IV Rank <span className="text-amber-300">{alertData.ivRank != null ? `${alertData.ivRank}%` : 'N/A'}</span></span>
                <span>DTE <span className="text-slate-200">{alertData.dte}d</span></span>
                <span>Mid <span className="text-cyan-300">${alertData.premiumMid.toFixed(2)}</span></span>
                <span>Ann. <span className="text-emerald-300">{alertData.annualizedReturnPct?.toFixed(1) ?? 'N/A'}%</span></span>
              </div>
            </div>
          </div>

          {/* Webhook URL */}
          <div className="px-4 py-3 space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Discord Webhook URL
            </label>
            <input
              id="discord-alert-webhook-input"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              onBlur={() => saveWebhook(webhookUrl)}
              placeholder="https://discord.com/api/webhooks/…"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs
                text-white placeholder-slate-500 focus:outline-none focus:border-[#5865F2]
                transition-colors"
            />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Server Settings → Integrations → Webhooks. Saved in your browser.
            </p>

            {/* Status message */}
            {statusMsg && (
              <p
                className={`text-[11px] rounded-lg px-3 py-2 leading-snug ${
                  isError
                    ? 'bg-rose-950/50 border border-rose-500/30 text-rose-300'
                    : 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-300'
                }`}
              >
                {statusMsg}
              </p>
            )}

            {/* Action row */}
            <div className="flex gap-2 pt-1">
              <button
                id="discord-alert-dispatch-btn"
                onClick={handleSend}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs
                  font-bold bg-[#5865F2] hover:bg-[#4752C4] text-white transition-colors
                  disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {sending ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Dispatching…
                  </>
                ) : (
                  <>
                    <DiscordIcon className="w-3.5 h-3.5" />
                    Dispatch Alert
                  </>
                )}
              </button>
              <button
                onClick={() => { setIsOpen(false); setStatusMsg(null); }}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700
                  text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscordAlertButton;
