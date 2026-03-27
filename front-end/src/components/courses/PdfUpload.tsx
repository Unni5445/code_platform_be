import { useRef, useState } from "react";
import { Upload, FileText, X, Eye, Loader2 } from "lucide-react";

interface PdfUploadProps {
  value?: File | string | null;       // File = new upload, string = existing URL
  onChange: (file: File | null) => void;
  label?: string;
}

export function PdfUpload({ value, onChange, label = "PDF Attachment" }: PdfUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const previewUrl =
    value instanceof File
      ? URL.createObjectURL(value)
      : typeof value === "string"
      ? value
      : null;

  const fileName =
    value instanceof File
      ? value.name
      : typeof value === "string"
      ? value.split("/").pop() || "document.pdf"
      : null;

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert("PDF must be under 20 MB.");
      return;
    }
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {!fileName ? (
        /* ── Drop zone ── */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer transition-colors
            ${dragging ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"}`}
        >
          <Upload className="h-7 w-7 text-gray-400" />
          <p className="text-sm text-gray-600 font-medium">Drop PDF here or click to browse</p>
          <p className="text-xs text-gray-400">Max 20 MB · PDF only</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        /* ── File selected ── */
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
          <div className="p-2 bg-red-100 rounded-lg shrink-0">
            <FileText className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
            {value instanceof File && (
              <p className="text-xs text-gray-400 mt-0.5">
                {(value.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {previewUrl && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                title="Preview PDF"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── PDF Preview Modal ── */}
      {previewOpen && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-gray-800 truncate max-w-[400px]">{fileName}</span>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* iframe */}
            <div className="flex-1 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
              </div>
              <iframe
                src={previewUrl}
                className="absolute inset-0 w-full h-full z-10"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
