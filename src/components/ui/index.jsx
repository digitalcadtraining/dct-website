import { X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Button ───────────────────────────────────────────────
export function Button({ children, variant="primary", size="md", fullWidth=false, disabled=false, onClick, type="button", className="" }) {
  const variants = {
    primary:   "dct-btn-primary",
    secondary: "bg-dct-navy hover:bg-dct-blue text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-dct-navy/40",
    outline:   "dct-btn-outline",
    ghost:     "text-dct-gray hover:bg-gray-100 hover:text-dct-dark rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-gray-300",
    white:     "bg-white hover:bg-gray-50 text-dct-dark border border-gray-200 shadow-sm rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-gray-300",
  };
  const sizes = { sm:"text-xs px-3 py-2 min-h-[36px]", md:"text-sm px-5 py-2.5 min-h-[44px]", lg:"text-base px-7 py-3 min-h-[52px]" };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center ${variants[variant]||variants.primary} ${sizes[size]} ${fullWidth?"w-full":""} active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────
export function Input({ label, type="text", placeholder, value, onChange, error, hint, rightIcon, className="", required=false, readOnly=false }) {
  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-sm font-semibold text-dct-dark mb-1.5">{label}{required&&<span className="text-red-500 ml-1">*</span>}</label>}
      <div className="relative">
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} readOnly={readOnly}
          className={`dct-input ${error?"border-red-400 focus:ring-red-400":""} ${rightIcon?"pr-12":""} ${readOnly?"bg-gray-50 cursor-default":""}`} />
        {rightIcon && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">{rightIcon}</span>}
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-dct-lightgray">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────
export function Textarea({ label, placeholder, value, onChange, rows=4, className="" }) {
  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-sm font-semibold text-dct-dark mb-1.5">{label}</label>}
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        className="dct-input resize-none leading-relaxed" />
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────
export function Badge({ children, variant="blue" }) {
  const map = { blue:"bg-blue-100 text-dct-primary", green:"bg-green-100 text-green-700", gray:"bg-gray-100 text-dct-gray", pink:"bg-pink-100 text-pink-600" };
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${map[variant]||map.blue}`}>{children}</span>;
}

// ─── Avatar ───────────────────────────────────────────────
export function Avatar({ name="U", size="md", color="bg-dct-primary" }) {
  const sizes = { sm:"w-7 h-7 text-xs", md:"w-9 h-9 text-sm", lg:"w-12 h-12 text-base", xl:"w-14 h-14 text-lg" };
  return <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>{name.charAt(0).toUpperCase()}</div>;
}

// ─── ProgressBar ──────────────────────────────────────────
export function ProgressBar({ value=0, color="bg-dct-primary", trackColor="bg-gray-100" }) {
  return (
    <div className={`w-full h-2 rounded-full overflow-hidden ${trackColor}`}>
      <motion.div className={`h-full rounded-full ${color}`} initial={{ width:0 }} animate={{ width:`${Math.min(100,value)}%` }} transition={{ duration:0.8, ease:"easeOut" }} />
    </div>
  );
}

// ─── Chip Button ──────────────────────────────────────────
export function ChipBtn({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="chip-blue group focus:outline-none focus:ring-2 focus:ring-dct-primary/30">
      {Icon && <Icon size={14} />}
      <span>{label}</span>
      <ChevronRight size={14} className="ml-auto group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, maxWidth="max-w-xl" }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={onClose} />
          <motion.div className={`relative bg-white rounded-2xl shadow-modal w-full ${maxWidth} z-10 max-h-[90vh] overflow-y-auto`}
            initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }}
            transition={{ duration:0.25, ease:"easeOut" }}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-dct-dark">{title}</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-dct-dark transition-colors focus:outline-none focus:ring-2 focus:ring-dct-primary/30">
                <X size={16} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Page Wrapper with entrance animation ─────────────────
export function PageWrapper({ children }) {
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35, ease:"easeOut" }}>
      {children}
    </motion.div>
  );
}
