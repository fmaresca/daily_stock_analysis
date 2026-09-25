import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { Check, ShieldAlert, Zap, ShieldCheck } from '../../../icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterBrokerExecutionProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
  onOpenTradier?: () => void;
  onOpenSchwab?: () => void;
  onOpenDiagnostics?: () => void;
}

export const ChapterBrokerExecution: React.FC<ChapterBrokerExecutionProps> = ({
  onNavigate,
  onOpenTradier,
  onOpenSchwab,
  onOpenDiagnostics,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-amber-500 pl-4 py-1">
        <h3 className="text-base font-bold text-white">Institutional Order Staging, Bracket Execution &amp; Risk Circuit Breakers</h3>
        <p className="text-slate-400 mt-1">
          Bridging quantitative screening directly into error-free brokerage execution for Charles Schwab, Interactive Brokers (IBKR), and Thinkorswim.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Broker Staging Workbench',
            location: 'Workflow > Step 7: Broker Staging',
            onClick: () => onNavigate?.('WORKFLOW', 'BROKER_STAGING'),
          },
          {
            label: 'Tradier API Configuration',
            location: 'Modal: Tradier Settings',
            onClick: onOpenTradier,
          },
          {
            label: 'Schwab OAuth Configuration',
            location: 'Modal: Schwab Settings',
            onClick: onOpenSchwab,
          },
          {
            label: 'API Network Diagnostics',
            location: 'Modal: Diagnostics',
            onClick: onOpenDiagnostics,
          },
        ]}
      />

      {/* The 80% Profit-Decay Rule & Defensive Roll Rule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950/70 p-4 rounded-xl border border-amber-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
            <Check className="w-4 h-4" />
            <span>The Mandatory 80% Profit-Taking Bracket</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Options decay non-linearly. The last 20% of premium carries disproportionate tail risk for minuscule incremental yield. DeltaHarvest automatically stages a <strong>Good-Til-Cancelled (GTC) Buy-to-Close Limit Order at 20% of the initial premium collected</strong> (0.20 &times; Entry Price). This locks in 80% maximum profit, cleanses portfolio margin, and frees capital for the next cycle.
          </p>
        </div>

        <div className="bg-slate-950/70 p-4 rounded-xl border border-rose-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>0.50 Delta / 200% Defensive Roll Trigger</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            If an underlying drops toward your put strike and the contract delta touches <strong>0.50</strong> (or option price doubles to 200% of entry premium), the defensive rule triggers: <strong>never take assignment passively</strong>. Roll the contract out in time (to the next monthly cycle) and down in strike for an additional net credit to restore delta neutrality.
          </p>
        </div>
      </div>

      {/* Multi-Broker Protocols Breakdown */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Multi-Broker Execution Protocols</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-blue-400">Charles Schwab Retail Trader API</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Conforms to Schwab's REST order schema. Staged as a <code className="text-slate-300">TRIGGER</code> complex order: primary limit fill immediately schedules the 80% profit-taking child order. Supports direct 1-click transmission and accepts either full redirect callback URLs (<code className="text-slate-300">https://127.0.0.1/?code=...</code>) or bare authorization codes.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-rose-400">Interactive Brokers (TWS BasketTrader)</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Exports compliant <code className="text-slate-300">.csv</code> files formatted for TWS BasketTrader. Traders can drag and drop multiple staged legs directly into TWS for synchronized limit execution.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">Thinkorswim (ToS) Syntax</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Outputs standard 1-line copyable execution text (e.g. <code className="text-slate-300">SELL -1 SPY 100 18 OCT 26 550 PUT @2.85 LMT</code>) ready for instantaneous paste into Thinkorswim's Order Entry bar.
            </p>
          </div>
        </div>
      </div>

      {/* Position Sizing & Concentration Guardrail */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/30 space-y-2">
        <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>The 10% Single-Underlying Concentration Guardrail</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          No single option assignment should ever consume more than <strong>10% of total portfolio equity</strong>. When staging orders, DeltaHarvest automatically calculates required margin against your account equity and flags a yellow or red circuit-breaker warning if position sizing violates institutional diversification limits.
        </p>
      </div>
    </div>
  );
};
