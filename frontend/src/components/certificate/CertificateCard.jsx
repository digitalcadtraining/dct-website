import { useEffect, useState } from "react";
import { Download, FileImage, Lock, X } from "lucide-react";
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
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [downloadOpen, setDownloadOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    if (!certificate?.enrollment_id) {
      return undefined;
    }

    setPreviewUrl("");
    setError("");

    certificateApi
      .preview(certificate.enrollment_id)
      .then((url) => {
        objectUrl = url;

        if (active) {
          setPreviewUrl(url);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.message ||
              "Could not generate certificate preview.",
          );
        }
      });

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [
    certificate?.enrollment_id,
    certificate?.is_issued,
    certificate?.progress,
  ]);

  if (!certificate) return null;

  const progress = Number(certificate.progress || 0);
  const unlockProgress = Number(
    certificate.unlock_progress || 80,
  );
  const unlocked = Boolean(certificate.can_download);

  return (
    <>
      {downloadOpen && (
        <DownloadModal
          certificate={certificate}
          onClose={() => setDownloadOpen(false)}
        />
      )}

      <aside className="w-full min-w-0 max-w-[430px] self-start overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div className="relative aspect-[1.414/1] w-full overflow-hidden bg-gray-100">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Course completion certificate preview"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-5 text-center text-xs font-bold text-gray-500">
              {error ||
                "Generating your certificate preview..."}
            </div>
          )}
        </div>

        <div className="border-t border-amber-100 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-black text-dct-dark sm:text-xs">
                {unlocked
                  ? "Official certificate issued"
                  : "Certificate preview"}
              </p>

              <p className="mt-1 text-[9px] text-gray-500 sm:text-[10px]">
                {unlocked
                  ? certificate.certificate_number
                  : `${progress}% completed · unlocks at ${unlockProgress}%`}
              </p>
            </div>

            <button
              type="button"
              disabled={!unlocked}
              onClick={() => setDownloadOpen(true)}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-dct-primary px-3 text-[10px] font-black text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 sm:px-4"
            >
              {unlocked ? (
                <Download size={14} />
              ) : (
                <Lock size={14} />
              )}

              {unlocked ? "Download" : "Locked"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
