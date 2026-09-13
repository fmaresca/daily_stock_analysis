import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { Calendar, TrendingUp, ShieldAlert } from '../../../icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterEconomicCalendarProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
}

export const ChapterEconomicCalendar: React.FC<ChapterEconomicCalendarProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-blue-400 pl-4 py-1">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          <span>Weekly US Economic Indicators &amp; Macro Catalyst Radar</span>
        </h3>
        <p className="text-slate-400 mt-1">
          Macroeconomic releases trigger predictable sector-level re-pricings, sudden volatility spikes, and Implied Volatility (IV) expansion. Understanding these transmission mechanisms allows income options traders to protect short strikes and avoid binary gap events.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Economic Indicators Calendar View',
            location: 'Equities > Economic Calendar',
            onClick: () => onNavigate?.('EQUITIES', undefined, 'ECONOMIC_CALENDAR'),
          },
          {
            label: 'Workflow Step 4: Macro & Earnings Guard',
            location: 'Workflow > Economic Calendar',
            onClick: () => onNavigate?.('WORKFLOW', 'ECONOMIC_CALENDAR'),
          },
        ]}
      />

      {/* Transmission Matrix Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>8 Core Economic Indicator Transmission Channels</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-rose-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-300">1. CPI / Core CPI &amp; PCE Deflator</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">HIGH IMPACT</span>
            </div>
            <div className="text-[11px] text-cyan-300 font-mono">Proxies: QQQ, XLK, VNQ, XLU, XLF, TLT</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Shifting discount rate expectations directly compress long-duration tech valuations, dividend cap rates, and bank margins. Higher-than-expected inflation triggers sharp tech sell-offs.
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-rose-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-300">2. FOMC Rate Decision &amp; Presser</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">HIGH IMPACT</span>
            </div>
            <div className="text-[11px] text-cyan-300 font-mono">Proxies: SPY, QQQ, KRE, IWM, VNQ, GLD</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Sets the benchmark cost of capital. Determines commercial bank net interest margins, small-cap debt financing stability, and broad market equity risk premiums.
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-rose-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-300">3. Non-Farm Payrolls (NFP) &amp; Unemployment</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">HIGH IMPACT</span>
            </div>
            <div className="text-[11px] text-cyan-300 font-mono">Proxies: XLY, XLI, XLF, IWM</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Primary gauge of labor market tightness and consumer spending power. Strong wage numbers fuel inflation fears, while unexpected job contraction triggers recessionary flight-to-safety.
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-rose-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-300">4. Retail Sales m/m</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">HIGH IMPACT</span>
            </div>
            <div className="text-[11px] text-cyan-300 font-mono">Proxies: XLY, XRT, IYT, AMZN, WMT</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Direct bellwether for consumer resilience and corporate top-line volume. Divergence between goods and services spending signals cyclical inflection points.
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-amber-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300">5. ISM Manufacturing &amp; Services PMI</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">MODERATE</span>
            </div>
            <div className="text-[11px] text-cyan-300 font-mono">Proxies: XLI, XLB, SOXX</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Leading cyclical indicator. Levels &gt; 50 denote economic expansion, while &lt; 50 signal contracting industrial and new order velocity.
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-amber-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300">6. Initial Jobless Claims (Weekly)</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">MODERATE</span>
            </div>
            <div className="text-[11px] text-cyan-300 font-mono">Proxies: SPY, IWM</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              High-frequency weekly labor health thermometer published every Thursday at 8:30 AM ET. Rapid rises above 240K signal labor demand softening.
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-amber-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300">7. EIA Crude Oil Inventories</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">MODERATE</span>
            </div>
            <div className="text-[11px] text-cyan-300 font-mono">Proxies: XLE, XOP, JETS, IYT</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Weekly commercial inventory builds or draws swinging jet fuel and transportation input costs, impacting airline and logistics operating margins.
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">8. Housing Starts &amp; Existing Home Sales</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono font-bold">LOW / MODERATE</span>
            </div>
            <div className="text-[11px] text-cyan-300 font-mono">Proxies: ITB, XHB, VNQ, HD, LOW</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Measures mortgage rate sensitivity and order absorption. Key driver for residential homebuilders and home improvement retailers.
            </p>
          </div>
        </div>
      </div>

      {/* Volatility & Options Defense Strategy */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-white font-bold">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Tactical Options Rules: Macro Timing &amp; IV Crush Harvesting</span>
        </div>
        <ul className="list-disc list-inside text-slate-300 space-y-1.5 pl-1 leading-relaxed">
          <li><strong>Avoid Opening 24h Before High-Impact Releases:</strong> DeltaHarvest algorithms flag naked puts or tight credit spreads opening immediately ahead of CPI or FOMC due to binary event risk.</li>
          <li><strong>Post-Event IV Crush Harvesting:</strong> Once a major release is published (e.g. 8:31 AM ET post-CPI or 2:30 PM ET post-FOMC), implied volatility collapses. This is the optimal window to sell high-IV cash-secured puts with wide downside cushions (&ge;4.5%).</li>
          <li><strong>Multi-Tier Resilient Feed Ingestion:</strong> The Radar utilizes a 3-tier architecture: <em>Tier 1: Forex Factory Live Feed</em>, <em>Tier 2: Nasdaq Live Calendar Radar</em> backup, and <em>Tier 3: Curated High-Impact Weekly Schedule</em>.</li>
          <li><strong>Upcoming vs. Past Week Scope Selector:</strong> Easily toggle between the upcoming trading week (e.g. Sep 14 – 18 with FOMC Rate Decision, Retail Sales, Quadruple Witching) and the historical past week archive (e.g. Sep 7 – 11 with CPI &amp; PPI prints).</li>
          <li><strong>Live Eastern Time (ET) Synchronization:</strong> Real-time feed status badges indicate the active source (Forex Factory, Nasdaq, or Curated Schedule) along with live synchronization timestamps. Clicking &quot;Refresh Feed&quot; forces an immediate edge and cache bypass for the active scope.</li>
        </ul>
      </div>
    </div>
  );
};
