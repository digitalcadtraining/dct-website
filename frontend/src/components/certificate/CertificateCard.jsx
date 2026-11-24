import { useEffect, useState, useRef } from "react";
import {
  Download,
  FileImage,
  Lock,
  X,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { certificateApi } from "../../services/certificateApi.js";

function DownloadModal({ certificate, onClose }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const run = async (type) => {
    try {
      setBusy(type);
      setError("");

      if (type === "pdf") {
        await certificateApi.downloadPdf(certificate);
      } else {
        await certificateApi.downloadPng(certificate);
      }

      onClose();
    } catch (err) {
      setError(err.message || "Could not download certificate.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-dct-dark">
              Download Certificate
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Choose the required high-quality format.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 p-2 text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => run("pdf")}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-dct-primary font-black text-white disabled:bg-gray-400"
          >
            <Download size={18} />
            {busy === "pdf" ? "Creating..." : "PDF"}
          </button>

          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => run("png")}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#1f1a17] font-black text-white disabled:bg-gray-400"
          >
            <FileImage size={18} />
            {busy === "png" ? "Creating..." : "PNG"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CertificateCard({ certificate }) {
  if (!certificate) return null;

  const previewKey = JSON.stringify([
    certificate.enrollment_id,
    certificate.id,
    certificate.is_issued,
    certificate.can_download,
    certificate.progress,
    certificate.unlock_progress,
    certificate.certificate_number,
    certificate.student_name,
    certificate.course_name,
    certificate.batch_name,
    certificate.batch_start_date,
    certificate.batch_end_date,
    certificate.issued_at,
  ]);

  return <CertificateCardContent key={previewKey} certificate={certificate} />;
}

function CertificateCardContent({ certificate }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadOpen, setDownloadOpen] = useState(false);

  const previewUrlRef = useRef("");
  const requestRef = useRef(null);

  const progress = Number(certificate.progress || 0);
  const unlockProgress = Number(certificate.unlock_progress || 70);
  const unlocked = Boolean(certificate.can_download);

  // Cleanup only. No automatic preview API request.
  useEffect(() => {
    return () => {
      requestRef.current = null;

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }
    };
  }, []);

  const loadPreview = async () => {
    // Prevent duplicate requests.
    if (requestRef.current) return;

    // Reuse preview already generated during this page visit.
    if (previewUrlRef.current) {
      setPreviewVisible(true);
      return;
    }

    const request = {};
    requestRef.current = request;

    setPreviewLoading(true);
    setError("");

    try {
      const url = await certificateApi.preview(certificate.enrollment_id);

      // Discard stale responses if the component was removed.
      if (requestRef.current !== request) {
        URL.revokeObjectURL(url);
        return;
      }

      previewUrlRef.current = url;
      setPreviewUrl(url);
      setPreviewVisible(true);
    } catch (err) {
      if (requestRef.current === request) {
        setError(err.message || "Could not load preview. Please try again.");
      }
    } finally {
      if (requestRef.current === request) {
        requestRef.current = null;
        setPreviewLoading(false);
      }
    }
  };

  const showRealPreview = previewVisible && Boolean(previewUrl);

  return (
    <>
      {downloadOpen && unlocked && (
        <DownloadModal
          certificate={certificate}
          onClose={() => setDownloadOpen(false)}
        />
      )}

      <aside className="w-full min-w-0 max-w-[430px] self-start overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
        {/* Certificate preview area */}
        <div className="relative aspect-[1.414/1] w-full overflow-hidden bg-gray-50">
          {showRealPreview ? (
            <img
              src={previewUrl}
              alt="Course certificate preview"
              className="h-full w-full object-contain"
            />
          ) : (
            <>
              {/* Static blurred certificate.
                  No backend or external image request. */}
              <svg
                viewBox="0 0 420 297"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-[0.98] opacity-50 blur-[2px]"
              >
                <rect width="420" height="297" fill="#ffffff" />

                <rect
                  x="6"
                  y="6"
                  width="408"
                  height="285"
                  rx="3"
                  fill="none"
                  stroke="#D7A62A"
                  strokeWidth="5"
                />

                <rect
                  x="13"
                  y="13"
                  width="394"
                  height="271"
                  fill="none"
                  stroke="#073763"
                  strokeWidth="1"
                />

                <path d="M300 8 Q380 15 412 85 V8 Z" fill="#0837C9" />

                <path d="M8 212 Q48 276 120 289 H8 Z" fill="#0837C9" />

                <g
                  textAnchor="middle"
                  fontFamily="Georgia, serif"
                  fill="#073763"
                >
                  <text x="210" y="32" fontSize="9">
                    DIGITAL CAD TRAINING
                  </text>

                  <text x="210" y="65" fontSize="25" letterSpacing="4">
                    CERTIFICATE
                  </text>

                  <text x="210" y="82" fontSize="11" letterSpacing="3">
                    OF COMPLETION
                  </text>

                  <path d="M95 94 H325" stroke="#D7A62A" />

                  <text x="210" y="118" fontSize="9">
                    PROFESSIONAL TRAINING PROGRAMME
                  </text>

                  <rect
                    x="115"
                    y="139"
                    width="190"
                    height="10"
                    rx="4"
                    fill="#D7A62A"
                  />

                  <path d="M105 157 H315" stroke="#D7A62A" />

                  <rect
                    x="90"
                    y="178"
                    width="240"
                    height="8"
                    rx="4"
                    fill="#073763"
                  />

                  <rect
                    x="120"
                    y="193"
                    width="180"
                    height="5"
                    rx="2"
                    fill="#94a3b8"
                  />

                  <path d="M95 215 H325" stroke="#D7A62A" />

                  <path d="M175 260 H245" stroke="#073763" />

                  <text x="210" y="272" fontSize="7">
                    LEAD TRAINER
                  </text>
                </g>
              </svg>

              {/* Clear certificate information overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 p-4">
                <div className="w-full max-w-[290px] rounded-2xl border border-white bg-white/95 px-4 py-4 text-center shadow-lg">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-dct-primary">
                    <FileImage size={19} />
                  </div>

                  <p className="text-xs font-black text-dct-dark sm:text-sm">
                    Your Course Certificate
                  </p>

                  <p className="mt-2 break-words text-sm font-bold text-dct-primary">
                    {certificate.student_name}
                  </p>

                  <p className="mt-1 break-words text-[10px] font-medium text-gray-500 sm:text-xs">
                    {certificate.course_name}
                  </p>

                  <p className="mt-2 text-[10px] font-semibold text-gray-500">
                    {unlocked
                      ? "Certificate ready to download"
                      : `${progress}% batch completed`}
                  </p>

                  <p className="mt-2 text-[9px] text-gray-400">
                    Preview loads only on request
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Certificate status and actions */}
        <div className="border-t border-amber-100 p-3 sm:p-4">
          <div className="min-w-0">
            <p className="text-xs font-black text-dct-dark">
              {unlocked ? "Official certificate issued" : "Certificate preview"}
            </p>

            <p className="mt-1 break-words text-[10px] text-gray-500">
              {unlocked
                ? certificate.certificate_number
                : `${progress}% batch completed · unlocks at ${unlockProgress}%`}
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-red-50 p-2 text-[10px] font-semibold text-red-600"
            >
              {error}
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={previewLoading}
              onClick={
                showRealPreview ? () => setPreviewVisible(false) : loadPreview
              }
              className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2 text-[10px] font-bold text-dct-primary transition-colors hover:bg-blue-100 disabled:cursor-wait disabled:opacity-60 sm:text-xs"
            >
              {previewLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : showRealPreview ? (
                <EyeOff size={14} />
              ) : (
                <Eye size={14} />
              )}

              {previewLoading
                ? "Loading..."
                : showRealPreview
                  ? "Hide Preview"
                  : error
                    ? "Retry Preview"
                    : "Load Preview"}
            </button>

            <button
              type="button"
              disabled={!unlocked}
              onClick={() => setDownloadOpen(true)}
              className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-dct-primary px-2 text-[10px] font-black text-white transition-colors hover:bg-dct-blue disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 sm:text-xs"
            >
              {unlocked ? <Download size={14} /> : <Lock size={14} />}

              {unlocked ? "Download" : "Locked"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
