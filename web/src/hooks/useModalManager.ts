import { useState, useCallback } from 'react';
import { TickerMeta, OptionOpportunity, MultiLegSpread } from '../types/options';
import { StagedBracketOrder } from '../utils/brokerOrderStaging';
import { ModalState, SimulatorInitialData } from '../types/modals';

export function useModalManager() {
  const [selectedTicker, setSelectedTicker] = useState<TickerMeta | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OptionOpportunity | null>(null);
  const [calculatorOpportunity, setCalculatorOpportunity] = useState<OptionOpportunity | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState<boolean>(false);
  const [isReportQueryModalOpen, setIsReportQueryModalOpen] = useState<boolean>(false);
  const [isTradierModalOpen, setIsTradierModalOpen] = useState<boolean>(false);
  const [isSchwabModalOpen, setIsSchwabModalOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState<boolean>(false);
  const [simulatorInitialData, setSimulatorInitialData] = useState<SimulatorInitialData>({});
  const [stagedOrder, setStagedOrder] = useState<StagedBracketOrder | null>(null);
  const [isStagedModalOpen, setIsStagedModalOpen] = useState<boolean>(false);
  const [activeStagedOpportunity, setActiveStagedOpportunity] = useState<OptionOpportunity | null>(null);
  const [activeStagedSpread, setActiveStagedSpread] = useState<MultiLegSpread | null>(null);
  const [isValuationModalOpen, setIsValuationModalOpen] = useState<boolean>(false);
  const [valuationInitialTicker, setValuationInitialTicker] = useState<string>('NVDA');

  const openTickerAudit = useCallback((ticker: TickerMeta) => {
    setSelectedTicker(ticker);
  }, []);

  const closeTickerAudit = useCallback(() => {
    setSelectedTicker(null);
  }, []);

  const openOptionDetail = useCallback((opp: OptionOpportunity) => {
    setSelectedOpportunity(opp);
  }, []);

  const closeOptionDetail = useCallback(() => {
    setSelectedOpportunity(null);
  }, []);

  const openCalculator = useCallback((opp: OptionOpportunity) => {
    setCalculatorOpportunity(opp);
  }, []);

  const closeCalculator = useCallback(() => {
    setCalculatorOpportunity(null);
  }, []);

  const openSimulator = useCallback((initialData?: SimulatorInitialData) => {
    if (initialData) setSimulatorInitialData(initialData);
    setIsSimulatorModalOpen(true);
  }, []);

  const closeSimulator = useCallback(() => {
    setIsSimulatorModalOpen(false);
  }, []);

  const openStagedModal = useCallback(
    (order: StagedBracketOrder, opp?: OptionOpportunity | null, spread?: MultiLegSpread | null) => {
      setStagedOrder(order);
      setActiveStagedOpportunity(opp || null);
      setActiveStagedSpread(spread || null);
      setIsStagedModalOpen(true);
    },
    []
  );

  const closeStagedModal = useCallback(() => {
    setIsStagedModalOpen(false);
  }, []);

  const openValuation = useCallback((ticker: string = 'NVDA') => {
    setValuationInitialTicker(ticker);
    setIsValuationModalOpen(true);
  }, []);

  const closeValuation = useCallback(() => {
    setIsValuationModalOpen(false);
  }, []);

  const state: ModalState = {
    selectedTicker,
    selectedOpportunity,
    calculatorOpportunity,
    isCommandPaletteOpen,
    isHelpModalOpen,
    isWatchlistModalOpen,
    isReportQueryModalOpen,
    isTradierModalOpen,
    isSchwabModalOpen,
    isDiagnosticsOpen,
    isAlertsModalOpen,
    isSimulatorModalOpen,
    simulatorInitialData,
    isStagedModalOpen,
    stagedOrder,
    activeStagedOpportunity,
    activeStagedSpread,
    isValuationModalOpen,
    valuationInitialTicker,
  };

  return {
    state,
    setSelectedTicker,
    setSelectedOpportunity,
    setCalculatorOpportunity,
    setIsCommandPaletteOpen,
    setIsHelpModalOpen,
    setIsWatchlistModalOpen,
    setIsReportQueryModalOpen,
    setIsTradierModalOpen,
    setIsSchwabModalOpen,
    setIsDiagnosticsOpen,
    setIsAlertsModalOpen,
    setIsSimulatorModalOpen,
    setSimulatorInitialData,
    setStagedOrder,
    setIsStagedModalOpen,
    setActiveStagedOpportunity,
    setActiveStagedSpread,
    setIsValuationModalOpen,
    setValuationInitialTicker,
    openTickerAudit,
    closeTickerAudit,
    openOptionDetail,
    closeOptionDetail,
    openCalculator,
    closeCalculator,
    openSimulator,
    closeSimulator,
    openStagedModal,
    closeStagedModal,
    openValuation,
    closeValuation,
  };
}
