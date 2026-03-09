import { Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import User from "../models/user.model";
import Course from "../models/course.model";
import Test from "../models/test.model";
import Question from "../models/question.model";
import Certificate from "../models/certificate.mode";
import Leaderboard from "../models/leaderboard.model";
import StudentTestSubmission from "../models/studentTestSubmission.model";
import ApiResponse from "../utils/ApiResponse";

class DashboardController {
  // ================= GET DASHBOARD STATS =================
  static getStats = asyncHandler(async (req: Request, res: Response) => {
    const isAdmin = req.user?.role === "ADMIN";
    const orgFilter = isAdmin ? { organisation: req.user!.organisation } : {};

    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      totalCourses,
      activeTests,
      totalTests,
      totalCertificates,
      totalQuestions,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false, ...orgFilter }),
      User.countDocuments({ isDeleted: false, role: "STUDENT", ...orgFilter }),
      User.countDocuments({ isDeleted: false, role: { $in: ["ADMIN", "SUPER_ADMIN"] }, ...orgFilter }),
      Course.countDocuments(),
      Test.countDocuments({ isActive: true }),
      Test.countDocuments(),
      Certificate.countDocuments(),
      Question.countDocuments(),
    ]);

    // Average points and streak for students
    const studentStats = await User.aggregate([
      { $match: { isDeleted: false, role: "STUDENT", ...orgFilter } },
      {
        $group: {
          _id: null,
          avgPoints: { $avg: "$points" },
          avgStreak: { $avg: "$streak" },
          totalPoints: { $sum: "$points" },
        },
      },
    ]);

    const avgPoints = Math.round(studentStats[0]?.avgPoints || 0);
    const avgStreak = Math.round(studentStats[0]?.avgStreak || 0);

    res.status(200).json(
      new ApiResponse(200, {
        totalUsers,
        totalStudents,
        totalAdmins,
        totalCourses,
        activeTests,
        totalTests,
        totalCertificates,
        totalQuestions,
        avgPoints,
        avgStreak,
      }, "Dashboard stats fetched successfully")
    );
  });

  // ================= GET USER GROWTH DATA =================
  static getUserGrowth = asyncHandler(async (req: Request, res: Response) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const isAdmin = req.user?.role === "ADMIN";
    const orgFilter = isAdmin ? { organisation: req.user!.organisation } : {};

    const growth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, isDeleted: false, ...orgFilter } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = growth.map((g) => ({
      month: months[g._id.month - 1],
      users: g.count,
    }));

    res.status(200).json(new ApiResponse(200, data, "User growth data fetched successfully"));
  });

  // ================= GET TEST PERFORMANCE =================
  static getTestPerformance = asyncHandler(async (_req: Request, res: Response) => {
    const tests = await Test.find({ isActive: true }).populate("course", "title").limit(10);

    const performanceData = await Promise.all(
      tests.map(async (test) => {
        const submissions = await StudentTestSubmission.find({ test: test._id });
        const totalSubmissions = submissions.length;

        if (totalSubmissions === 0) {
          return {
            name: test.title,
            avgScore: 0,
            passRate: 0,
            submissions: 0,
          };
        }

        const totalScore = submissions.reduce((sum, s) => sum + s.totalScore, 0);
        const avgScore = Math.round(totalScore / totalSubmissions);
        const passCount = submissions.filter(
          (s) => s.totalScore >= (test.totalPoints || 0) * 0.4
        ).length;
        const passRate = Math.round((passCount / totalSubmissions) * 100);

        return {
          name: test.title,
          avgScore,
          passRate,
          submissions: totalSubmissions,
        };
      })
    );

    res.status(200).json(new ApiResponse(200, performanceData, "Test performance fetched successfully"));
  });

  // ================= GET LEADERBOARD =================
  static getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const students = await User.find({ isDeleted: false, role: "STUDENT" })
      .select("name email points streak maxStreak")
      .sort({ points: -1 })
      .limit(limit);

    const leaderboard = students.map((user) => ({
      _id: user._id,
      student: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      points: user.points,
      streak: user.streak,
      maxStreak: user.maxStreak,
    }));

    res.status(200).json(new ApiResponse(200, { leaderboard, total: leaderboard.length }, "Leaderboard fetched successfully"));
  });

  // ================= GET RECENT ACTIVITY =================
  static getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
    const isAdmin = req.user?.role === "ADMIN";
    const orgFilter = isAdmin ? { organisation: req.user!.organisation } : {};

    // Get recent user registrations
    const recentUsers = await User.find({ isDeleted: false, ...orgFilter })
      .select("name createdAt role")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent submissions
    const recentSubmissions = await StudentTestSubmission.find()
      .populate("student", "name")
      .populate("test", "title")
      .sort({ attemptedAt: -1 })
      .limit(5);

    // Get recent certificates
    const recentCerts = await Certificate.find()
      .populate("student", "name")
      .sort({ issuedAt: -1 })
      .limit(5);

    const activities: { user: string; action: string; time: string; type: string }[] = [];

    recentUsers.forEach((u) => {
      activities.push({
        user: u.name || "Unknown",
        action: `Joined as ${u.role}`,
        time: u.createdAt.toISOString(),
        type: "enrollment",
      });
    });

    recentSubmissions.forEach((s) => {
      const student = s.student as any;
      const test = s.test as any;
      activities.push({
        user: student?.name || "Unknown",
        action: `Submitted ${test?.title || "a test"} (Score: ${s.totalScore})`,
        time: s.attemptedAt.toISOString(),
        type: "submission",
      });
    });

    recentCerts.forEach((c) => {
      const student = c.student as any;
      activities.push({
        user: student?.name || "Unknown",
        action: `Earned certificate: ${c.title}`,
        time: c.issuedAt.toISOString(),
        type: "certificate",
      });
    });

    // Sort by time descending and take top 10
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    res.status(200).json(new ApiResponse(200, activities.slice(0, 10), "Recent activity fetched successfully"));
  });
}

export default DashboardController;
