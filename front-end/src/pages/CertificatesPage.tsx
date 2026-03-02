import { useState, useCallback } from "react";
import { Plus, Eye, Download, ExternalLink, Award, QrCode } from "lucide-react";
import { certificateService } from "@/services";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks";
import { Button, Card, Badge, Modal, EmptyState, SearchInput, Spinner } from "@/components/ui";
import { useModal } from "@/hooks";
import type { ICertificate } from "@/types";

export default function CertificatesPage() {
  const [search, setSearch] = useState("");
  const [selectedCert, setSelectedCert] = useState<ICertificate | null>(null);
  const viewModal = useModal();

  const debouncedSearch = useDebounce(search, 300);

  const fetchCerts = useCallback(
    () => certificateService.getCertificates({ search: debouncedSearch || undefined }),
    [debouncedSearch]
  );

  const { data, loading } = useApi(fetchCerts, [debouncedSearch]);

  const certificates = data?.certificates ?? [];

  const getStudentName = (student: string | { name?: string; _id: string }) => {
    if (typeof student === "object" && student !== null) return student.name || "Unknown";
    return student || "Unknown";
  };

  const getCourseName = (course: string | { title?: string; _id: string } | undefined) => {
    if (!course) return "\u2014";
    if (typeof course === "object" && course !== null) return course.title || "Unknown";
    return course;
  };

  const gradeVariant = (grade?: string): "success" | "info" | "warning" | "gray" => {
    if (!grade) return "gray";
    if (grade.includes("A")) return "success";
    if (grade.includes("B")) return "info";
    return "warning";
  };

  const totalIssued = data?.totalCertificates ?? certificates.length;
  const verifiedCount = certificates.filter((c) => c.verificationLink).length;
  const aGradeCount = certificates.filter((c) => c.grade?.includes("A")).length;
  const avgScore = certificates.length > 0
    ? Math.round(certificates.reduce((s, c) => s + (c.score || 0), 0) / certificates.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="w-72">
          <SearchInput placeholder="Search certificates..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>Generate Certificate</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Award className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalIssued}</p>
              <p className="text-sm text-gray-500">Total Issued</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-secondary-100 rounded-xl">
              <QrCode className="h-5 w-5 text-secondary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{verifiedCount}</p>
              <p className="text-sm text-gray-500">Verified</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Award className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{aGradeCount}</p>
              <p className="text-sm text-gray-500">A Grade</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{avgScore}%</p>
              <p className="text-sm text-gray-500">Avg Score</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl shadow-card border border-surface-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        ) : certificates.length === 0 ? (
          <EmptyState title="No certificates found" description="No certificates match your search." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-surface-secondary border-b border-surface-border">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Certificate</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Course</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Grade</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Score</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Issued</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {certificates.map((cert) => (
                <tr key={cert._id} className="hover:bg-primary-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary-100 rounded-lg">
                        <Award className="h-4 w-4 text-secondary-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{cert.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{getStudentName(cert.student as string)}</span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-600">{getCourseName(cert.course as string)}</span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <Badge variant={gradeVariant(cert.grade)}>{cert.grade || "\u2014"}</Badge>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-sm font-medium text-gray-900">{cert.score ? `${cert.score}%` : "\u2014"}</span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-500">{new Date(cert.issuedAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => { setSelectedCert(cert); viewModal.open(); }}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-lg text-gray-400 hover:text-secondary-600 hover:bg-secondary-50 transition-colors cursor-pointer">
                        <Download className="h-4 w-4" />
                      </button>
                      {cert.verificationLink && (
                        <button className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Certificate Preview Modal */}
      <Modal isOpen={viewModal.isOpen} onClose={() => { viewModal.close(); setSelectedCert(null); }} title="Certificate Preview" size="lg">
        {selectedCert && (
          <div className="space-y-6">
            <div className="relative bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8 border-2 border-primary-200 text-center">
              <div className="absolute top-4 left-4 h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-primary-600" />
              </div>
              <div className="absolute top-4 right-4 h-12 w-12 bg-secondary-100 rounded-full flex items-center justify-center">
                <QrCode className="h-6 w-6 text-secondary-600" />
              </div>
              <p className="text-xs uppercase tracking-widest text-primary-500 font-medium mt-4">Certificate of Completion</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-3">{selectedCert.title}</h3>
              <p className="text-gray-500 mt-2">Awarded to</p>
              <p className="text-xl font-bold text-primary-700 mt-1">{getStudentName(selectedCert.student as string)}</p>
              <div className="flex justify-center gap-8 mt-6">
                <div>
                  <p className="text-xs text-gray-500">Grade</p>
                  <p className="text-lg font-bold text-gray-900">{selectedCert.grade}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Score</p>
                  <p className="text-lg font-bold text-gray-900">{selectedCert.score}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Issued</p>
                  <p className="text-lg font-bold text-gray-900">{new Date(selectedCert.issuedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-secondary rounded-lg p-3">
                <p className="text-xs text-gray-500">Course</p>
                <p className="text-sm font-medium mt-1">{getCourseName(selectedCert.course as string)}</p>
              </div>
              <div className="bg-surface-secondary rounded-lg p-3">
                <p className="text-xs text-gray-500">Certificate ID</p>
                <p className="text-sm font-medium mt-1 font-mono">{selectedCert._id}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="primary" leftIcon={<Download className="h-4 w-4" />} className="flex-1">Download PDF</Button>
              <Button variant="outline" leftIcon={<ExternalLink className="h-4 w-4" />} className="flex-1">Verify Online</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
