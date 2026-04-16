import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import ErrorResponse from "../utils/errorResponse";
import ApiResponse from "../utils/ApiResponse";
import Contest from "../models/contest.model";
import ContestSubmission from "../models/contestSubmission.model";
import Question from "../models/question.model";
import User from "../models/user.model";
import { executeCode } from "../utils/piston";
import { Types } from "mongoose";

class ContestController {
  // ================= LIST CONTESTS (Student) =================
  static getContests = asyncHandler(async (req: Request, res: Response) => {
    const { status, page = 1, limit = 20 } = req.query;
    const studentId = (req.user!._id as Types.ObjectId).toString();

    const filter: Record<string, any> = { isDeleted: false, isActive: true };

    // Auto-compute live status based on time
    const now = new Date();

    if (status === "live") {
      filter.startTime = { $lte: now };
      filter.endTime = { $gte: now };
    } else if (status === "upcoming") {
      filter.startTime = { $gt: now };
    } else if (status === "ended") {
      filter.endTime = { $lt: now };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [contests, total] = await Promise.all([
      Contest.find(filter)
        .select("-registeredStudents")
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Contest.countDocuments(filter),
    ]);

    // Attach participant count, registration status, and submission status per contest
    const enriched = await Promise.all(
      contests.map(async (contest: any) => {
        const [participantCount, existingSubmission] = await Promise.all([
          Contest.findById(contest._id).select("registeredStudents").lean(),
          ContestSubmission.findOne({
            student: studentId,
            contest: contest._id,
            finishedAt: { $exists: true },
          }).lean(),
        ]);
        const isRegistered = participantCount?.registeredStudents?.some(
          (id: any) => id.toString() === studentId
        );

        // Compute live status
        let computedStatus = contest.status;
        if (contest.startTime <= now && contest.endTime >= now) {
          computedStatus = "LIVE";
        } else if (contest.startTime > now) {
          computedStatus = "UPCOMING";
        } else if (contest.endTime < now) {
          computedStatus = "ENDED";
        }

        return {
          ...contest,
          status: computedStatus,
          participants: participantCount?.registeredStudents?.length || 0,
          isRegistered: !!isRegistered,
          hasSubmitted: !!existingSubmission,
        };
      })
    );

    res.status(200).json(
      new ApiResponse(200, {
        contests: enriched,
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalContests: total,
      }, "Contests fetched successfully")
    );
  });

  // ================= GET SINGLE CONTEST =================
  static getContestById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const contest = await Contest.findOne({
        _id: req.params.id,
        isDeleted: false,
      })
        .populate("questions", "title difficulty points type languages tags")
        .lean();

      if (!contest) return next(new ErrorResponse("Contest not found", 404));

      const now = new Date();
      let computedStatus = contest.status;
      if (contest.startTime <= now && contest.endTime >= now) computedStatus = "LIVE";
      else if (contest.startTime > now) computedStatus = "UPCOMING";
      else computedStatus = "ENDED";

      const isRegistered = contest.registeredStudents?.some(
        (id: any) => id.toString() === (req.user!._id as Types.ObjectId).toString()
      );

      res.status(200).json(
        new ApiResponse(200, {
          ...contest,
          status: computedStatus,
          participants: contest.registeredStudents?.length || 0,
          isRegistered: !!isRegistered,
          registeredStudents: undefined, // hide full list
        }, "Contest fetched successfully")
      );
    }
  );

  // ================= REGISTER FOR CONTEST =================
  static registerForContest = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const studentId = req.user!._id as Types.ObjectId;
      const contest = await Contest.findOne({
        _id: req.params.id,
        isDeleted: false,
        isActive: true,
      });

      if (!contest) return next(new ErrorResponse("Contest not found", 404));

      const now = new Date();
      if (contest.endTime < now) {
        return next(new ErrorResponse("Contest has already ended", 400));
      }

      // Check max participants
      if (
        contest.maxParticipants &&
        contest.registeredStudents.length >= contest.maxParticipants
      ) {
        return next(new ErrorResponse("Contest is full", 400));
      }

      // Check already registered
      if (contest.registeredStudents.some((id) => id.toString() === studentId.toString())) {
        return next(new ErrorResponse("Already registered for this contest", 400));
      }

      contest.registeredStudents.push(studentId as any);
      await contest.save();

      res.status(200).json(
        new ApiResponse(200, { registered: true }, "Registered for contest successfully")
      );
    }
  );

  // ================= GET CONTEST LEADERBOARD =================
  static getContestLeaderboard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const contest = await Contest.findOne({
        _id: req.params.id,
        isDeleted: false,
      });
      if (!contest) return next(new ErrorResponse("Contest not found", 404));

      const submissions = await ContestSubmission.find({
        contest: req.params.id,
        isDeleted: false,
      })
        .populate("student", "name email")
        .sort({ score: -1, timeTaken: 1 })
        .limit(50)
        .lean();

      const leaderboard = submissions.map((sub, index) => ({
        rank: index + 1,
        student: sub.student,
        score: sub.score,
        solvedCount: sub.solvedCount,
        totalQuestions: sub.totalQuestions,
        timeTaken: sub.timeTaken,
        finishedAt: sub.finishedAt,
      }));

      res.status(200).json(
        new ApiResponse(200, { leaderboard }, "Contest leaderboard fetched successfully")
      );
    }
  );

  // ================= GET CONTEST SUBMISSIONS (Admin) =================
  static getContestSubmissions = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const contest = await Contest.findOne({
        _id: req.params.id,
        isDeleted: false,
      }).lean();
      if (!contest) return next(new ErrorResponse("Contest not found", 404));

      const submissions = await ContestSubmission.find({
        contest: req.params.id,
        isDeleted: false,
      })
        .populate("student", "name email")
        .populate("answers.question", "title difficulty points type options correctAnswer")
        .sort({ score: -1, timeTaken: 1 })
        .lean();

      res.status(200).json(
        new ApiResponse(200, {
          contest: { _id: contest._id, title: contest.title },
          submissions,
          totalSubmissions: submissions.length,
        }, "Contest submissions fetched successfully")
      );
    }
  );

  // ================= GET CONTEST BATTLE (Student) =================
  static getContestBattle = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const contest = await Contest.findOne({
        _id: req.params.id,
        isDeleted: false,
      }).populate("questions");

      if (!contest) return next(new ErrorResponse("Contest not found", 404));

      const now = new Date();
      if (contest.startTime > now || contest.endTime < now) {
        return next(new ErrorResponse("Contest is not currently live", 400));
      }

      const studentId = (req.user!._id as Types.ObjectId).toString();
      const isRegistered = contest.registeredStudents.some(
        (id: any) => id.toString() === studentId
      );
      if (!isRegistered) return next(new ErrorResponse("Not registered for this contest", 403));

      // Block re-entry if already submitted
      const alreadySubmitted = await ContestSubmission.findOne({
        student: req.user!._id,
        contest: req.params.id,
        finishedAt: { $exists: true },
      });
      if (alreadySubmitted) {
        return next(new ErrorResponse("You have already submitted this contest", 400));
      }

      res.status(200).json(
        new ApiResponse(200, contest, "Contest battle fetched successfully")
      );
    }
  );

  // ================= START CONTEST =================
  static startContest = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id: contestId } = req.params;
      const studentId = req.user!._id;

      const contest = await Contest.findById(contestId);
      if (!contest) return next(new ErrorResponse("Contest not found", 404));

      const now = new Date();
      if (contest.startTime > now || contest.endTime < now) {
        return next(new ErrorResponse("Contest is not currently live", 400));
      }

      const isRegistered = contest.registeredStudents.some(
        (id: any) => id.toString() === (req.user!._id as Types.ObjectId).toString()
      );
      if (!isRegistered) return next(new ErrorResponse("Not registered for this contest", 403));

      let submission = await ContestSubmission.findOne({
        student: studentId,
        contest: contestId,
        finishedAt: { $exists: false },
      });

      if (!submission) {
        const completed = await ContestSubmission.findOne({
          student: studentId,
          contest: contestId,
          finishedAt: { $exists: true },
        });
        if (completed) {
          return next(new ErrorResponse("You have already completed this contest", 400));
        }

        submission = await ContestSubmission.create({
          student: studentId,
          contest: contestId,
          answers: [],
          startedAt: new Date(),
        });
      }

      res.status(200).json(
        new ApiResponse(200, { submissionId: submission._id, startedAt: submission.startedAt }, "Contest started successfully")
      );
    }
  );

  // ================= SUBMIT CONTEST =================
  static submitContest = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id: contestId } = req.params;
      const studentId = req.user!._id;
      const { answers } = req.body;

      if (!answers || !Array.isArray(answers)) {
        return next(new ErrorResponse("Answers array is required", 400));
      }

      const contest = await Contest.findById(contestId).populate("questions");
      if (!contest) return next(new ErrorResponse("Contest not found", 404));

      const questionsMap = new Map<string, any>();
      for (const q of contest.questions) {
        const question = await Question.findById(q).select("+correctAnswer");
        if (question) questionsMap.set((question._id as Types.ObjectId).toString(), question);
      }

      let totalScore = 0;
      let solvedCount = 0;
      const gradedAnswers = [];

      for (const ans of answers) {
        const question = questionsMap.get(ans.question);
        if (!question) continue;

        let score = 0;
        const maxScore = question.points || 0;
        let passed = false;
        let passedTestCases = 0;
        let totalTestCases = 0;

        if (question.type === "SINGLE_CHOICE") {
          totalTestCases = 1;
          if (String(ans.answer) === String(question.correctAnswer)) {
            score = maxScore;
            passed = true;
            passedTestCases = 1;
          }
        } else if (question.type === "MULTIPLE_CHOICE") {
          const correct = Array.isArray(question.correctAnswer) ? question.correctAnswer.map(String) : [];
          const studentAns = Array.isArray(ans.answer) ? ans.answer.map(String) : [];
          const correctSet = new Set(correct);
          const studentSet = new Set(studentAns);
          totalTestCases = correct.length;

          if (correctSet.size === studentSet.size && [...correctSet].every((a) => studentSet.has(a))) {
            score = maxScore;
            passed = true;
            passedTestCases = correct.length;
          } else if (question.allowPartial) {
            const correctCount = studentAns.filter((a: string) => correctSet.has(a)).length;
            const wrongCount = studentAns.filter((a: string) => !correctSet.has(a)).length;
            score = Math.max(0, Math.round(((correctCount - wrongCount) / correct.length) * maxScore));
            passedTestCases = Math.max(0, correctCount - wrongCount);
          }
        } else if (question.type === "CODING") {
          const testCases = question.testCases || [];
          totalTestCases = testCases.length;
          const totalWeight = testCases.reduce((sum: number, tc: any) => sum + (tc.weight || 1), 0);

          for (const tc of testCases) {
            try {
              const result = await executeCode(ans.language || "javascript", ans.code || "", tc.input);
              if (result.stdout.trim() === tc.output.trim()) {
                passedTestCases++;
                score += Math.round(((tc.weight || 1) / totalWeight) * maxScore);
              }
            } catch {
              // Test case execution failed
            }
          }
          if (passedTestCases === totalTestCases && totalTestCases > 0) {
            passed = true;
          }
        }

        totalScore += score;
        if (passed) solvedCount++;

        gradedAnswers.push({
          question: ans.question,
          answer: ans.answer ?? null,
          code: ans.code || "",
          language: ans.language || "javascript",
          passed,
          passedTestCases,
          totalTestCases,
          score,
        });
      }

      // Calculate time taken
      const existingSubmission = await ContestSubmission.findOne({ student: studentId, contest: contestId, finishedAt: { $exists: false } });
      const timeTaken = existingSubmission ? Math.floor((new Date().getTime() - existingSubmission.startedAt.getTime()) / 1000) : 0;

      // Save submission
      const submission = await ContestSubmission.findOneAndUpdate(
        { student: studentId, contest: contestId, finishedAt: { $exists: false } },
        {
          answers: gradedAnswers,
          score: totalScore,
          solvedCount,
          totalQuestions: contest.questions.length,
          finishedAt: new Date(),
          timeTaken,
        },
        { new: true, upsert: true }
      );

      // 1. Calculate XP increment (only reward for score improvement)
      const previousBest = await ContestSubmission.findOne({
        student: studentId,
        contest: contestId,
        finishedAt: { $exists: true, $ne: submission.finishedAt },
      }).sort({ score: -1 });

      const prevScore = previousBest?.score || 0;
      const xpToAdd = Math.max(0, totalScore - prevScore);

      // 2. Update User Points and Unified Streak Logic
      const user = await User.findById(studentId);
      if (user) {
        user.points = (user.points || 0) + xpToAdd;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayEntry = user.activityLog.find(
          (entry) => new Date(entry.date).toDateString() === today.toDateString()
        );

        if (!todayEntry) {
          // First action of the day
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const hadActivityYesterday = user.activityLog.some(
            (entry) =>
              new Date(entry.date).toDateString() === yesterday.toDateString() && entry.count > 0
          );

          if (hadActivityYesterday) {
            user.streak += 1;
          } else {
            user.streak = 1;
          }

          if (user.streak > user.maxStreak) {
            user.maxStreak = user.streak;
          }

          user.activityLog.push({ date: today, count: 1 });
        } else {
          // Subsequent action today - just increment activity count
          todayEntry.count += 1;
        }

        await user.save();
      }

      res.status(200).json(
        new ApiResponse(
          200,
          {
            totalScore,
            maxScore: contest.questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0),
            solvedCount,
          },
          "Contest submitted successfully"
        )
      );
    }
  );

  // ================= CREATE CONTEST (Admin) =================
  static createContest = asyncHandler(async (req: Request, res: Response) => {
    const {
      title,
      description,
      startTime,
      endTime,
      duration,
      sponsor,
      difficulty,
      questions,
      maxParticipants,
      rewards,
    } = req.body;

    const contest = await Contest.create({
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      sponsor,
      difficulty,
      questions: questions || [],
      maxParticipants,
      rewards: rewards || [],
    });

    res.status(201).json(
      new ApiResponse(201, contest, "Contest created successfully")
    );
  });

  // ================= UPDATE CONTEST (Admin) =================
  static updateContest = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const contest = await Contest.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        req.body,
        { new: true, runValidators: true }
      );
      if (!contest) return next(new ErrorResponse("Contest not found", 404));

      res.status(200).json(
        new ApiResponse(200, contest, "Contest updated successfully")
      );
    }
  );

  // ================= DELETE CONTEST (Admin) =================
  static deleteContest = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const contest = await Contest.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { isDeleted: true, isActive: false },
        { new: true }
      );
      if (!contest) return next(new ErrorResponse("Contest not found", 404));

      res.status(200).json(
        new ApiResponse(200, null, "Contest deleted successfully")
      );
    }
  );

  // ================= ADD QUESTIONS TO CONTEST (Admin) =================
  static addQuestions = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { questionIds } = req.body;
      if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
        return next(new ErrorResponse("questionIds array is required", 400));
      }

      const contest = await Contest.findOne({
        _id: req.params.id,
        isDeleted: false,
      });
      if (!contest) return next(new ErrorResponse("Contest not found", 404));

      // Add only new questions (avoid duplicates)
      const existingIds = new Set(contest.questions.map((id) => id.toString()));
      const newIds = questionIds.filter((id: string) => !existingIds.has(id));

      if (newIds.length > 0) {
        contest.questions.push(...newIds.map((id: string) => new Types.ObjectId(id) as any));
        await contest.save();
      }

      // Return populated contest
      const updated = await Contest.findById(contest._id)
        .populate("questions", "title difficulty points type tags")
        .lean();

      res.status(200).json(
        new ApiResponse(200, updated, `${newIds.length} question(s) added successfully`)
      );
    }
  );

  // ================= REMOVE QUESTION FROM CONTEST (Admin) =================
  static removeQuestion = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id: contestId, questionId } = req.params;

      const contest = await Contest.findOne({
        _id: contestId,
        isDeleted: false,
      });
      if (!contest) return next(new ErrorResponse("Contest not found", 404));

      const initialLength = contest.questions.length;
      contest.questions = contest.questions.filter(
        (qId) => qId.toString() !== questionId
      ) as any;

      if (contest.questions.length === initialLength) {
        return next(new ErrorResponse("Question not found in this contest", 404));
      }

      await contest.save();

      const updated = await Contest.findById(contest._id)
        .populate("questions", "title difficulty points type tags")
        .lean();

      res.status(200).json(
        new ApiResponse(200, updated, "Question removed successfully")
      );
    }
  );
}

export default ContestController;

