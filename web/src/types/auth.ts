export type UserRole = 'ADMIN' | 'CLIENT';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  status: AccountStatus;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  displayName: string;
  createdAt: string;
  lastLoginAt: string | null;
  tradeCount?: number;
  watchlistCount?: number;
}

export interface UserTradeItem {
  id: string;
  symbol: string;
  strategy: 'COVERED_CALL' | 'CASH_SECURED_PUT' | 'LONG_STOCK' | 'SPREAD' | 'OTHER';
  strike?: number;
  expiration?: string;
  contracts?: number;
  premiumPerShare?: number;
  entryDate?: string;
  status: 'OPEN' | 'CLOSED' | 'ASSIGNED' | 'EXPIRED';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserWatchlistItem {
  id: string;
  symbol: string;
  category?: string;
  targetPrice?: number;
  notes?: string;
  createdAt: string;
}

export interface UserPortfolioItem {
  id: string;
  portfolioName: string;
  netLiquidity: number;
  cashBalance: number;
  updatedAt: string;
}

export interface UserDataResponse {
  trades: UserTradeItem[];
  watchlists: UserWatchlistItem[];
  portfolio: UserPortfolioItem | null;
}
