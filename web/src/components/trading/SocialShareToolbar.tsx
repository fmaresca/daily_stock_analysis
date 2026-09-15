import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ExternalLink, Copy, CheckCircle2 } from '../icons';

// ─── Brand SVG Icons (inline, no external deps) ───────────────────────────────

const TelegramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.32l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.239z" />
  </svg>
);

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const StockTwitsIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.001 2C6.478 2 2 6.478 2 12.001c0 5.52 4.478 9.999 10.001 9.999C17.522 22 22 17.521 22 12.001 22 6.478 17.522 2 12.001 2zm-.56 14.03c-.344.578-.98.884-1.636.79a1.7 1.7 0 01-1.383-1.198l-1.32-4.757h2.016l.914 3.295 2.694-4.516h2.365l-3.65 6.386zM15.5 9.5c-.553 0-1-.448-1-1s.447-1 1-1 1 .448 1 1-.447 1-1 1z" />
  </svg>
);

const DiscordIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const RedditIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShareProps {
  ticker: string;
  currentPrice: number;
  rsi?: number;
  ivRank?: number;
  strategy?: string;
  strikePrice?: number;
  expirationDate?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const APP_URL = 'https://daily-stock-analysis-89j.pages.dev';
const DISCORD_WEBHOOK_KEY = 'dh_discord_webhook_url';

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildShareText(props: ShareProps): string {
  const { ticker, currentPrice, rsi, ivRank, strategy, strikePrice, expirationDate } = props;
  const appUrl = `${APP_URL}/?ticker=${ticker}`;
  const stratPart = strategy ?? 'Stock Analysis';
  const strikePart = strikePrice ? ` $${strikePrice} strike` : '';
  const expPart = expirationDate ? ` exp ${expirationDate}` : '';
  return (
    `📊 DeltaHarvest Setup: $${ticker} ($${currentPrice.toFixed(2)})` +
    ` | RSI: ${rsi ?? 'N/A'}` +
    ` | IV Rank: ${ivRank != null ? `${ivRank}%` : 'N/A'}` +
    ` | Setup: ${stratPart}${strikePart}${expPart}` +
    ` | Full Analysis: ${appUrl}`
  );
}

// ─── Discord Modal ────────────────────────────────────────────────────────────

interface DiscordModalProps {
  ticker: string;
  shareText: string;
  currentPrice: number;
  rsi?: number;
  ivRank?: number;
  strategy?: string;
  strikePrice?: number;
  expirationDate?: string;
  onClose: () => void;
}

const DiscordModal: React.FC<DiscordModalProps> = ({
  ticker, shareText, currentPrice, rsi, ivRank, strategy, strikePrice, expirationDate, onClose,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(
    () => localStorage.getItem(DISCORD_WEBHOOK_KEY) ?? ''
  );
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const saveWebhook = () => {
    if (webhookUrl.trim()) localStorage.setItem(DISCORD_WEBHOOK_KEY, webhookUrl.trim());
  };

  const sendToDiscord = async () => {
    if (!webhookUrl.trim()) {
      setErrorMsg('Paste your Discord Webhook URL first.');
      return;
    }
    saveWebhook();
    setStatus('sending');
    setErrorMsg('');

    const appUrl = `${APP_URL}/?ticker=${ticker}`;
    const payload = {
      username: 'DeltaHarvest',
      embeds: [
        {
          title: `📊 DeltaHarvest Setup: $${ticker}`,
          color: 0x10b981, // emerald-500
          url: appUrl,
          fields: [
            { name: 'Price', value: `$${currentPrice.toFixed(2)}`, inline: true },
            { name: 'RSI (14)', value: rsi != null ? String(rsi) : 'N/A', inline: true },
            { name: 'IV Rank', value: ivRank != null ? `${ivRank}%` : 'N/A', inline: true },
            {
              name: 'Strategy',
              value: [
                strategy ?? 'Stock Analysis',
                strikePrice ? `$${strikePrice} strike` : '',
                expirationDate ? `exp ${expirationDate}` : '',
              ]
                .filter(Boolean)
                .join(' · '),
              inline: false,
            },
            { name: 'Full Analysis', value: appUrl, inline: false },
          ],
          footer: { text: 'DeltaHarvest Institutional · daily-stock-analysis-89j.pages.dev' },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      const res = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 204) {
        setStatus('sent');
      } else {
        setErrorMsg(`Discord returned HTTP ${res.status}. Check your webhook URL.`);
        setStatus('error');
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Network error');
      setStatus('error');
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
      id="discord-webhook-modal-backdrop"
    >
      <div
        className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DiscordIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Send to Discord</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-3 text-[11px] font-mono text-slate-300 leading-relaxed">
          {shareText}
        </div>

        {/* Webhook URL input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Discord Webhook URL
          </label>
          <input
            id="discord-webhook-input"
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            onBlur={saveWebhook}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white
              placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <p className="text-[10px] text-slate-500">
            Saved locally in your browser. Discord Server → Integrations → Webhooks.
          </p>
        </div>

        {/* Error */}
        {status === 'error' && (
          <p className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-500/30 rounded-lg px-3 py-2">
            ⚠ {errorMsg}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            id="discord-send-btn"
            onClick={sendToDiscord}
            disabled={status === 'sending' || status === 'sent'}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold
              bg-indigo-600 hover:bg-indigo-500 text-white transition-colors
              disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {status === 'sending' ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Sending…
              </>
            ) : status === 'sent' ? (
              <>✓ Sent to Discord!</>
            ) : (
              <>
                <DiscordIcon className="w-3.5 h-3.5" />
                Send Embed
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700
              text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Community Dropdown ───────────────────────────────────────────────────────

interface CommunityDropdownProps {
  ticker: string;
  onClose: () => void;
}

const COMMUNITY_LINKS = (ticker: string) => [
  {
    label: '📡 Telegram Squawk (FinancialJuice)',
    href: 'https://t.me/FinancialJuice',
    badge: 'LIVE',
    badgeCls: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  {
    label: '🦅 Reddit ThetaGang',
    href: `https://reddit.com/r/thetagang/search/?q=${ticker}&sort=new`,
    badge: 'r/thetagang',
    badgeCls: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  {
    label: '🔤 Reddit Options',
    href: `https://reddit.com/r/options/search/?q=${ticker}&sort=new`,
    badge: 'r/options',
    badgeCls: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  {
    label: '🦎 MarketChameleon News',
    href: `https://marketchameleon.com/Overview/${ticker}/News/`,
    badge: 'MC',
    badgeCls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
];

const CommunityDropdown: React.FC<CommunityDropdownProps> = ({ ticker, onClose }) => (
  <div
    className="absolute right-0 top-full mt-1.5 w-72 bg-slate-900 rounded-xl border border-slate-700
      shadow-2xl shadow-slate-950/60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
  >
    <div className="px-3 py-2 border-b border-slate-800">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        Trader Communities &amp; Squawks
      </span>
    </div>
    <div className="py-1">
      {COMMUNITY_LINKS(ticker).map((item) => (
        <a
          key={item.href}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-800 transition-colors group"
        >
          <span className="text-xs text-slate-200 group-hover:text-white">{item.label}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${item.badgeCls}`}>
              {item.badge}
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
          </div>
        </a>
      ))}
    </div>
  </div>
);

// ─── Main Toolbar ─────────────────────────────────────────────────────────────

export const SocialShareToolbar: React.FC<ShareProps> = (props) => {
  const { ticker, currentPrice, rsi, ivRank, strategy, strikePrice, expirationDate } = props;

  const [copied, setCopied] = useState(false);
  const [showDiscord, setShowDiscord] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);

  const communityRef = useRef<HTMLDivElement>(null);

  const shareText = buildShareText(props);
  const appUrl = `${APP_URL}/?ticker=${ticker}`;
  const encoded = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(appUrl);

  // Close community dropdown on outside click
  useEffect(() => {
    if (!showCommunity) return;
    const handler = (e: MouseEvent) => {
      if (communityRef.current && !communityRef.current.contains(e.target as Node)) {
        setShowCommunity(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCommunity]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // Fallback for older browsers / iframe contexts
      const ta = document.createElement('textarea');
      ta.value = shareText;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareText]);

  const btnBase =
    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer whitespace-nowrap';
  const btnDefault =
    `${btnBase} bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700`;

  return (
    <>
      {/* Discord Modal (portal-style overlay) */}
      {showDiscord && (
        <DiscordModal
          ticker={ticker}
          shareText={shareText}
          currentPrice={currentPrice}
          rsi={rsi}
          ivRank={ivRank}
          strategy={strategy}
          strikePrice={strikePrice}
          expirationDate={expirationDate}
          onClose={() => setShowDiscord(false)}
        />
      )}

      {/* Toolbar strip */}
      <div
        id={`social-share-toolbar-${ticker}`}
        className="flex flex-wrap items-center gap-2"
      >
        {/* ── Telegram ── */}
        <a
          id={`share-telegram-${ticker}`}
          href={`https://t.me/share/url?url=${encodedUrl}&text=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnDefault} text-[#26A5E4] hover:text-white hover:bg-[#26A5E4]/20 hover:border-[#26A5E4]/40`}
          title="Share on Telegram"
        >
          <TelegramIcon className="w-3.5 h-3.5" />
          <span>Telegram</span>
        </a>

        {/* ── WhatsApp ── */}
        <a
          id={`share-whatsapp-${ticker}`}
          href={`https://api.whatsapp.com/send?text=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnDefault} text-[#25D366] hover:text-white hover:bg-[#25D366]/20 hover:border-[#25D366]/40`}
          title="Share on WhatsApp"
        >
          <WhatsAppIcon className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </a>

        {/* ── StockTwits ── */}
        <a
          id={`share-stocktwits-${ticker}`}
          href={`https://stocktwits.com/symbol/${ticker}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnDefault} text-[#4c54ff] hover:text-white hover:bg-[#4c54ff]/20 hover:border-[#4c54ff]/40`}
          title={`Open $${ticker} StockTwits room`}
        >
          <StockTwitsIcon className="w-3.5 h-3.5" />
          <span>StockTwits</span>
        </a>

        {/* ── Copy Summary ── */}
        <button
          id={`share-copy-${ticker}`}
          onClick={handleCopy}
          className={`${btnDefault} relative ${copied ? 'text-emerald-400 border-emerald-600/40 bg-emerald-900/20' : ''}`}
          title="Copy trade summary to clipboard"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Summary</span>
            </>
          )}
        </button>

        {/* ── Discord ── */}
        <button
          id={`share-discord-${ticker}`}
          onClick={() => setShowDiscord(true)}
          className={`${btnDefault} text-[#5865F2] hover:text-white hover:bg-[#5865F2]/20 hover:border-[#5865F2]/40`}
          title="Send to Discord via Webhook"
        >
          <DiscordIcon className="w-3.5 h-3.5" />
          <span>Discord</span>
        </button>

        {/* ── Community Dropdown ── */}
        <div ref={communityRef} className="relative">
          <button
            id={`share-communities-${ticker}`}
            onClick={() => setShowCommunity((v) => !v)}
            className={`${btnDefault} ${showCommunity ? 'bg-slate-700 text-white border-slate-600' : ''}`}
            title="Trader communities & live squawks"
          >
            <RedditIcon className="w-3.5 h-3.5 text-orange-400" />
            <span>Communities</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`w-3 h-3 transition-transform duration-150 ${showCommunity ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showCommunity && (
            <CommunityDropdown ticker={ticker} onClose={() => setShowCommunity(false)} />
          )}
        </div>
      </div>
    </>
  );
};

export default SocialShareToolbar;
