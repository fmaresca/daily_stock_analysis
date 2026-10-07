import React, { useState, useRef, useEffect } from 'react';

export type JargonTermKey =
  | 'CSP'
  | 'CC'
  | 'PMCC'
  | '25Δ'
  | 'Delta'
  | 'Iron Condor'
  | 'Section 1256'
  | '1256'
  | 'DCF'
  | 'DuPont'
  | 'TIMS'
  | 'IV Rank'
  | 'IVR'
  | 'DTE'
  | 'POP';

interface JargonDefinition {
  name: string;
  definition: string;
}

const JARGON_DICTIONARY: Record<string, JargonDefinition> = {
  CSP: {
    name: 'Cash-Secured Put',
    definition: 'An option trade where you get paid cash today for agreeing to buy a stock at a discount if it drops.',
  },
  CC: {
    name: 'Covered Call',
    definition: 'An option trade where you get paid cash today for agreeing to sell shares you already own at a higher price.',
  },
  PMCC: {
    name: "Poor Man's Covered Call",
    definition: 'Using an inexpensive long-term option instead of 100 shares of stock to collect weekly income.',
  },
  '25Δ': {
    name: '25 Delta Strike',
    definition: 'A strike price positioned so the trade has an approximately 75% to 80% statistical chance of winning.',
  },
  Delta: {
    name: 'Option Delta (Δ)',
    definition: 'The probability that an option expires in-the-money, or how much its price moves per $1 stock change.',
  },
  'Iron Condor': {
    name: 'Iron Condor Spread',
    definition: 'A four-leg trade that collects cash upfront and wins if the stock stays within a wide price range.',
  },
  'Section 1256': {
    name: 'IRC §1256 Tax Rule',
    definition: 'A federal tax rule taxing index option profits at a lower blended rate (60% long-term, 40% short-term).',
  },
  '1256': {
    name: 'IRC §1256 Tax Rule',
    definition: 'A federal tax rule taxing index option profits at a lower blended rate (60% long-term, 40% short-term).',
  },
  DCF: {
    name: 'Discounted Cash Flow',
    definition: 'A valuation model estimating what a company is really worth based on its projected future cash generation.',
  },
  DuPont: {
    name: 'DuPont ROE Analysis',
    definition: 'A method breaking down company return-on-equity into profit margin, asset turnover, and leverage.',
  },
  TIMS: {
    name: 'Theoretical Intermarket Margin (TIMS)',
    definition: 'A FINRA margin system calculating the worst-case capital loss of an options portfolio under stress.',
  },
  'IV Rank': {
    name: 'Implied Volatility Rank (IVR)',
    definition: 'A 0–100 score showing whether option payouts are currently cheap (low rank) or expensive (high rank).',
  },
  IVR: {
    name: 'Implied Volatility Rank (IVR)',
    definition: 'A 0–100 score showing whether option payouts are currently cheap (low rank) or expensive (high rank).',
  },
  DTE: {
    name: 'Days to Expiration',
    definition: 'The exact number of calendar days remaining until an option contract expires.',
  },
  POP: {
    name: 'Probability of Profit',
    definition: 'The mathematical chance that an option trade will expire profitably without taking a loss.',
  },
};

interface JargonTooltipProps {
  term: JargonTermKey | string;
  children?: React.ReactNode;
  className?: string;
}

export const JargonTooltip: React.FC<JargonTooltipProps> = ({ term, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const entry = JARGON_DICTIONARY[term] || { name: term, definition: 'Financial term used in options income strategy.' };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <span
      ref={containerRef}
      className={`relative inline-block cursor-help group ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen((prev) => !prev);
      }}
    >
      <span className="border-b border-dotted border-slate-500 hover:border-emerald-400 text-inherit transition-colors">
        {children || term}
      </span>

      {isOpen && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl z-50 text-left pointer-events-none animate-fade-in text-xs font-normal"
          role="tooltip"
        >
          <span className="block font-bold text-emerald-300 text-[11px] mb-1">
            {entry.name}
          </span>
          <span className="block text-slate-300 text-[11px] leading-relaxed">
            {entry.definition}
          </span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-700/80" />
        </span>
      )}
    </span>
  );
};
