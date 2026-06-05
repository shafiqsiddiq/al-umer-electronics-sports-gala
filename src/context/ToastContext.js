"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, Info, AlertCircle, X } from "lucide-react";

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const TOAST_ICONS = {
  success: <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
  error: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />,
  warning: <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />,
  info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />,
};

const TOAST_STYLES = {
  success: "border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-250",
  error: "border-red-100 bg-red-50 text-red-900 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-250",
  warning: "border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-250",
  info: "border-blue-100 bg-blue-50 text-blue-900 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-250",
};

const TOAST_BAR_STYLES = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto relative overflow-hidden flex items-center justify-between gap-3 rounded-2xl border p-4 pb-4.5 shadow-xl backdrop-blur-md animate-in slide-in-from-top-5 fade-in duration-300 ${TOAST_STYLES[t.type]}`}
            role="alert"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {TOAST_ICONS[t.type]}
              <p className="text-sm font-semibold leading-snug break-words pr-2">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="rounded-lg p-1 text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-700 dark:hover:text-zinc-200 transition shrink-0"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
            {/* shrinking progress bar */}
            <div className={`absolute bottom-0 left-0 h-1 toast-progress-bar ${TOAST_BAR_STYLES[t.type]}`} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
