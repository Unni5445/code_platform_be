import { useCallback, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Printer, Award, Calendar, CheckCircle, ExternalLink } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { enrollmentService } from "@/services";
import type { ICertificate } from "@/services/enrollment.service";
import { Spinner, Button } from "@/components/ui";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function CertificatePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const fetchCertificate = useCallback(
    () => enrollmentService.getMyCertificate(courseId!),
    [courseId]
  );

  const { data: certificate, loading, error } = useApi<ICertificate>(fetchCertificate, [courseId]);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const buildPdf = async () => {
    if (!certificateRef.current) return null;

    const canvas = await html2canvas(certificateRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const canvasRatio = canvas.width / canvas.height;
    const pdfRatio = pdfWidth / pdfHeight;

    let drawWidth = pdfWidth;
    let drawHeight = pdfHeight;

    if (canvasRatio > pdfRatio) {
      drawHeight = pdfWidth / canvasRatio;
    } else {
      drawWidth = pdfHeight * canvasRatio;
    }

    const x = (pdfWidth - drawWidth) / 2;
    const y = (pdfHeight - drawHeight) / 2;

    pdf.addImage(imgData, "PNG", x, y, drawWidth, drawHeight);
    return pdf;
  };

  const handleDownload = async () => {
    setDownloading(true);
    const pdf = await buildPdf();
    if (pdf) pdf.save(`certificate-${courseId}.pdf`);
    setDownloading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex cursor-pointer items-center gap-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="py-20 text-center">
          <p className="text-slate-400">Certificate not available. Complete the course first.</p>
        </div>
      </div>
    );
  }

  const studentName = typeof certificate.student === "object" ? certificate.student.name : "Student";
  const courseTitle = typeof certificate.course === "object" ? certificate.course.title : "Course";
  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header - hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex cursor-pointer items-center gap-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex gap-2">
          <Button leftIcon={<Printer className="h-4 w-4" />} variant="ghost" onClick={handlePrint}>
            Print
          </Button>
          <Button leftIcon={<Download className="h-4 w-4" />} onClick={handleDownload} isLoading={downloading}>
            Download PDF
          </Button>
        </div>
      </div>

      {/* Certificate */}
      <div className="max-w-3xl mx-auto">
        <div
          ref={certificateRef}
          className="print-certificate rounded-2xl shadow-lg overflow-hidden"
          style={{ backgroundColor: "#ffffff", border: "2px solid #c0ffe9" }}
        >
          {/* Top border accent */}
          <div className="h-2" style={{ background: "linear-gradient(to right, #00e5a8, #00c18f, #009a76)" }} />

          <div className="px-12 py-16 text-center" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
            {/* Icon */}
            <div className="flex justify-center">
              <div className="p-4 rounded-full" style={{ backgroundColor: "#e6fff7" }}>
                <Award className="h-12 w-12" style={{ color: "#00c18f" }} />
              </div>
            </div>

            {/* Header text */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#00c18f" }}>Certificate of Completion</p>
              <h1 className="text-3xl font-bold" style={{ color: "#111827" }}>{certificate.title}</h1>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-16" style={{ backgroundColor: "#e5e7eb" }} />
              <CheckCircle className="h-5 w-5" style={{ color: "#22c55e" }} />
              <div className="h-px w-16" style={{ backgroundColor: "#e5e7eb" }} />
            </div>

            {/* Presented to */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <p className="text-sm uppercase tracking-wider" style={{ color: "#6b7280" }}>This is to certify that</p>
              <h2 className="text-2xl font-bold" style={{ color: "#111827" }}>{studentName}</h2>
              <p style={{ color: "#6b7280" }}>has successfully completed the course</p>
              <h3 className="text-xl font-semibold" style={{ color: "#009a76" }}>{courseTitle}</h3>
            </div>

            {/* Details */}
            <div className="flex items-center justify-center gap-8 text-sm" style={{ color: "#6b7280" }}>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Issued on {issuedDate}
              </span>
              {certificate.grade && (
                <span className="flex items-center gap-1.5">
                  <Award className="h-4 w-4" />
                  Grade: {certificate.grade}
                </span>
              )}
            </div>

            {/* Verification */}
            {certificate.verificationLink && (
              <div className="pt-4" style={{ borderTop: "1px solid #f3f4f6" }}>
                <p className="text-xs" style={{ color: "#9ca3af" }}>
                  Certificate ID: {certificate._id}
                </p>
                <a
                  href={certificate.verificationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs mt-1"
                  style={{ color: "#00e5a8" }}
                >
                  Verify Certificate <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Bottom border accent */}
          <div className="h-2" style={{ background: "linear-gradient(to right, #009a76, #00c18f, #00e5a8)" }} />
        </div>
      </div>

    </div>
  );
}
