import axios from 'axios';
import type {
  CoveredCallScreenResponse,
  RollOptimizerResponse,
  PayoffCurveResponse,
} from '../types/coveredCall';

export const coveredCallApi = {
  async screen(params: {
    symbols?: string[];
    min_dte?: number;
    max_dte?: number;
    target_delta_min?: number;
    target_delta_max?: number;
    min_ivp?: number;
    exclude_earnings?: boolean;
  }): Promise<CoveredCallScreenResponse> {
    const res = await axios.post<CoveredCallScreenResponse>(
      '/api/v1/options/covered-calls/screen',
      {
        symbols: params.symbols || ['AAPL', 'MSFT', 'NVDA', 'TSLA'],
        min_dte: params.min_dte ?? 7,
        max_dte: params.max_dte ?? 60,
        target_delta_min: params.target_delta_min ?? 0.15,
        target_delta_max: params.target_delta_max ?? 0.40,
        min_ivp: params.min_ivp ?? 0.0,
        exclude_earnings: params.exclude_earnings ?? false,
      }
    );
    return res.data;
  },

  async optimizeRoll(params: {
    symbol: string;
    current_strike: number;
    current_expiration: string;
    cost_basis?: number;
    target_min_dte?: number;
    target_max_dte?: number;
  }): Promise<RollOptimizerResponse> {
    const res = await axios.post<RollOptimizerResponse>(
      '/api/v1/options/covered-calls/roll-optimizer',
      params
    );
    return res.data;
  },

  async getPayoff(params: {
    spot: number;
    strike: number;
    premium: number;
    contracts?: number;
    cost_basis?: number;
  }): Promise<PayoffCurveResponse> {
    const res = await axios.post<PayoffCurveResponse>(
      '/api/v1/options/covered-calls/payoff',
      params
    );
    return res.data;
  },
};
