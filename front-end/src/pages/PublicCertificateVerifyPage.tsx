import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { Award, Calendar, CheckCircle, ShieldCheck } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { certificateService } from "@/services";
import type { ICertificate } from "@/types";
import { Spinner, Button, Card, Badge } from "@/components/ui";

export default function PublicCertificateVerifyPage() {
  const { id } = useParams<{ id: string }>();

  const fetchCertificate = useCallback(
    () => certificateService.verify(id!),
    [id]
  );

  const { data: certificate, loading, error } = useApi<ICertificate>(fetchCertificate, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Spinner size="lg" />
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Verifying credentials...</p>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6 border border-slate-100">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-2">
            <Award className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Verification Failed</h1>
          <p className="text-slate-500">
            We couldn't verify this certificate ID. It might be invalid, expired, or the URL is incorrect.
          </p>
          <Button className="w-full" onClick={() => window.location.href = "/"}>
            Go to Platform
          </Button>
        </div>
      </div>
    );
  }

  const studentName = typeof certificate.student === "object"
    ? (certificate.student as any).name || "Verified Student"
    : "Verified Student";

  const courseTitle = typeof certificate.course === "object"
    ? (certificate.course as any)?.title || "Advanced Course"
    : "Advanced Course";

  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Verification Status Header */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-full">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-emerald-900 font-bold text-sm">Verified Credentials</p>
              <p className="text-emerald-700 text-xs">This certificate is authentic and issued by Morattu Coder Platform.</p>
            </div>
          </div>
          <div className="hidden sm:block">
            <Badge variant="success" className="px-3 py-1">Valid Certificate</Badge>
          </div>
        </div>

        {/* Main Certificate View */}
        <div className="relative">
          {/* Decorative Background Elements */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-100 rounded-full blur-3xl opacity-20" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary-100 rounded-full blur-3xl opacity-20" />

          <Card noPadding className="overflow-hidden border-0 shadow-2xl relative bg-white rounded-3xl">
            {/* Top Gradient Bar */}
            <div className="h-3 bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500" />

            <div className="px-8 sm:px-16 py-16 sm:py-24 text-center space-y-12 relative">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <Award className="w-[400px] h-[400px]" />
              </div>

              {/* Logo/Icon */}
              <div className="flex justify-center relative">
                <div className="p-6 bg-slate-50 rounded-full border border-slate-100 shadow-inner">
                  <Award className="h-16 w-16 text-primary-600" />
                </div>
                <div className="absolute -bottom-2 right-1/2 translate-x-12 bg-white rounded-full p-1 shadow-md border border-slate-100">
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4 relative">
                <h3 className="text-sm font-black text-primary-600 uppercase tracking-[0.3em]">Certificate of Excellence</h3>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {certificate.title}
                </h1>
                <div className="flex items-center justify-center gap-4 py-2">
                  <div className="h-px w-12 bg-slate-200" />
                  <span className="text-slate-400 font-medium italic">presented to</span>
                  <div className="h-px w-12 bg-slate-200" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-800 underline decoration-primary-200 decoration-8 underline-offset-8">
                  {studentName}
                </h2>
              </div>

              {/* Achievement description */}
              <div className="max-w-xl mx-auto space-y-2">
                <p className="text-lg text-slate-600 leading-relaxed">
                  For successful completion of the comprehensive curriculum in
                  <span className="font-bold text-slate-900"> {courseTitle}</span>.
                </p>
                <p className="text-slate-500 text-sm">
                  Demonstrating proficiency through rigorous assessments and practical applications.
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-8 border-y border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Issue Date</p>
                  <p className="flex items-center justify-center gap-1.5 font-semibold text-slate-700">
                    <Calendar className="h-4 w-4 text-primary-400" /> {issuedDate}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Verification ID</p>
                  <p className="font-mono text-xs font-semibold text-slate-600 bg-slate-50 py-1 px-2 rounded-md inline-block">
                    {certificate._id}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Grade / Score</p>
                  <p className="font-semibold text-slate-700">
                    {certificate.grade || "Passing"} {certificate.score ? `(${certificate.score}%)` : ""}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-4">
                <div className="text-left space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Signed By</p>
                  <div className="space-y-0">
                    <p className="font-serif text-xl text-slate-800 italic font-bold">Morattu Coder Team</p>
                    <p className="text-[10px] text-slate-400 font-medium">Platform Certification Authority</p>
                  </div>
                </div>
                {/* <div className="flex gap-3 print:hidden">
                  <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={handlePrint}>
                    Download Copy
                  </Button>
                </div> */}
              </div>
            </div>

            {/* Bottom Gradient Bar */}
            <div className="h-2 bg-gradient-to-r from-secondary-500 via-primary-500 to-primary-600" />
          </Card>
        </div>

        {/* Additional Info / Call to Action */}
        {/* <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4 print:hidden">
          <p className="text-slate-500 text-sm max-w-sm text-center sm:text-left">
            Interested in hiring this talent? View their full profile on our platform to see more projects and skills.
          </p>
          <div className="flex gap-4">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => window.location.href = "/"}>
              Visit Platform
            </Button>
          </div>
        </div> */}

        {/* CSS for print */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body { background: white !important; padding: 0 !important; }
            .min-h-screen { min-h-0 !important; }
            .max-w-4xl { max-width: 100% !important; margin: 0 !important; }
            .bg-emerald-50, .print\\:hidden, .shadow-2xl, .shadow-sm, .blur-3xl { display: none !important; }
            .rounded-3xl, .rounded-2xl { border-radius: 0 !important; }
            .Card { border: 1px solid #e5e7eb !important; box-shadow: none !important; }
            .py-12 { padding-top: 0 !important; padding-bottom: 0 !important; }
          }
        `}} />
      </div>
    </div>
  );
}
