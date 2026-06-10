import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
  icon?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "max-w-lg",
  icon,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-soft animate-fade-in-up"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full",
          width,
          "card-base animate-fade-in-up"
        )}
      >
        <div className="flex items-start gap-3 px-6 py-4 border-b border-ink-200">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold text-ink-800">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-sm text-ink-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-md text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto scrollbar-thin">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ink-200 bg-ink-50/50 rounded-b-md">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "w-[520px]",
}: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-soft"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute top-0 right-0 h-full",
          width,
          "bg-white shadow-2xl flex flex-col animate-slide-in-right"
        )}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-ink-200 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold text-ink-800">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-sm text-ink-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-md text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ink-200 bg-ink-50/50 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ToastItem {
  id: string;
  type: "success" | "error" | "info" | "warn";
  message: string;
}

import { create } from "zustand";
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";

interface ToastState {
  toasts: ToastItem[];
  pushToast: (type: ToastItem["type"], message: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  pushToast: (type, message) => {
    const id = `t_${Date.now()}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-safe-600" />,
    error: <XCircle className="w-5 h-5 text-danger-600" />,
    info: <Info className="w-5 h-5 text-brand-700" />,
    warn: <AlertTriangle className="w-5 h-5 text-warn-600" />,
  };
  const bgMap = {
    success: "bg-safe-50 border-safe-200",
    error: "bg-danger-50 border-danger-200",
    info: "bg-brand-50 border-brand-200",
    warn: "bg-warn-50 border-warn-200",
  };
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-md border shadow-lg",
            "animate-fade-in-up cursor-pointer",
            bgMap[t.type]
          )}
        >
          {iconMap[t.type]}
          <span className="text-sm text-ink-700 flex-1">{t.message}</span>
          <button className="text-ink-400 hover:text-ink-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export const toast = {
  success: (m: string) => useToastStore.getState().pushToast("success", m),
  error: (m: string) => useToastStore.getState().pushToast("error", m),
  info: (m: string) => useToastStore.getState().pushToast("info", m),
  warn: (m: string) => useToastStore.getState().pushToast("warn", m),
};
