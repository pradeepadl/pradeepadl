import { X } from "lucide-react";

export function Modal({
  open, onClose, title, subtitle, width = "max-w-lg", children,
}: {
  open: boolean; onClose: () => void; title: string; subtitle?: string;
  width?: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[1px]" onClick={onClose} />

      {/* Panel */}
      <div className={`relative w-full ${width} bg-white rounded-xl shadow-2xl shadow-black/20 max-h-[90vh] flex flex-col`}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</div>
            {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors -mr-1 -mt-1 p-1">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">{children}</div>;
}

export function FormField({
  label, children, required,
}: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";