import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error captured by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear(); // Clear potentially corrupted state
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
          <div className="w-full max-w-md p-6 rounded-2xl border border-rose-500/15 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.05)]">
            {/* Top decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
            
            <div className="flex flex-col items-center text-center">
              <div className="p-3.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4 animate-pulse">
                <AlertOctagon size={32} />
              </div>
              
              <h1 className="text-lg font-bold font-display uppercase tracking-wider text-rose-400">
                System Fault Intercepted
              </h1>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Max AI OS has intercepted an unhandled user interface exception. Safe sandbox boundaries have successfully prevented a terminal system crash.
              </p>

              {this.state.error && (
                <div className="w-full mt-4 p-3 bg-black/45 rounded-xl border border-white/5 text-left">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Error Log Diagnostics
                  </span>
                  <p className="text-[10px] font-mono text-rose-300 break-words leading-normal select-all">
                    {this.state.error.message || String(this.state.error)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 w-full mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-white/10 bg-slate-950 text-xs font-semibold text-slate-200 hover:bg-slate-900 transition cursor-pointer"
                >
                  <RotateCcw size={12} />
                  Retry Reload
                </button>
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                  title="Clear storage cache and force full reload"
                >
                  <Home size={12} />
                  Safe Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
