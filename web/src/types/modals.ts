import { TickerMeta, OptionOpportunity, MultiLegSpread } from './options';
import { StagedBracketOrder } from '../utils/brokerOrderStaging';

export interface SimulatorInitialData {
  ticker?: string;
  expiration?: string;
  ivRank?: number;
  delta?: number;
  distTo50Sma?: number;
  strategy?: 'CASH_SECURED_PUT' | 'COVERED_CALL';
  dataSource?: 'BARCHART' | 'MARKETCHAMELEON';
}

export interface ModalState {
  selectedTicker: TickerMeta | null;
  selectedOpportunity: OptionOpportunity | null;
  calculatorOpportunity: OptionOpportunity | null;
  isCommandPaletteOpen: boolean;
  isHelpModalOpen: boolean;
  isWatchlistModalOpen: boolean;
  isReportQueryModalOpen: boolean;
  isTradierModalOpen: boolean;
  isSchwabModalOpen: boolean;
  isDiagnosticsOpen: boolean;
  isAlertsModalOpen: boolean;
  isSimulatorModalOpen: boolean;
  simulatorInitialData: SimulatorInitialData;
  isStagedModalOpen: boolean;
  stagedOrder: StagedBracketOrder | null;
  activeStagedOpportunity: OptionOpportunity | null;
  activeStagedSpread: MultiLegSpread | null;
  isValuationModalOpen: boolean;
  valuationInitialTicker?: string;
}
