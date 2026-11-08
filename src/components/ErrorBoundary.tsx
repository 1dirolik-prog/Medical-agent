import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, RotateCcw, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import { STORAGE_KEY } from "../services/storage";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary caught an unhandled error]:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleEmergencyBackup = () => {
    try {
      const rawData = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("family_health_state");
      if (rawData) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(rawData);
        const a = document.createElement("a");
        a.setAttribute("href", dataStr);
        a.setAttribute("download", `emergency_backup_${new Date().toISOString().split("T")[0]}.json`);
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      console.error("Failed emergency backup:", e);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700/60 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <ShieldAlert size={34} />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold mb-2">
              Произошла непредвиденная ошибка
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
              Медицинские данные изолированы и сохранены. Вы можете обновить экран или восстановить работу приложения.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full mb-6">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl bg-medical-blue hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <RotateCcw size={16} />
                Попробовать снова
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw size={16} />
                Перезагрузить
              </button>
            </div>

            <div className="w-full flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-4">
              <button
                type="button"
                onClick={this.handleEmergencyBackup}
                className="hover:text-medical-blue transition-colors underline cursor-pointer"
              >
                Экстренная копия данных
              </button>

              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <span>Детали ошибки</span>
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {this.state.showDetails && (
              <div className="w-full mt-4 text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs font-mono overflow-auto max-h-48">
                <p className="text-red-500 font-bold mb-1">{this.state.error?.message}</p>
                <pre className="text-[11px] text-slate-500 whitespace-pre-wrap">{this.state.error?.stack}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
