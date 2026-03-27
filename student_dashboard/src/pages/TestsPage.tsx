import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { FileQuestion, Clock, Star, PlayCircle, Trophy } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { enrollmentService, courseService } from "@/services";
import { Card, Spinner, EmptyState, Badge, Button, Tabs } from "@/components/ui";
import type { IEnrollment, IModule } from "@/types";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Tests</h1>
        <p className="mt-1 text-sm text-slate-400">View and take tests from your enrolled courses</p>
      </div>

      <Tabs
        tabs={[
          { id: "available", label: "Available", count: availableTests.length },
          { id: "completed", label: "Completed", count: completedTests.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {loading ? (
        <div className="py-12">
          <Spinner size="lg" />
        </div>
      ) : displayedTests.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileQuestion className="h-10 w-10 text-primary-400" />}
            title={activeTab === "available" ? "No Tests Available" : "No Completed Tests"}
            description={
              activeTab === "available"
                ? "There are no tests available right now. Check back later!"
                : "You haven't completed any tests yet."
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayedTests.map((test, index) => (
            <Card key={`${test.testId}-${index}`}>
              <div className="mb-3 flex items-start justify-between">
                <div className="rounded-lg bg-primary-500/20 p-2">
                  <FileQuestion className="h-5 w-5 text-primary-300" />
                </div>
                <Badge variant={activeTab === "completed" ? "success" : "info"}>
                  {activeTab === "completed" ? "Completed" : "Available"}
                </Badge>
              </div>

              <h3 className="mb-1 font-semibold text-white">{test.moduleTitle} Test</h3>
              <p className="mb-4 text-sm text-slate-400">{test.courseTitle}</p>

              <div className="mb-4 flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Timed
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4" /> Points
                </span>
              </div>

              {activeTab === "available" && (
                <Link to={`/tests/${(test.testId as any)._id}/take`}>
                  <Button className="w-full" leftIcon={<PlayCircle className="h-4 w-4" />}>
                    Start Test
                  </Button>
                </Link>
              )}

              {activeTab === "completed" && moduleScoreMap.has(test.moduleId) && (() => {
                const score = moduleScoreMap.get(test.moduleId)!;
                const percentage = score.maxScore > 0 ? Math.round((score.totalScore / score.maxScore) * 100) : 0;
                return (
                  <Link to={`/tests/results/${score.submissionId}`}>
                    <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-4 py-3 hover:bg-emerald-500/20 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-emerald-400" />
                        <span className="text-lg font-bold text-emerald-400">
                          {score.totalScore}{score.maxScore > 0 ? ` / ${score.maxScore}` : ""}
                        </span>
                      </div>
                      {score.maxScore > 0 && (
                        <Badge variant={percentage >= 70 ? "success" : percentage >= 40 ? "warning" : "danger"}>
                          {percentage}%
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })()}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
