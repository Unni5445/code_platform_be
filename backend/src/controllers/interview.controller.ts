import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import ErrorResponse from "../utils/errorResponse";
import ApiResponse from "../utils/ApiResponse";
import MockInterview from "../models/mockInterview.model";
import InterviewAttempt from "../models/interviewAttempt.model";

class InterviewController {
  // ================= LIST MOCK INTERVIEWS (Student) =================
  static getInterviews = asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!._id;
    const { difficulty, company } = req.query;

    const filter: Record<string, any> = { isDeleted: false, isActive: true };
    if (difficulty) filter.difficulty = difficulty;
    if (company) filter.company = { $regex: company, $options: "i" };

    const interviews = await MockInterview.find(filter)
      .select("-questions.expectedPoints") // hide scoring criteria from students
      .sort({ difficulty: 1, company: 1 })
      .lean();

    // Get student's attempts for each interview
    const attempts = await InterviewAttempt.find({
      student: studentId,
      interview: { $in: interviews.map((i) => i._id) },
      isDeleted: false,
    })
      .select("interview overallScore completedAt")
      .lean();

    const attemptMap = new Map<string, { count: number; bestScore: number }>();
    for (const attempt of attempts) {
      const key = attempt.interview.toString();
      const existing = attemptMap.get(key);
      if (existing) {
        existing.count++;
        existing.bestScore = Math.max(existing.bestScore, attempt.overallScore);
      } else {
        attemptMap.set(key, { count: 1, bestScore: attempt.overallScore });
      }
    }

    const enriched = interviews.map((interview: any) => {
      const stats = attemptMap.get(interview._id.toString());
      return {
        ...interview,
        attempts: stats?.count || 0,
        bestScore: stats?.bestScore ?? null,
        status: stats ? (stats.bestScore >= 70 ? "completed" : "available") : "available",
      };
    });

