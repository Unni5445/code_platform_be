import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Award, Calendar, CheckCircle, ExternalLink } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { enrollmentService } from "@/services";
import type { ICertificate } from "@/services/enrollment.service";
import { Spinner, Button } from "@/components/ui";

export default function CertificatePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const fetchCertificate = useCallback(
    () => enrollmentService.getMyCertificate(courseId!),
    [courseId]
  );

  const { data: certificate, loading, error } = useApi<ICertificate>(fetchCertificate, [courseId]);

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
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="text-center py-20">
          <p className="text-gray-500">Certificate not available. Complete the course first.</p>
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
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <Button leftIcon={<Download className="h-4 w-4" />} onClick={handlePrint}>
          Download / Print
        </Button>
      </div>

      {/* Certificate */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-primary-100 overflow-hidden print:shadow-none print:border print:rounded-none">
          {/* Top border accent */}
          <div className="h-2 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />

          <div className="px-12 py-16 text-center space-y-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="p-4 bg-primary-50 rounded-full">
                <Award className="h-12 w-12 text-primary-600" />
              </div>
            </div>

            {/* Header text */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest">Certificate of Completion</p>
              <h1 className="text-3xl font-bold text-gray-900">{certificate.title}</h1>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-gray-200" />
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="h-px w-16 bg-gray-200" />
            </div>

            {/* Presented to */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500 uppercase tracking-wider">This is to certify that</p>
              <h2 className="text-2xl font-bold text-gray-900">{studentName}</h2>
              <p className="text-gray-500">has successfully completed the course</p>
              <h3 className="text-xl font-semibold text-primary-700">{courseTitle}</h3>
            </div>

            {/* Details */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
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
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Certificate ID: {certificate._id}
                </p>
                <a
                  href={certificate.verificationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 mt-1"
                >
                  Verify Certificate <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Bottom border accent */}
          <div className="h-2 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500" />
        </div>
      </div>
    </div>
  );
}
