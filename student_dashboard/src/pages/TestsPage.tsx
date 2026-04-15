import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { FileQuestion, Clock, PlayCircle, Trophy } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { enrollmentService, courseService } from "@/services";
import { Card, Spinner, EmptyState, Badge, Button, Tabs } from "@/components/ui";
import type { IEnrollment, IModule } from "@/types";
import clsx from "clsx";

interface TestInfo {
  testId: string;
  moduleId: string;
  moduleTitle: string;
  courseTitle: string;
  courseId: string;
}

export default function TestsPage() {
  const [activeTab, setActiveTab] = useState("available");

  const fetchEnrollments = useCallback(() => enrollmentService.getMyEnrollments(), []);
  const { data: enrollments, loading: enrollLoading } = useApi<IEnrollment[]>(fetchEnrollments, []);

  const [tests, setTests] = useState<TestInfo[]>([]);
  const [testsLoading, setTestsLoading] = useState(true);

  const fetchTests = useCallback(async () => {
    if (!enrollments?.length) {
      setTestsLoading(false);
      return { data: { data: [] } };
    }

    const allTests: TestInfo[] = [];

    for (const enrollment of enrollments) {
      const courseId = typeof enrollment.course === "object" ? enrollment.course._id : enrollment.course;
      const courseTitle = typeof enrollment.course === "object" ? enrollment.course.title : "Course";

      try {
        const res = await courseService.getModulesByCourse(courseId);
        const modules: IModule[] = res.data.data;

        for (const mod of modules) {
          if (mod.test) {
            allTests.push({
              testId: mod.test,
              moduleId: mod._id,
              moduleTitle: mod.title,
              courseTitle,
              courseId,
            });
          }
        }
      } catch {
        // Skip failed course module fetches
      }
    }

    setTests(allTests);
    setTestsLoading(false);
    return { data: { data: allTests } };
  }, [enrollments]);

  useApi(fetchTests, [enrollments]);

  const loading = enrollLoading || testsLoading;

  const completedModuleIds = new Set(
    enrollments?.flatMap((e) =>
      e.moduleProgress
        .filter((mp) => mp.testSubmission)
        .map((mp) => mp.module.toString())
    ) || []
  );

  // Build a map of moduleId -> submission info from populated testSubmission
  const moduleScoreMap = new Map<string, { submissionId: string; totalScore: number; maxScore: number }>();
  enrollments?.forEach((e) =>
    e.moduleProgress.forEach((mp) => {
      if (mp.testSubmission && typeof mp.testSubmission === "object") {
        moduleScoreMap.set(mp.module.toString(), {
          submissionId: mp.testSubmission._id,
          totalScore: mp.testSubmission.totalScore,
          maxScore: mp.testSubmission.maxScore,
        });
      }
    })
  );

  const availableTests = tests.filter((t) => !completedModuleIds.has(t.moduleId));
  const completedTests = tests.filter((t) => completedModuleIds.has(t.moduleId));

  const displayedTests = activeTab === "available" ? availableTests : completedTests;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Assessments & Tests</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Track your course evaluations, view available tests, and review your performance history.
        </p>
      </div>
 
      <Tabs
        tabs={[
          { id: "available", label: "Available Tests", count: availableTests.length },
          { id: "completed", label: "Completed History", count: completedTests.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
 
      {loading ? (
        <div className="py-20 flex justify-center bg-white rounded-3xl border border-slate-100 shadow-sm transition-all duration-500">
          <Spinner size="lg" />
        </div>
      ) : displayedTests.length === 0 ? (
        <Card className="bg-white border-slate-200 shadow-xl py-16">
          <EmptyState
            icon={<FileQuestion className="h-14 w-14 text-slate-300" />}
            title={activeTab === "available" ? "No Available Assessments" : "No Completed Records"}
            description={
              activeTab === "available"
                ? "You've caught up with all your assessments! New tests will appear here once assigned."
                : "You haven't completed any assessments yet. Get started with an available test!"
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayedTests.map((test, index) => (
            <Card key={`${test.testId}-${index}`} className="bg-white border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300 group overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-primary-50 rounded-full -mr-12 -mt-12 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
              
              <div className="mb-4 flex items-start justify-between relative z-10">
                <div className="rounded-2xl bg-primary-50 p-3 border border-primary-100/50 shadow-sm">
                  <FileQuestion className="h-6 w-6 text-primary-600" />
                </div>
                <Badge 
                  variant={activeTab === "completed" ? "success" : "info"}
                  className="px-3 py-1 font-bold text-[10px] uppercase tracking-widest rounded-full"
                >
                  {activeTab === "completed" ? "Completed" : "Active"}
                </Badge>
              </div>
 
              <div className="relative z-10">
                <h3 className="mb-1 text-lg font-extrabold text-slate-900 leading-tight group-hover:text-primary-700 transition-colors">{test.moduleTitle} Assessment</h3>
                <p className="mb-5 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{test.courseTitle}</p>
 
                <div className="mb-6 flex items-center gap-5 text-slate-500">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Timed</span>
                  </div>
                </div>
 
                {activeTab === "available" && (
                  <Link to={`/tests/${(test.testId as any)._id}/take`}>
                    <Button className="w-full font-bold py-3.5 rounded-2xl shadow-lg shadow-primary-500/20 active:scale-95 transition-transform" leftIcon={<PlayCircle className="h-4 w-4" />}>
                      Begin Assessment
                    </Button>
                  </Link>
                )}
 
                {activeTab === "completed" && moduleScoreMap.has(test.moduleId) && (() => {
                  const score = moduleScoreMap.get(test.moduleId)!;
                  const percentage = score.maxScore > 0 ? Math.round((score.totalScore / score.maxScore) * 100) : 0;
                  return (
                    <Link to={`/tests/results/${score.submissionId}`}>
                      <div className="group/score flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-3 hover:bg-emerald-100 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Trophy className="h-5 w-5 text-emerald-600 drop-shadow-sm" />
                          <span className="text-xl font-extrabold text-emerald-700">
                            {score.totalScore}<span className="text-emerald-400 text-sm ml-1">/ {score.maxScore}</span>
                          </span>
                        </div>
                        {score.maxScore > 0 && (
                          <div className={clsx(
                            "px-3 py-1 rounded-full text-[10px] font-bold border",
                            percentage >= 70 ? "bg-white text-emerald-600 border-emerald-200" :
                            percentage >= 40 ? "bg-white text-amber-600 border-amber-200" :
                            "bg-white text-red-600 border-red-200"
                          )}>
                            {percentage}%
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })()}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
