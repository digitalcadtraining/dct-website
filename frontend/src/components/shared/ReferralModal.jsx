import { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const REFERRAL_CODE = "AFF465Y6588";

const STEPS = [
  { n: 1, label: "Send an invite to a friend" },
  { n: 2, label: "Your friend signs up." },
  { n: 3, label: "You'll get cash when your friend submits their first receipt" },
];

export default function ReferralModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(REFERRAL_CODE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} />

          {/* Modal */}
          <motion.div className="relative z-10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}>

            {/* Close */}
            <button onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors">
              <X size={15} />
            </button>

            {/* ── Top section – blue gradient ── */}
            <div className="relative overflow-hidden px-6 pt-8 pb-10 text-center"
              style={{ background: "linear-gradient(160deg, #024981 0%, #007BBF 60%, #5bb8e8 100%)" }}>

              {/* Decorative arc at bottom */}
              <div className="absolute -bottom-8 -left-8 -right-8 h-16 bg-[#cce9f7] rounded-[50%]" />

              <h2 className="text-white text-xl font-extrabold leading-tight mb-6 relative z-10">
                <span className="text-red-400 underline decoration-red-400">Be a hero</span> and invite using<br />
                your unique referral link!
              </h2>

              {/* Illustration – social sharing SVG */}
              <div className="flex justify-center mb-6 relative z-10">
                <div className="w-44 h-36">
                  <svg viewBox="0 0 180 145" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* Phone */}
                    <rect x="62" y="20" width="56" height="90" rx="8" fill="#1a1a2e"/>
                    <rect x="65" y="25" width="50" height="78" rx="5" fill="#2d3a8c"/>
                    <rect x="78" y="18" width="24" height="4" rx="2" fill="#3a3a3a"/>
                    <circle cx="90" cy="105" r="3" fill="#3a3a3a"/>
                    {/* Person on phone */}
                    <circle cx="90" cy="52" r="12" fill="#ffb347"/>
                    <rect x="80" y="62" width="20" height="22" rx="4" fill="#007BBF"/>
                    {/* Megaphone */}
                    <path d="M95 55 L110 48 L110 62 L95 58 Z" fill="#ff6b35"/>
                    <rect x="107" y="50" width="6" height="12" rx="2" fill="#ff6b35"/>
                    {/* Floating cards */}
                    <rect x="10" y="25" width="42" height="32" rx="6" fill="white" opacity="0.9"/>
                    <circle cx="22" cy="35" r="7" fill="#e0e0e0"/>
                    <rect x="32" y="30" width="14" height="3" rx="1.5" fill="#bbb"/>
                    <rect x="32" y="36" width="10" height="3" rx="1.5" fill="#ddd"/>
                    <rect x="128" y="20" width="42" height="32" rx="6" fill="white" opacity="0.9"/>
                    <circle cx="140" cy="30" r="7" fill="#b0c4ff"/>
                    <rect x="150" y="25" width="14" height="3" rx="1.5" fill="#bbb"/>
                    <rect x="150" y="31" width="10" height="3" rx="1.5" fill="#ddd"/>
                    <rect x="128" y="70" width="42" height="32" rx="6" fill="white" opacity="0.9"/>
                    <circle cx="140" cy="80" r="7" fill="#b0e0b0"/>
                    <rect x="150" y="75" width="14" height="3" rx="1.5" fill="#bbb"/>
                    <rect x="150" y="81" width="10" height="3" rx="1.5" fill="#ddd"/>
                    {/* Icons */}
                    <circle cx="55" cy="18" r="8" fill="white" opacity="0.85"/>
                    <text x="51" y="22" fontSize="9" fill="#007BBF">♥</text>
                    <circle cx="130" cy="15" r="8" fill="white" opacity="0.85"/>
                    <text x="126" y="19" fontSize="9" fill="#007BBF">↗</text>
                    <circle cx="145" cy="60" r="8" fill="white" opacity="0.85"/>
                    <text x="141" y="64" fontSize="9" fill="#007BBF">👍</text>
                    <circle cx="35" cy="75" r="8" fill="white" opacity="0.85"/>
                    <text x="31" y="79" fontSize="9" fill="#007BBF">💬</text>
                  </svg>
                </div>
              </div>

              {/* Referral code box */}
              <div className="relative z-10 mb-2">
                <p className="text-white/80 text-xs font-medium mb-2">Share this referral code</p>
                <div className="flex items-center justify-between border-2 border-dashed border-white/50 rounded-xl px-4 py-3 bg-white/10 backdrop-blur-sm">
                  <span className="text-white text-lg font-bold tracking-widest">{REFERRAL_CODE}</span>
                  <button onClick={handleCopy}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/40 transition-colors ml-3">
                    {copied
                      ? <Check size={16} className="text-green-300" />
                      : <Copy size={16} className="text-white" />}
                  </button>
                </div>
                {copied && (
                  <motion.p className="text-green-300 text-xs font-semibold mt-1"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    ✓ Copied to clipboard!
                  </motion.p>
                )}
              </div>
            </div>

            {/* ── Bottom section – light blue ── */}
            <div className="bg-[#cce9f7] px-6 pt-8 pb-6">
              {/* Steps */}
              <div className="space-y-4 mb-7">
                {STEPS.map(step => (
                  <div key={step.n} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md"
                      style={{ background: "linear-gradient(135deg, #024981, #007BBF)" }}>
                      {step.n}
                    </div>
                    <p className="text-sm font-semibold text-dct-dark leading-snug pt-1">{step.label}</p>
                  </div>
                ))}
              </div>

              {/* Footer – logo + QR */}
              <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                <div className="flex items-center gap-2">
                  {/* DCT Logo */}
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-white text-lg shadow"
                    style={{ background: "linear-gradient(135deg, #007BBF, #003C6E)" }}>D</div>
                  <div>
                    <p className="text-xs font-black text-dct-dark">Digital <span className="text-dct-primary">CAD</span></p>
                    <p className="text-[9px] text-dct-lightgray tracking-widest uppercase">DigitalCAD</p>
                  </div>
                </div>

                {/* QR Code SVG */}
                <div className="text-right">
                  <div className="w-14 h-14 border-2 border-dct-navy rounded-lg overflow-hidden bg-white p-1">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Simple QR pattern */}
                      {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => {
                        const pattern = [
                          [1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],
                          [1,0,1,0,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]
                        ];
                        return pattern[r]?.[c] ? (
                          <rect key={`${r}-${c}`} x={c*14+1} y={r*14+1} width="13" height="13" fill="#1F1A17"/>
                        ) : null;
                      }))}
                      {/* Data dots */}
                      {[50,64,78,50,64,78,50].map((x, i) =>
                        <rect key={`d${i}`} x={x} y={i*14+1} width="13" height="13" fill={Math.random()>0.5?"#1F1A17":"white"} />
                      )}
                    </svg>
                  </div>
                  <p className="text-[9px] text-dct-lightgray mt-1">Scan for Demo Details</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
