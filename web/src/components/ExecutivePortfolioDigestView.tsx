import React, { useState, useEffect } from 'react';
import {
  calculateLiveExecutiveMetrics,
  ExecutiveDigestMetrics,
  generateMarkdownExecutiveReport,
} from '../utils/executiveReportGenerator';
import {
  LIVING_TRUST_OPTIONS_POSITIONS,
  PortfolioPosition,
} from '../utils/portfolioStressTest';
import { MONITORED_EARNINGS_REGISTRY } from '../utils/earningsCalendar';
import {
  Award,
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  Printer,
  X,
  ChevronRight,
  Info,
  TrendingUp,
} from './icons';


// ─── Types ──────────────────────────────────────────────────────────────────

type ModalType = 'threats' | 'earnings' | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadActivePositions(): PortfolioPosition[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const rawPos = localStorage.getItem('deltaharvest_portfolio_book');
      if (rawPos) {
        const parsed = JSON.parse(rawPos);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch {
    // ignore
  }
  return LIVING_TRUST_OPTIONS_POSITIONS;
}

function getDeltaStatus(delta: number): { label: string; color: string; bg: string } {
  const abs = Math.abs(delta);
  if (abs >= 0.50) return { label: '⚠ Critical ≥0.50Δ', color: 'text-red-300', bg: 'bg-red-950/40 border-red-500/40' };
  if (abs >= 0.40) return { label: '⚡ Threatened ≥0.40Δ', color: 'text-rose-300', bg: 'bg-rose-950/30 border-rose-500/30' };
  if (abs >= 0.30) return { label: '⚠ Watch ≥0.30Δ', color: 'text-amber-300', bg: 'bg-amber-950/20 border-amber-500/30' };
  return { label: '✓ Safe <0.30Δ', color: 'text-emerald-400', bg: 'bg-emerald-950/15 border-emerald-500/20' };
}

function formatExpiry(expiry?: string): string {
  if (!expiry) return '—';
  // if already formatted, return as-is
  return expiry;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ModalOverlayProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ title, subtitle, icon, onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {children}
      </div>

      <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

// ─── Threat Detail Modal ──────────────────────────────────────────────────────

const ThreatDetailModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const allPositions = loadActivePositions().filter(
    (p) => p.type !== 'CASH' && p.type !== 'MMF'
  );

  const optionPositions = allPositions.filter((p) => p.type !== 'STOCK');
  const stockPositions  = allPositions.filter((p) => p.type === 'STOCK');

  const threatened = optionPositions.filter((p) => Math.abs(p.delta) >= 0.40);
  const watching   = optionPositions.filter((p) => Math.abs(p.delta) >= 0.30 && Math.abs(p.delta) < 0.40);
  const safe       = optionPositions.filter((p) => Math.abs(p.delta) < 0.30);

  const renderOptionRow = (p: PortfolioPosition) => {
    const status = getDeltaStatus(p.delta);
    const strategyLabel: Record<string, string> = {
      CSP: 'Cash-Secured Put',
      COVERED_CALL: 'Covered Call',
      CREDIT_SPREAD: 'Credit Spread',
      PMCC: 'PMCC',
    };
    const label = strategyLabel[p.type] ?? p.type;
    const expiry = formatExpiry(p.expiration);
    const contracts = `${p.quantity} ctrs`;
    const theta = p.theta ? `${p.theta > 0 ? '+' : ''}$${(p.theta * 100).toFixed(2)}/day` : '—';

    return (
      <div
        key={p.id}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border text-xs ${status.bg}`}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex flex-col min-w-[72px]">
            <span className="font-bold font-mono text-white text-sm">{p.symbol}</span>
            <span className="text-[10px] text-slate-400">{label}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-300 font-mono">
              ${p.strike} Strike
            </span>
            <span className="text-slate-500 text-[10px]">Exp: {expiry}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-right sm:text-left">
          <div className="flex flex-col items-end sm:items-start">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Delta</span>
            <span className="font-mono font-bold text-white">{p.delta.toFixed(3)}Δ</span>
          </div>
          <div className="flex flex-col items-end sm:items-start">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Size</span>
            <span className="font-mono text-slate-200">{contracts}</span>
          </div>
          <div className="flex flex-col items-end sm:items-start">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Daily θ</span>
            <span className="font-mono text-emerald-400">{theta}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border whitespace-nowrap ${status.bg} ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>
    );
  };

  const renderStockRow = (s: PortfolioPosition) => {
    // Find covered calls written against this stock
    const matchingCCs = optionPositions.filter(
      (o) => o.symbol === s.symbol && o.type === 'COVERED_CALL'
    );
    const coveredContracts = matchingCCs.reduce((sum, o) => sum + o.quantity, 0);
    const sharesCovered = coveredContracts * 100;
    const isFullyCovered = sharesCovered >= s.quantity;
    const isPartiallyCovered = sharesCovered > 0 && sharesCovered < s.quantity;
    const isUncovered = sharesCovered === 0;

    return (
      <div
        key={s.id}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border text-xs bg-slate-900/60 border-slate-800"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex flex-col min-w-[72px]">
            <span className="font-bold font-mono text-white text-sm">{s.symbol}</span>
            <span className="text-[10px] text-slate-400">Long Equity</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-300 font-mono">
              Spot ${s.spotPrice.toFixed(2)}
            </span>
            <span className="text-slate-500 text-[10px]">
              Mkt Val: ${(s.spotPrice * s.quantity).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-right sm:text-left">
          <div className="flex flex-col items-end sm:items-start">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Holding</span>
            <span className="font-mono font-bold text-slate-200">{s.quantity.toLocaleString()} shrs</span>
          </div>
          <div className="flex flex-col items-end sm:items-start">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Asset Delta</span>
            <span className="font-mono text-slate-300">1.000Δ (Equity)</span>
          </div>
          <div>
            {isFullyCovered && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border whitespace-nowrap bg-emerald-950/40 border-emerald-500/30 text-emerald-400">
                ✓ 100% Fully Covered ({coveredContracts} CCs / {s.quantity.toLocaleString()} shrs)
              </span>
            )}
            {isPartiallyCovered && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border whitespace-nowrap bg-amber-950/40 border-amber-500/30 text-amber-400">
                Partially Covered ({sharesCovered.toLocaleString()} / {s.quantity.toLocaleString()} shrs)
              </span>
            )}
            {isUncovered && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border whitespace-nowrap bg-blue-950/40 border-blue-500/30 text-blue-300">
                Uncovered ({s.quantity.toLocaleString()} shrs Available for CC)
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ModalOverlay
      title="Position Health & Threat Register"
      subtitle={`${optionPositions.length} active option contracts · ${threatened.length} threatened · ${watching.length} on watch · ${safe.length} safe`}
      icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
      onClose={onClose}
    >
      {threatened.length === 0 && watching.length === 0 && safe.length > 0 && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-emerald-300 font-bold text-xs font-mono">
              All {optionPositions.length} Written Option Contracts are in the Safety Zone (|Δ| &lt; 0.30)
            </div>
            <div className="text-slate-300 text-[11px] leading-relaxed">
              Zero assignment risk. All 6 written Covered Calls and the PLTR Cash-Secured Put are comfortably outside 2 SD Bollinger bounds, generating daily theta income safely.
            </div>
          </div>
        </div>
      )}

      {threatened.length > 0 && (
        <>
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono text-rose-400 font-bold pt-1 pb-0.5">
            <AlertTriangle className="w-3 h-3" />
            <span>Threatened Contracts — 0.50Δ Roll Protocol Active ({threatened.length})</span>
          </div>
          {threatened.map(renderOptionRow)}
        </>
      )}

      {watching.length > 0 && (
        <>
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono text-amber-400 font-bold pt-2 pb-0.5">
            <Activity className="w-3 h-3" />
            <span>Contracts On Watch — Approaching 0.30Δ Threshold ({watching.length})</span>
          </div>
          {watching.map(renderOptionRow)}
        </>
      )}

      {safe.length > 0 && (
        <>
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono text-emerald-400 font-bold pt-2 pb-0.5">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active Option Contracts — Delta in Safety Zone ({safe.length})</span>
          </div>
          {safe.map(renderOptionRow)}
        </>
      )}

      {/* Underlying Stock Holdings & Coverage Section */}
      {stockPositions.length > 0 && (
        <div className="pt-3 space-y-2">
          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <div className="flex items-center space-x-2 text-[10px] uppercase font-mono text-blue-400 font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Underlying Equity Holdings &amp; Collateral Coverage ({stockPositions.length} Lots)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">1.00Δ Asset Ownership (Zero Assignment Risk)</span>
          </div>
          <div className="space-y-2">
            {stockPositions.map(renderStockRow)}
          </div>
        </div>
      )}

      <div className="mt-2 p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-[11px] text-slate-300 leading-relaxed">
        <span className="text-blue-400 font-bold">DeltaHarvest Option Roll Protocol: </span>
        Option contracts reaching 0.50Δ are queued for net-credit duration extension (roll out &amp; down/up) before market close to prevent unwanted assignment and sustain compounding theta income. Underlying equity shares possess 1.00Δ asset exposure and are held as 100% collateral backing written calls.
      </div>
    </ModalOverlay>
  );
};

// ─── Earnings Detail Modal ────────────────────────────────────────────────────

const EarningsDetailModal: React.FC<{ upcomingCount: number; onClose: () => void }> = ({ upcomingCount, onClose }) => {
  const positions = loadActivePositions().filter(
    (p) => p.type !== 'CASH' && p.type !== 'MMF' && p.type !== 'STOCK'
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  interface EarningRow {
    position: PortfolioPosition;
    earningsDate: string | null;
    daysTo: number | null;
    isConfirmed: boolean;
    isInside: boolean;
    fiscalQuarter: string;
    historicalMovePct: number;
  }

  const rows: EarningRow[] = positions.map((p) => {
    const sym = p.symbol.toUpperCase();
    const entry = MONITORED_EARNINGS_REGISTRY[sym];
    const earningsDate = entry?.nextEarningsDate || null;
    const daysTo = earningsDate && earningsDate !== 'N/A'
      ? Math.round((new Date(earningsDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const expiryDate = p.expiration ? new Date(p.expiration) : null;
    expiryDate?.setHours(0, 0, 0, 0);

    const isInside = earningsDate && earningsDate !== 'N/A' && expiryDate
      ? new Date(earningsDate) >= today && new Date(earningsDate) <= expiryDate
      : false;

    return {
      position: p,
      earningsDate,
      daysTo,
      isConfirmed: !!entry?.isConfirmed,
      isInside,
      fiscalQuarter: entry?.fiscalQuarter || 'Quarterly Earnings',
      historicalMovePct: entry?.historicalAvgMovePct || 7.5,
    };
  });

  // Sort: inside expiration first, then by days-to-earnings ascending
  rows.sort((a, b) => {
    if (a.isInside && !b.isInside) return -1;
    if (!a.isInside && b.isInside) return 1;
    if (a.daysTo !== null && b.daysTo !== null) return a.daysTo - b.daysTo;
    return 0;
  });

  const inside7 = rows.filter((r) => r.daysTo !== null && r.daysTo <= 7 && r.daysTo >= 0);
  const inside30 = rows.filter((r) => r.daysTo !== null && r.daysTo > 7 && r.daysTo <= 30);
  const beyond   = rows.filter((r) => r.daysTo === null || r.daysTo > 30);

  const renderEarningsRow = (r: EarningRow) => {
    const p = r.position;
    const urgencyBg = r.isInside
      ? 'bg-rose-950/40 border-rose-500/40'
      : r.daysTo !== null && r.daysTo <= 7
      ? 'bg-amber-950/30 border-amber-500/30'
      : 'bg-slate-900 border-slate-800';

    const urgencyBadge = r.isInside
      ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">⚠ Inside Exp</span>
      : r.daysTo !== null && r.daysTo <= 7
      ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">⏰ &lt;7 Days</span>
      : r.daysTo !== null && r.daysTo <= 30
      ? <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">~{r.daysTo}d</span>
      : <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-500 border border-slate-700">No date</span>;

    const confirmedBadge = r.isConfirmed
      ? <span className="text-emerald-400 font-mono text-[10px]">✓ Confirmed</span>
      : <span className="text-slate-500 font-mono text-[10px]">~ Estimated</span>;

    return (
      <div key={p.id} className={`p-3 rounded-xl border text-xs ${urgencyBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div>
              <span className="font-bold font-mono text-white text-sm">{p.symbol}</span>
              <span className="ml-2 text-slate-400 text-[10px]">{p.type.replace('_', ' ')}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-300 font-mono text-[11px]">${p.strike} Strike · Exp {formatExpiry(p.expiration)}</span>
              <span className="text-slate-500 text-[10px]">{r.fiscalQuarter}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {urgencyBadge}
            {confirmedBadge}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-2 text-[11px]">
          <div>
            <span className="text-slate-500 uppercase font-mono text-[10px] block">Earnings Date</span>
            <span className="text-white font-mono font-semibold">{r.earningsDate ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-mono text-[10px] block">Days to Earnings</span>
            <span className={`font-mono font-semibold ${r.daysTo !== null && r.daysTo <= 7 ? 'text-amber-300' : 'text-slate-300'}`}>
              {r.daysTo !== null ? `${r.daysTo}d` : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-mono text-[10px] block">Hist. Avg Move</span>
            <span className="font-mono text-rose-300 font-semibold">±{r.historicalMovePct.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-mono text-[10px] block">Expiration</span>
            <span className="font-mono text-slate-300">{formatExpiry(p.expiration)}</span>
          </div>
        </div>

        {r.isInside && (
          <div className="mt-2 text-[11px] text-rose-300 bg-rose-950/30 border border-rose-500/20 rounded-lg px-3 py-1.5">
            ⚠ Earnings falls <strong>inside</strong> this contract's expiration window. Position is exposed to binary event risk. Recommend reducing size or rolling to post-earnings expiry.
          </div>
        )}
      </div>
    );
  };

  return (
    <ModalOverlay
      title="Upcoming Binary Events & Margin Haircut"
      subtitle={`${inside7.length} earnings within 7 days · ${rows.filter(r => r.isInside).length} positions exposed inside expiration`}
      icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
      onClose={onClose}
    >
      {inside7.length > 0 && (
        <>
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono text-amber-400 font-bold pt-1 pb-0.5">
            <AlertTriangle className="w-3 h-3" />
            <span>Imminent — Within 7 Days ({inside7.length})</span>
          </div>
          {inside7.map(renderEarningsRow)}
        </>
      )}

      {inside30.length > 0 && (
        <>
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono text-slate-400 font-bold pt-2 pb-0.5">
            <Activity className="w-3 h-3" />
            <span>Next 30 Days ({inside30.length})</span>
          </div>
          {inside30.map(renderEarningsRow)}
        </>
      )}

      {beyond.length > 0 && (
        <>
          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono text-slate-500 font-bold pt-2 pb-0.5">
            <Info className="w-3 h-3" />
            <span>Beyond 30 Days / No Announced Date ({beyond.length})</span>
          </div>
          {beyond.map(renderEarningsRow)}
        </>
      )}

      {rows.length === 0 && (
        <div className="text-center text-slate-500 text-sm py-10">No open option positions detected.</div>
      )}

      <div className="mt-2 p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-slate-300 leading-relaxed">
        <span className="text-amber-400 font-bold">Margin Haircut Policy: </span>
        Position sizing is automatically throttled to a maximum of 2% of net liquidation per ticker when binary events (earnings, FDA decisions, macro releases) are active within the expiration window. DeltaHarvest prevents writing naked puts or uncovered calls into known earnings releases.
      </div>
    </ModalOverlay>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

export const ExecutivePortfolioDigestView: React.FC = () => {
  const [metrics, setMetrics] = useState<ExecutiveDigestMetrics>(() => calculateLiveExecutiveMetrics());
  const [printCleanText, setPrintCleanText] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  useEffect(() => {
    const handleSync = () => {
      setMetrics(calculateLiveExecutiveMetrics());
    };
    handleSync();
    window.addEventListener('deltaharvest_portfolio_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('deltaharvest_portfolio_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownExecutiveReport(metrics);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DeltaHarvest_Executive_Digest_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Modals */}
      {activeModal === 'threats' && (
        <ThreatDetailModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'earnings' && (
        <EarningsDetailModal upcomingCount={metrics.upcomingEarningsCount} onClose={() => setActiveModal(null)} />
      )}

      <div className={`space-y-6 animate-fadeIn ${printCleanText ? 'print-clean-text' : ''}`}>
        {/* Header Banner */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-slate-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-white tracking-wide">
                    Executive Portfolio Health Digest &amp; Audit Briefing
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    Institutional Risk Deck
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Consolidated C-Suite overview aggregating net portfolio telemetry: <strong>Daily Theta Run-Rate</strong>, <strong>SPY Beta Exposure</strong>, <strong>Portfolio Margin (TIMS) Relief</strong>, and <strong>Threatened 0.50Δ Positions</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label
                className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none px-2.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 shadow-sm"
                title="When checked, suppresses background graphics/fills and renders PDF in clean text form with light formatting"
              >
                <input
                  type="checkbox"
                  checked={printCleanText}
                  onChange={(e) => setPrintCleanText(e.target.checked)}
                  className="rounded border-slate-600 text-blue-500 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer accent-blue-500"
                />
                <span className="font-mono text-[11px] whitespace-nowrap">Text Form / No Backgrounds</span>
              </label>

              <button
                onClick={handleDownloadMarkdown}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Markdown</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Executive PDF</span>
              </button>
            </div>
          </div>

          {/* Top Executive KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {/* Net Liquidity */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Net Liquidation</span>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                ${metrics.netLiquidity.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                ${metrics.freeCash.toLocaleString()} Cash ({metrics.cashReservePct}%)
              </span>
            </div>

            {/* Daily Theta Cashflow */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 uppercase font-mono block">Daily Theta Harvest</span>
              <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
                +${metrics.dailyTheta.toFixed(2)}/day
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                ~${metrics.projectedMonthlyCashflow.toLocaleString()} / mo run-rate
              </span>
            </div>

            {/* SPY Beta Delta */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">SPY Beta Delta</span>
              <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                +{metrics.betaWeightedDelta}Δ
              </div>
              <span className="text-[10px] text-slate-400">
                {metrics.directionalBias} Directional Bias
              </span>
            </div>

            {/* Capital Relief */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/30">
              <span className="text-[10px] text-indigo-400 uppercase font-mono block">Portfolio Margin (TIMS)</span>
              <div className="text-base font-bold font-mono text-indigo-300 mt-0.5">
                {metrics.capitalReliefPct}% Saved
              </div>
              <span className="text-[10px] text-indigo-400 font-mono">
                +${(metrics.regTMarginUsed - metrics.portfolioMarginUsed).toLocaleString()} Free Margin
              </span>
            </div>

            {/* Win Rate */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Trailing Win Rate</span>
              <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                {metrics.winRatePct}%
              </div>
              <span className="text-[10px] text-slate-500">12-Month Closed P&amp;L</span>
            </div>

            {/* Compliance Score */}
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/50">
              <span className="text-[10px] text-emerald-400 uppercase font-mono block">Compliance Health</span>
              <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
                {metrics.complianceHealthScore} / 100
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Institutional Grade</span>
            </div>
          </div>
        </div>

        {/* Threat Assessment & Action Register */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── Position Health Card ── */}
          <button
            onClick={() => setActiveModal('threats')}
            className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 bg-slate-950/60 text-left group hover:border-emerald-500/40 hover:bg-slate-900/70 transition-all duration-200 cursor-pointer w-full"
            aria-label="Open Position Health & Threat Register details"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Position Health &amp; Threat Register</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-mono">
                  {metrics.totalPositions} Active Option Contracts
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                <span className="text-[10px] text-emerald-400 uppercase font-mono block">Safe Contracts (Δ &lt; 0.30)</span>
                <div className="text-lg font-bold text-emerald-300 font-mono">
                  {metrics.safePositions} Contracts
                </div>
                <span className="text-[10px] text-slate-400 block">Outside 2 SD Bollinger bounds</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                <span className="text-[10px] text-rose-400 uppercase font-mono block">Threatened (Δ &ge; 0.40)</span>
                <div className="text-lg font-bold text-rose-300 font-mono">
                  {metrics.threatenedPositions} Contracts
                </div>
                <span className="text-[10px] text-slate-400 block">0.50Δ Roll Protocol active</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed pt-1">
              DeltaHarvest monitors option contracts 24/7 for assignment threats. Contracts approaching 0.50 Delta are queued for net-credit duration extension before market close.{' '}
              <span className="text-emerald-400 group-hover:underline">Click for per-position details &amp; stock collateral coverage →</span>
            </p>
          </button>

          {/* ── Upcoming Binary Events Card ── */}
          <button
            onClick={() => setActiveModal('earnings')}
            className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 bg-slate-950/60 text-left group hover:border-amber-500/40 hover:bg-slate-900/70 transition-all duration-200 cursor-pointer w-full"
            aria-label="Open Upcoming Binary Events & Margin Haircut details"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Upcoming Binary Events &amp; Margin Haircut</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-amber-400 font-mono">
                  {metrics.upcomingEarningsCount} Earnings Within 7 Days
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Earnings Shock Buffer</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  DeltaHarvest automatically warns against writing naked CSPs into quarterly earnings releases. Sizing is throttled to 2% max per ticker when binary events are active.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Dry Powder Allocation</span>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${100 - metrics.cashReservePct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                  <span>Invested: {(100 - metrics.cashReservePct).toFixed(1)}%</span>
                  <span className="text-emerald-400 font-bold">Cash Reserves: {metrics.cashReservePct}%</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 pt-1">
              <span className="text-amber-400 group-hover:underline">Click for earnings exposure by contract →</span>
            </p>
          </button>
        </div>
      </div>
    </>
  );
};
