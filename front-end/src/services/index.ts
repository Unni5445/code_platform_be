export { authService } from "./auth.service";
export { userService } from "./user.service";
export { courseService } from "./course.service";
export { testService, questionService } from "./test.service";
export { certificateService } from "./certificate.service";
export { batchService } from "./batch.service";
export { organisationService } from "./organisation.service";
export { dashboardService } from "./dashboard.service";
export type {
  DashboardStats,
  UserGrowthItem,
  TestPerformanceItem,
  LeaderboardItem,
  ActivityItem,
} from "./dashboard.service";
export { moduleService, submoduleService } from "./module.service";
export { enrollmentService } from "./enrollment.service";
export { contestService } from "./contest.service";
export type { IContest, ContestListResponse, ContestLeaderboardEntry, IContestSubmission, IContestSubmissionsResponse } from "./contest.service";

export { interviewService } from "./interview.service";
export type { IMockInterview, IMockInterviewListResponse, IInterviewAttempt, IInterviewAttemptsResponse } from "./interview.service";
