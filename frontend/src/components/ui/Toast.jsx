import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

const styles = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-700",
  info: "bg-stone-50 border-stone-200 text-stone-700",
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast?.message) return;
    const timer = setTimeout(onClose, 2800);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast?.message) return null;
  const Icon = icons[toast.type || "info"];

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <div className={`min-w-[260px] max-w-sm border rounded-2xl px-4 py-3 shadow-xl flex items-start gap-3 ${styles[toast.type || "info"]}`}>
        <Icon className="h-5 w-5 mt-0.5" />
        <p className="text-sm font-semibold">{toast.message}</p>
      </div>
    </div>
  );
};

export default Toast;
