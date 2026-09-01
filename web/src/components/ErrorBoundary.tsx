import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from './icons';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 bg-slate-900/90 border border-rose-500/40 rounded-2xl text-slate-200 shadow-xl max-w-2xl mx-auto backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white tracking-tight">
                {this.props.fallbackTitle || 'Component Render Error Recovered'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {this.props.fallbackMessage ||
                  'An unexpected rendering issue occurred in this section. The application prevented a crash.'}
              </p>

              {this.state.error && (
                <div className="mt-3 p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] font-mono text-rose-300 truncate">
                  {this.state.error.toString()}
                </div>
              )}

              <div className="mt-4 flex items-center space-x-2.5">
                <button
                  onClick={this.handleReset}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-md shadow-emerald-600/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry View</span>
                </button>
                {this.props.onReset && (
                  <button
                    onClick={this.props.onReset}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    <span>Dismiss</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
