import { useCallback } from 'react';
import {
  TickerMeta,
  OptionOpportunity,
  MultiLegSpread,
} from '../types/options';
import { OptionContractData } from '../utils/optionChainMatrix';
import {
  stageSingleLegOrder,
  stageMultiLegSpreadOrder,
  StagedBracketOrder,
  AccountType,
  PriceExecutionType,
} from '../utils/brokerOrderStaging';

export interface UseOrderStagingProps {
  universeTickers: TickerMeta[];
  modalState: {
    activeStagedOpportunity: OptionOpportunity | null;
    activeStagedSpread: MultiLegSpread | null;
    stagedOrder: StagedBracketOrder | null;
  };
  openStagedModal: (order: StagedBracketOrder, opp: OptionOpportunity | null, spread: MultiLegSpread | null) => void;
  setStagedOrder: (order: StagedBracketOrder | null) => void;
}

export function useOrderStaging({
  universeTickers,
  modalState,
  openStagedModal,
  setStagedOrder,
}: UseOrderStagingProps) {
  const handleStageOpportunity = useCallback((opp: OptionOpportunity) => {
    const meta = universeTickers.find((t) => t.symbol === opp.symbol);
    const staged = stageSingleLegOrder(opp, meta, 1, 'SCHWAB', 'REG_T_MARGIN', 'MIDPOINT');
    openStagedModal(staged, opp, null);
  }, [universeTickers, openStagedModal]);

  const handleStageSpread = useCallback((spread: MultiLegSpread) => {
    const order = stageMultiLegSpreadOrder(spread, 1, 'SCHWAB', 'REG_T_MARGIN', 'MIDPOINT');
    openStagedModal(order, null, spread);
  }, [openStagedModal]);

  const handleStageContractFromChain = useCallback((contract: OptionContractData, spotPrice: number) => {
    const isPut = contract.type === 'PUT';
    const opp: OptionOpportunity = {
      id: `CHAIN_${contract.underlyingSymbol}_${contract.strike}_${contract.type}`,
      symbol: contract.underlyingSymbol,
      name: contract.underlyingSymbol,
      category: 'Equities',
      sector: 'Technology',
      liquidity_tier: 'Tier 1',
      strategy: isPut ? 'CSP' : 'COVERED_CALL',
      strategy_name: isPut ? 'Cash-Secured Put' : 'Covered Call',
      expiration: contract.expiration,
      dte: contract.dte,
      current_price: spotPrice,
      strike: contract.strike,
      type: isPut ? 'put' : 'call',
      bid: contract.bid,
      ask: contract.ask,
      mid: contract.mid,
      collateral_required: isPut ? contract.strike * 100 : spotPrice * 100,
      premium_total: Math.round(contract.mid * 100),
      breakeven: isPut ? contract.strike - contract.mid : spotPrice - contract.mid,
      cushion_pct: isPut ? Math.round(((spotPrice - contract.strike) / spotPrice) * 1000) / 10 : 0,
      roc_pct: Math.round((contract.mid / (isPut ? contract.strike : spotPrice)) * 1000) / 10,
      annualized_roc: Math.round((contract.mid / (isPut ? contract.strike : spotPrice)) * (365 / Math.max(1, contract.dte)) * 1000) / 10,
      delta: contract.delta,
      abs_delta: Math.abs(contract.delta),
      theta: contract.theta,
      pop_pct: Math.round((1 - Math.abs(contract.delta)) * 1000) / 10,
      iv: contract.iv,
      iv_rank: 35,
      rsi: 50,
      safety_tier: 'Option Chain Contract',
      tier_color: 'cyan',
      tags: ['OPTION_CHAIN', contract.type],
      rating: 85,
    };
    handleStageOpportunity(opp);
  }, [handleStageOpportunity]);

  const handleUpdateStagedQuantity = useCallback((qty: number) => {
    if (modalState.activeStagedOpportunity) {
      const meta = universeTickers.find((t) => t.symbol === modalState.activeStagedOpportunity?.symbol);
      const updated = stageSingleLegOrder(
        modalState.activeStagedOpportunity,
        meta,
        qty,
        modalState.stagedOrder?.broker || 'SCHWAB',
        modalState.stagedOrder?.accountType || 'REG_T_MARGIN',
        modalState.stagedOrder?.pricingType || 'MIDPOINT'
      );
      setStagedOrder(updated);
    } else if (modalState.activeStagedSpread) {
      const updated = stageMultiLegSpreadOrder(
        modalState.activeStagedSpread,
        qty,
        modalState.stagedOrder?.broker || 'SCHWAB',
        modalState.stagedOrder?.accountType || 'REG_T_MARGIN',
        modalState.stagedOrder?.pricingType || 'MIDPOINT'
      );
      setStagedOrder(updated);
    }
  }, [universeTickers, modalState, setStagedOrder]);

  const handleUpdateStagedAccountType = useCallback((acc: AccountType) => {
    if (modalState.activeStagedOpportunity) {
      const meta = universeTickers.find((t) => t.symbol === modalState.activeStagedOpportunity?.symbol);
      const updated = stageSingleLegOrder(
        modalState.activeStagedOpportunity,
        meta,
        modalState.stagedOrder?.quantity || 1,
        modalState.stagedOrder?.broker || 'SCHWAB',
        acc,
        modalState.stagedOrder?.pricingType || 'MIDPOINT'
      );
      setStagedOrder(updated);
    } else if (modalState.activeStagedSpread) {
      const updated = stageMultiLegSpreadOrder(
        modalState.activeStagedSpread,
        modalState.stagedOrder?.quantity || 1,
        modalState.stagedOrder?.broker || 'SCHWAB',
        acc,
        modalState.stagedOrder?.pricingType || 'MIDPOINT'
      );
      setStagedOrder(updated);
    }
  }, [universeTickers, modalState, setStagedOrder]);

  const handleUpdateStagedPricingType = useCallback((pricing: PriceExecutionType) => {
    if (modalState.activeStagedOpportunity) {
      const meta = universeTickers.find((t) => t.symbol === modalState.activeStagedOpportunity?.symbol);
      const updated = stageSingleLegOrder(
        modalState.activeStagedOpportunity,
        meta,
        modalState.stagedOrder?.quantity || 1,
        modalState.stagedOrder?.broker || 'SCHWAB',
        modalState.stagedOrder?.accountType || 'REG_T_MARGIN',
        pricing
      );
      setStagedOrder(updated);
    } else if (modalState.activeStagedSpread) {
      const updated = stageMultiLegSpreadOrder(
        modalState.activeStagedSpread,
        modalState.stagedOrder?.quantity || 1,
        modalState.stagedOrder?.broker || 'SCHWAB',
        modalState.stagedOrder?.accountType || 'REG_T_MARGIN',
        pricing
      );
      setStagedOrder(updated);
    }
  }, [universeTickers, modalState, setStagedOrder]);

  return {
    handleStageOpportunity,
    handleStageSpread,
    handleStageContractFromChain,
    handleUpdateStagedQuantity,
    handleUpdateStagedAccountType,
    handleUpdateStagedPricingType,
  };
}
