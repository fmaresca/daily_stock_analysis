import React, { Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { PasswordChangeView } from './components/auth/PasswordChangeView';
import { lazyWithRetry } from './utils/lazyWithRetry';

import { ErrorBoundary } from './components/ErrorBoundary';

// Code-split authenticated workspace shell so login page downloads only minimal bundle
const AuthenticatedTerminal = lazyWithRetry(
  () => import('./components/AuthenticatedTerminal').then((m) => ({ default: m.AuthenticatedTerminal })),
  'AuthenticatedTerminal'
);

export const App: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, user, refreshSession } = useAuth();

  // ------------------------------------------------------------------------
  // FAIL-SAFE PRIVACY & TENANT ISOLATION GATE
  // When an unauthenticated visitor accesses the application URL, they must
  // NEVER see internal positions, cash ledger, or private records.
  // Instead, immediately hold them at the LoginView with zero leaked data.
  // ------------------------------------------------------------------------
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-slate-400">Verifying Security Session &amp; Tenant Authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // ------------------------------------------------------------------------
  // MANDATORY FIRST-LOGIN PASSWORD ROTATION GATE
  // If the account has must_change_password flag set (e.g. temporary/reset credentials),
  // immediately hold the user in the mandatory password update view.
  // ------------------------------------------------------------------------
  if (user?.must_change_password) {
    return (
      <PasswordChangeView
        isMandatory={true}
        onSuccess={async () => {
          await refreshSession();
        }}
      />
    );
  }

  return (
    <ErrorBoundary
      fallbackTitle="Workspace Loading Interrupted"
      fallbackMessage="The application was updated or network interrupted during bundle loading. Please reload to load the latest release."
      onReset={() => window.location.reload()}
    >
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-xs font-mono text-slate-400">Loading Institutional Workspace...</p>
          </div>
        }
      >
        <AuthenticatedTerminal />
      </Suspense>
    </ErrorBoundary>
  );
};