    res.status(200).json(
      new ApiResponse(200, enriched, "Mock interviews fetched successfully")
    );
  });

  // ================= GET SINGLE INTERVIEW =================
  static getInterviewById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const interview = await MockInterview.findOne({
        _id: req.params.id,
        isDeleted: false,
      }).lean();

      if (!interview) return next(new ErrorResponse("Interview not found", 404));

      // Get student's attempts
      const attempts = await InterviewAttempt.find({
        student: req.user!._id,
        interview: req.params.id,
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json(
        new ApiResponse(200, {
          ...interview,
          questions: interview.questions.map((q) => ({
            ...q,
            expectedPoints: undefined, // hide criteria
          })),
          attempts: attempts.length,
          bestScore: attempts.length > 0
            ? Math.max(...attempts.map((a) => a.overallScore))
            : null,
          attemptHistory: attempts.map((a) => ({
            _id: a._id,
            overallScore: a.overallScore,
            scores: a.scores,
            timeTaken: a.timeTaken,
            completedAt: a.completedAt,
          })),
        }, "Interview fetched successfully")
      );
    }
  );

  // ================= SUBMIT INTERVIEW ATTEMPT (Student) =================
  static submitAttempt = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const studentId = req.user!._id;
      const interviewId = req.params.id;

      const interview = await MockInterview.findOne({
        _id: interviewId,
        isDeleted: false,
        isActive: true,
      });
      if (!interview) return next(new ErrorResponse("Interview not found", 404));

      const { answers, timeTaken } = req.body;

      if (!answers || !Array.isArray(answers)) {
        return next(new ErrorResponse("Answers array is required", 400));
      }

      // Calculate scores from self-evaluation
      const selfScores = answers.map((a: any) => a.selfScore || 3);
      const avgSelf = selfScores.reduce((s: number, v: number) => s + v, 0) / selfScores.length;

      // Compute category scores based on question categories and self-scores
      const categoryScores = {
        technicalDepth: 0,
        communication: 0,
        edgeCases: 0,
        problemSolving: 0,
      };

      let techCount = 0, commCount = 0, edgeCount = 0, probCount = 0;

      for (let i = 0; i < answers.length; i++) {
        const q = interview.questions[answers[i].questionIndex];
        if (!q) continue;
        const score = ((answers[i].selfScore || 3) / 5) * 100;

        if (q.category === "technical") {
          categoryScores.technicalDepth += score;
          categoryScores.problemSolving += score;
          techCount++;
          probCount++;
        } else if (q.category === "behavioral") {
          categoryScores.communication += score;
          commCount++;
        } else if (q.category === "system-design") {
          categoryScores.edgeCases += score;
          categoryScores.problemSolving += score;
          edgeCount++;
          probCount++;
        }
      }

      if (techCount > 0) categoryScores.technicalDepth = Math.round(categoryScores.technicalDepth / techCount);
      if (commCount > 0) categoryScores.communication = Math.round(categoryScores.communication / commCount);
      if (edgeCount > 0) categoryScores.edgeCases = Math.round(categoryScores.edgeCases / edgeCount);
      if (probCount > 0) categoryScores.problemSolving = Math.round(categoryScores.problemSolving / probCount);

      // Fallback: if no questions matched a category, use avg
      const fallbackScore = Math.round((avgSelf / 5) * 100);
      if (techCount === 0) categoryScores.technicalDepth = fallbackScore;
      if (commCount === 0) categoryScores.communication = fallbackScore;
      if (edgeCount === 0) categoryScores.edgeCases = fallbackScore;
      if (probCount === 0) categoryScores.problemSolving = fallbackScore;

      const overallScore = Math.round(
        (categoryScores.technicalDepth +
          categoryScores.communication +
          categoryScores.edgeCases +
          categoryScores.problemSolving) / 4
      );

      const attempt = await InterviewAttempt.create({
        student: studentId,
        interview: interviewId,
        answers: answers.map((a: any) => ({
          questionIndex: a.questionIndex,
          response: a.response || "",
          selfScore: a.selfScore,
        })),
        scores: categoryScores,
        overallScore,
        timeTaken: timeTaken || 0,
        completedAt: new Date(),
      });

      res.status(201).json(
        new ApiResponse(201, {
          _id: attempt._id,
          overallScore,
          scores: categoryScores,
          timeTaken,
        }, "Interview attempt submitted successfully")
      );
    }
  );

  // ================= GET STUDENT INTERVIEW STATS =================
  static getStats = asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!._id;

    const attempts = await InterviewAttempt.find({
      student: studentId,
      isDeleted: false,
      completedAt: { $exists: true },
    }).lean();

    if (attempts.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, {
          totalAttempts: 0,
          averageScore: 0,
          scores: {
            technicalDepth: 0,
            communication: 0,
            edgeCases: 0,
            problemSolving: 0,
          },
          interviewsCompleted: 0,
        }, "No interview attempts yet")
      );
    }

    const uniqueInterviews = new Set(attempts.map((a) => a.interview.toString()));
    const avgScores = {
      technicalDepth: 0,
      communication: 0,
      edgeCases: 0,
      problemSolving: 0,
    };

    for (const attempt of attempts) {
      avgScores.technicalDepth += attempt.scores.technicalDepth;
      avgScores.communication += attempt.scores.communication;
      avgScores.edgeCases += attempt.scores.edgeCases;
      avgScores.problemSolving += attempt.scores.problemSolving;
    }

    const count = attempts.length;
    avgScores.technicalDepth = Math.round(avgScores.technicalDepth / count);
    avgScores.communication = Math.round(avgScores.communication / count);
    avgScores.edgeCases = Math.round(avgScores.edgeCases / count);
    avgScores.problemSolving = Math.round(avgScores.problemSolving / count);

    const averageScore = Math.round(
      (avgScores.technicalDepth + avgScores.communication + avgScores.edgeCases + avgScores.problemSolving) / 4
    );

    res.status(200).json(
      new ApiResponse(200, {
        totalAttempts: count,
        averageScore,
        scores: avgScores,
        interviewsCompleted: uniqueInterviews.size,
      }, "Interview stats fetched successfully")
    );
  });

  // ================= ADMIN: GET ALL INTERVIEWS =================
  static getAdminInterviews = asyncHandler(async (req: Request, res: Response) => {
    const { status, limit = 50, page = 1 } = req.query;

    const filter: Record<string, any> = { isDeleted: false };
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    const skip = (Number(page) - 1) * Number(limit);

    const [interviews, total] = await Promise.all([
      MockInterview.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      MockInterview.countDocuments(filter),
    ]);

    // Attach basic participant count per interview
    const enriched = await Promise.all(
      interviews.map(async (interview: any) => {
        const attemptsCount = await InterviewAttempt.countDocuments({
          interview: interview._id,
          isDeleted: false,
        });

        return {
          ...interview,
          participants: attemptsCount, // roughly equivalent to submissions
        };
      })
    );

    res.status(200).json(
      new ApiResponse(200, {
        interviews: enriched,
        totalInterviews: total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      }, "Mock interviews fetched successfully")
    );
  });

  // ================= ADMIN: GET INTERVIEW ATTEMPTS =================
  static getInterviewAttempts = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const interview = await MockInterview.findOne({
        _id: req.params.id,
        isDeleted: false,
      }).lean();
      
      if (!interview) return next(new ErrorResponse("Interview not found", 404));

      const attempts = await InterviewAttempt.find({
        interview: req.params.id,
        isDeleted: false,
      })
        .populate("student", "name email")
        .sort({ overallScore: -1, timeTaken: 1 })
        .lean();

      res.status(200).json(
        new ApiResponse(200, {
          interview: { _id: interview._id, company: interview.company, role: interview.role },
          attempts,
          totalAttempts: attempts.length,
        }, "Interview attempts fetched successfully")
      );
    }
  );

  // ================= CREATE INTERVIEW (Admin) =================
  static createInterview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { company, role, difficulty, duration, requiredLevel, topics, questions } = req.body;

      // ── Required string fields ──
      if (!company || typeof company !== "string" || !company.trim()) {
        return next(new ErrorResponse("Company name is required", 400));
      }
      if (!role || typeof role !== "string" || !role.trim()) {
        return next(new ErrorResponse("Role is required", 400));
      }

      // ── Difficulty ──
      const validDifficulties = ["Easy", "Medium", "Hard", "Boss"];
      if (difficulty && !validDifficulties.includes(difficulty)) {
        return next(new ErrorResponse(`Difficulty must be one of: ${validDifficulties.join(", ")}`, 400));
      }

      // ── Duration ──
      if (duration !== undefined) {
        const dur = Number(duration);
        if (isNaN(dur) || dur < 1 || dur > 300) {
          return next(new ErrorResponse("Duration must be between 1 and 300 minutes", 400));
        }
      }

      // ── Required Level ──
      if (requiredLevel !== undefined) {
        const lvl = Number(requiredLevel);
        if (isNaN(lvl) || lvl < 0) {
          return next(new ErrorResponse("Required level must be a non-negative number", 400));
        }
      }

      // ── Topics ──
      if (topics !== undefined) {
        if (!Array.isArray(topics)) {
          return next(new ErrorResponse("Topics must be an array of strings", 400));
        }
        for (let i = 0; i < topics.length; i++) {
          if (typeof topics[i] !== "string" || !topics[i].trim()) {
            return next(new ErrorResponse(`Topic at index ${i} must be a non-empty string`, 400));
          }
        }
      }

      // ── Questions ──
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return next(new ErrorResponse("At least one question is required", 400));
      }

      const validCategories = ["technical", "behavioral", "system-design"];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question || typeof q.question !== "string" || !q.question.trim()) {
          return next(new ErrorResponse(`Question ${i + 1}: Question text is required`, 400));
        }
        if (!q.category || !validCategories.includes(q.category)) {
          return next(new ErrorResponse(`Question ${i + 1}: Category must be one of: ${validCategories.join(", ")}`, 400));
        }
        if (q.hints !== undefined && !Array.isArray(q.hints)) {
          return next(new ErrorResponse(`Question ${i + 1}: Hints must be an array of strings`, 400));
        }
        if (q.expectedPoints !== undefined && !Array.isArray(q.expectedPoints)) {
          return next(new ErrorResponse(`Question ${i + 1}: Expected points must be an array of strings`, 400));
        }
      }

      const interview = await MockInterview.create(req.body);
      res.status(201).json(
        new ApiResponse(201, interview, "Mock interview created successfully")
      );
    }
  );

  // ================= UPDATE INTERVIEW (Admin) =================
  static updateInterview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { company, role, difficulty, duration, requiredLevel, topics, questions } = req.body;

      // Validate fields if they are being updated
      if (company !== undefined && (typeof company !== "string" || !company.trim())) {
        return next(new ErrorResponse("Company name must be a non-empty string", 400));
      }
      if (role !== undefined && (typeof role !== "string" || !role.trim())) {
        return next(new ErrorResponse("Role must be a non-empty string", 400));
      }

      const validDifficulties = ["Easy", "Medium", "Hard", "Boss"];
      if (difficulty !== undefined && !validDifficulties.includes(difficulty)) {
        return next(new ErrorResponse(`Difficulty must be one of: ${validDifficulties.join(", ")}`, 400));
      }

      if (duration !== undefined) {
        const dur = Number(duration);
        if (isNaN(dur) || dur < 1 || dur > 300) {
          return next(new ErrorResponse("Duration must be between 1 and 300 minutes", 400));
        }
      }

      if (requiredLevel !== undefined) {
        const lvl = Number(requiredLevel);
        if (isNaN(lvl) || lvl < 0) {
          return next(new ErrorResponse("Required level must be a non-negative number", 400));
        }
      }

      if (topics !== undefined) {
        if (!Array.isArray(topics)) {
          return next(new ErrorResponse("Topics must be an array of strings", 400));
        }
      }

      if (questions !== undefined) {
        if (!Array.isArray(questions) || questions.length === 0) {
          return next(new ErrorResponse("Questions must be a non-empty array", 400));
        }
        const validCategories = ["technical", "behavioral", "system-design"];
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (!q.question || typeof q.question !== "string" || !q.question.trim()) {
            return next(new ErrorResponse(`Question ${i + 1}: Question text is required`, 400));
          }
          if (!q.category || !validCategories.includes(q.category)) {
            return next(new ErrorResponse(`Question ${i + 1}: Category must be one of: ${validCategories.join(", ")}`, 400));
          }
        }
      }

      const interview = await MockInterview.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        req.body,
        { new: true, runValidators: true }
      );
      if (!interview) return next(new ErrorResponse("Interview not found", 404));

      res.status(200).json(
        new ApiResponse(200, interview, "Mock interview updated successfully")
      );
    }
  );

  // ================= DELETE INTERVIEW (Admin) =================
  static deleteInterview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const interview = await MockInterview.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { isDeleted: true, isActive: false },
        { new: true }
      );
      if (!interview) return next(new ErrorResponse("Interview not found", 404));

      res.status(200).json(
        new ApiResponse(200, null, "Mock interview deleted successfully")
      );
    }
  );
}

export default InterviewController;
