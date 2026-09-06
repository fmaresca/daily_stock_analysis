import React from 'react';
import { ModalWrapper } from '../ui/ModalWrapper';
import { OptionsTradeQualitySimulator } from './OptionsTradeQualitySimulator';
import { OptionStrategyType } from '../../types/optionsScreener.types';

export interface OptionsTradeQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStrategy?: OptionStrategyType;
  initialIvRank?: number;
  initialDelta?: number;
  initialDistTo50Sma?: number;
}

export const OptionsTradeQualityModal: React.FC<OptionsTradeQualityModalProps> = ({
  isOpen,
  onClose,
  initialStrategy = 'CASH_SECURED_PUT',
  initialIvRank = 48,
  initialDelta = 0.18,
  initialDistTo50Sma = -5.1,
}) => {
  if (!isOpen) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="5xl"
      hideHeader={true}
    >
      <OptionsTradeQualitySimulator
        initialStrategy={initialStrategy}
        initialIvRank={initialIvRank}
        initialDelta={initialDelta}
        initialDistTo50Sma={initialDistTo50Sma}
        onClose={onClose}
        isModal={true}
      />
    </ModalWrapper>
  );
};
