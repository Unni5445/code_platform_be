import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { FileQuestion, Clock, Star, PlayCircle } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { enrollmentService, courseService } from "@/services";
import { Card, Spinner, EmptyState, Badge, Button, Tabs } from "@/components/ui";
import type { IEnrollment, IModule } from "@/types";
import test from "node:test";

interface TestInfo {
  testId: string;
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

  // Fetch modules for all enrolled courses to get tests
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

  const completedTestIds = new Set(
    enrollments?.flatMap((e) =>
      e.moduleProgress
        .filter((mp) => mp.testSubmission)
        .map((mp) => mp.module)
    ) || []
  );

  const availableTests = tests.filter((t) => !completedTestIds.has((t.testId as any)._id));
  const completedTests = tests.filter((t) => completedTestIds.has((t.testId as any)._id));

  const displayedTests = activeTab === "available" ? availableTests : completedTests;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tests</h1>
        <p className="text-sm text-gray-500 mt-1">View and take tests from your enrolled courses</p>
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
        <div className="py-12"><Spinner size="lg" /></div>
      ) : displayedTests.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileQuestion className="h-10 w-10 text-primary-400" />}
            title={activeTab === "available" ? "No Tests Available" : "No Completed Tests"}
            description={activeTab === "available"
              ? "There are no tests available right now. Check back later!"
              : "You haven't completed any tests yet."
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedTests.map((test, index) => (
            <Card key={`${test.testId}-${index}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <FileQuestion className="h-5 w-5 text-primary-600" />
                </div>
                <Badge variant={activeTab === "completed" ? "success" : "info"}>
                  {activeTab === "completed" ? "Completed" : "Available"}
                </Badge>
              </div>

              <h3 className="font-semibold text-gray-900 mb-1">{test.moduleTitle} Test</h3>
              <p className="text-sm text-gray-500 mb-4">{test.courseTitle}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
