import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import ErrorResponse from "../utils/errorResponse";
import ApiResponse from "../utils/ApiResponse";
import Test from "../models/test.model";
import Question from "../models/question.model";
import Course from "../models/course.model";
import Batch from "../models/batch.model";
import Enrollment from "../models/enrollment.model";
import StudentTestSubmission from "../models/studentTestSubmission.model";
import StudentSubmission from "../models/studentSubmission.model";
import User from "../models/user.model";
import Module from "../models/module.model";
import Submodule from "../models/submodule.model";
import { executeCode, PISTON_LANGUAGES } from "../utils/piston";
import { Types } from "mongoose";

class StudentController {
  // ==================== START TEST ====================
  static startTest = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id: testId } = req.params;
      const studentId = req.user!._id;

      const test = await Test.findById(testId);
      if (!test) return next(new ErrorResponse("Test not found", 404));
      if (!test.isActive) return next(new ErrorResponse("Test is not active", 400));

      // Check enrollment
      const enrollment = await Enrollment.findOne({
        student: studentId,
        course: test.course,
        status: "ACTIVE",
      });
      if (!enrollment) return next(new ErrorResponse("You are not enrolled in this course", 403));

      // Check for existing incomplete submission
      let submission = await StudentTestSubmission.findOne({
        student: studentId,
        test: testId,
        completedAt: { $exists: false },
      });

      if (!submission) {
        // Check if already completed
        const completed = await StudentTestSubmission.findOne({
          student: studentId,
          test: testId,
          completedAt: { $exists: true },
        });
        if (completed) {
          return next(new ErrorResponse("You have already completed this test", 400));
        }

        submission = await StudentTestSubmission.create({
          student: studentId,
          test: testId,
          answers: [],
          totalScore: 0,
          attemptedAt: new Date(),
        });
      }

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          submissionId: submission._id,
          startedAt: submission.attemptedAt,
        },
        message: "Test started successfully",
      });
    }
  );

  // ==================== SUBMIT TEST ====================
  static submitTest = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id: testId } = req.params;
      const studentId = req.user!._id;
      const { answers } = req.body;

      if (!answers || !Array.isArray(answers)) {
        return next(new ErrorResponse("Answers array is required", 400));
      }

      const test = await Test.findById(testId).populate("questions");
      if (!test) return next(new ErrorResponse("Test not found", 404));

      const questionsMap = new Map<string, any>();
      for (const q of test.questions) {
        const question = await Question.findById(q).select("+correctAnswer");
        if (question) questionsMap.set((question._id as Types.ObjectId).toString(), question);
      }

      let totalScore = 0;
      let totalMaxScore = 0;
      const gradedAnswers = [];

      for (const ans of answers) {
        const question = questionsMap.get(ans.question);
        if (!question) continue;

        let score = 0;
        const maxScore = question.points || 0;

        if (question.type === "SINGLE_CHOICE") {
          if (ans.answer === question.correctAnswer) {
            score = maxScore;
          }
        } else if (question.type === "MULTIPLE_CHOICE") {
          const correct = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
          const studentAns = Array.isArray(ans.answer) ? ans.answer : [];
          const correctSet = new Set(correct);
          const studentSet = new Set(studentAns);

          if (correctSet.size === studentSet.size && [...correctSet].every((a) => studentSet.has(a))) {
            score = maxScore;
          } else if (question.allowPartial) {
            const correctCount = studentAns.filter((a: string) => correctSet.has(a)).length;
            const wrongCount = studentAns.filter((a: string) => !correctSet.has(a)).length;
            score = Math.max(0, Math.round(((correctCount - wrongCount) / correct.length) * maxScore));
          }
        } else if (question.type === "CODING") {
          // Run code against all test cases
          const testCases = question.testCases || [];
          let passed = 0;
          const totalWeight = testCases.reduce((sum: number, tc: any) => sum + (tc.weight || 1), 0);

          for (const tc of testCases) {
            try {
              const result = await executeCode(ans.language || "javascript", ans.code || "", tc.input);
              if (result.stdout.trim() === tc.output.trim()) {
                passed++;
                score += Math.round(((tc.weight || 1) / totalWeight) * maxScore);
              }
            } catch {
              // Test case execution failed
            }
          }
        } else if (question.type === "BEHAVIORAL") {
          // Behavioral questions are manually graded - give 0 for now
          score = 0;
        }

        totalScore += score;
        totalMaxScore += maxScore;

        gradedAnswers.push({
          question: ans.question,
          answer: ans.answer,
          code: ans.code,
          language: ans.language,
          score,
          maxScore,
        });
      }

      // Save submission
      const submission = await StudentTestSubmission.findOneAndUpdate(
        { student: studentId, test: testId, completedAt: { $exists: false } },
        {
          answers: gradedAnswers,
          totalScore,
          maxScore: totalMaxScore,
          completedAt: new Date(),
        },
        { new: true, upsert: true }
      );

      // Update user points and activity
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await User.findByIdAndUpdate(studentId, {
        $inc: { points: totalScore },
        $push: {
          activityLog: {
            $each: [],
          },
        },
      });

      // Update activity log
      const user = await User.findById(studentId);
      if (user) {
        const todayEntry = user.activityLog.find(
          (entry) => new Date(entry.date).toDateString() === today.toDateString()
        );
        if (todayEntry) {
          todayEntry.count += 1;
        } else {
          user.activityLog.push({ date: today, count: 1 });
        }
        // Update streak
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const hadActivityYesterday = user.activityLog.some(
          (entry) => new Date(entry.date).toDateString() === yesterday.toDateString() && entry.count > 0
        );
        if (hadActivityYesterday || user.streak === 0) {
          user.streak += 1;
          if (user.streak > user.maxStreak) {
            user.maxStreak = user.streak;
          }
        } else {
          user.streak = 1;
        }
        await user.save();
      }

      // Update enrollment module progress and recalculate overallProgress
      if (test.module) {
        const enrollment = await Enrollment.findOneAndUpdate(
          {
            student: studentId,
            course: test.course,
            "moduleProgress.module": test.module,
          },
          {
            $set: {
              "moduleProgress.$.testSubmission": submission!._id,
              "moduleProgress.$.status": "COMPLETED",
              "moduleProgress.$.completedAt": new Date(),
            },
            lastAccessedAt: new Date(),
          },
          { new: true }
        );

        // Recalculate overall progress
        if (enrollment && enrollment.moduleProgress.length > 0) {
          const completedModules = enrollment.moduleProgress.filter(
            (mp) => mp.status === "COMPLETED"
          ).length;
          const totalModules = enrollment.moduleProgress.length;
          enrollment.overallProgress = Math.round(
            (completedModules / totalModules) * 100
          );

          // Mark enrollment as COMPLETED if all modules done
          if (enrollment.overallProgress >= 100) {
            enrollment.status = "COMPLETED";
            enrollment.completedAt = new Date();
          }

          await enrollment.save();
        }
      }

      const maxPossible = gradedAnswers.reduce((sum, a) => sum + a.maxScore, 0);

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          _id: submission!._id,
          totalScore,
          maxScore: maxPossible,
          answers: gradedAnswers.map((a) => ({
            question: a.question,
            score: a.score,
            maxScore: a.maxScore,
            isCorrect: a.score === a.maxScore,
          })),
        },
        message: "Test submitted successfully",
      });
    }
  );

  // ==================== EXECUTE CODE ====================
  static executeCode = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { language, code, stdin } = req.body;

      if (!language || !code) {
        return next(new ErrorResponse("Language and code are required", 400));
      }

      if (typeof code !== "string" || code.length > 65_536) {
        return next(new ErrorResponse("Code exceeds maximum allowed size", 400));
      }

      if (stdin && (typeof stdin !== "string" || stdin.length > 1_048_576)) {
        return next(new ErrorResponse("Input exceeds maximum allowed size", 400));
      }

      if (!PISTON_LANGUAGES[language]) {
        return next(new ErrorResponse(`Unsupported language: ${language}`, 400));
      }

      try {
        const result = await executeCode(language, code, stdin);
        res.status(200).json({
          statusCode: 200,
          success: true,
          data: result,
          message: "Code executed successfully",
        });
      } catch (error: any) {
        return next(new ErrorResponse(error.message || "Code execution failed", 500));
      }
    }
  );

  // ==================== RUN TEST CASES ====================
  static runTestCases = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id: questionId } = req.params;
      const { language, code } = req.body;

      if (!language || !code) {
        return next(new ErrorResponse("Language and code are required", 400));
      }

      if (typeof code !== "string" || code.length > 65_536) {
        return next(new ErrorResponse("Code exceeds maximum allowed size", 400));
      }

      const question = await Question.findById(questionId);
      if (!question) return next(new ErrorResponse("Question not found", 404));
      if (question.type !== "CODING") return next(new ErrorResponse("Not a coding question", 400));

      const testCases = question.testCases || [];
      const results = [];

      for (const tc of testCases) {
        try {
          const result = await executeCode(language, code, tc.input);
          const actual = result.stdout?.trim() || "";
          const passed = actual === tc.output.trim();
          results.push({
            passed,
            input: tc.input,
            expected: tc.output.trim(),
            actual,
            hidden: tc.hidden || false,
          });
        } catch {
          results.push({
            passed: false,
            input: tc.input,
            expected: tc.output.trim(),
            actual: "Execution error",
            hidden: tc.hidden || false,
          });
        }
      }

      const passedCount = results.filter((r) => r.passed).length;

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: {
          results: results.map((r) =>
            r.hidden
              ? { passed: r.passed, input: "Hidden", expected: "Hidden", actual: r.passed ? "Correct" : "Wrong answer", hidden: true }
              : r
          ),
          passed: passedCount,
          total: results.length,
        },
        message: "Test cases executed successfully",
      });
    }
  );

  // ==================== GET MY ACTIVITY ====================
  static getMyActivity = asyncHandler(
    async (req: Request, res: Response) => {
      const user = await User.findById(req.user!._id).select("activityLog");

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: user?.activityLog || [],
        message: "Activity retrieved successfully",
      });
    }
  );

  // ==================== UPDATE PROGRESS ====================
  static updateProgress = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id: enrollmentId } = req.params;
      const { moduleId, submoduleId, action } = req.body;
      const studentId = req.user!._id;

      if (!moduleId || !submoduleId || !action) {
        return next(new ErrorResponse("moduleId, submoduleId, and action are required", 400));
      }

      // Verify enrollment belongs to this student
      const enrollment = await Enrollment.findOne({
        _id: enrollmentId,
        student: studentId,
      });
      if (!enrollment) return next(new ErrorResponse("Enrollment not found", 404));

      // Verify module and submodule exist
      const module = await Module.findById(moduleId);
      if (!module) return next(new ErrorResponse("Module not found", 404));

      const submodule = await Submodule.findById(submoduleId);
      if (!submodule) return next(new ErrorResponse("Submodule not found", 404));

      // Find or create module progress entry
      let moduleProgress = enrollment.moduleProgress.find(
        (mp) => mp.module.toString() === moduleId
      );

      if (!moduleProgress) {
        enrollment.moduleProgress.push({
          module: moduleId,
          status: "NOT_STARTED",
          completedSubmodules: [],
          startedAt: new Date(),
        });
        moduleProgress = enrollment.moduleProgress[enrollment.moduleProgress.length - 1];
      }

      if (action === "complete") {
        if (!moduleProgress.completedSubmodules.includes(submoduleId)) {
          moduleProgress.completedSubmodules.push(submoduleId);
        }
        if (!moduleProgress.startedAt) {
          moduleProgress.startedAt = new Date();
        }
      } else if (action === "uncomplete") {
        moduleProgress.completedSubmodules = moduleProgress.completedSubmodules.filter(
          (id) => id.toString() !== submoduleId
        );
      }

      // Update module status
      const totalSubmodules = await Submodule.countDocuments({ module: moduleId });
      const completedCount = moduleProgress.completedSubmodules.length;

      if (completedCount === 0) {
        moduleProgress.status = "NOT_STARTED";
      } else if (completedCount >= totalSubmodules) {
        moduleProgress.status = "COMPLETED";
        moduleProgress.completedAt = new Date();
      } else {
        moduleProgress.status = "IN_PROGRESS";
      }

      // Recalculate overall progress
      const totalModules = await Module.countDocuments({ course: enrollment.course });
      const completedModules = enrollment.moduleProgress.filter(
        (mp) => mp.status === "COMPLETED"
      ).length;
      enrollment.overallProgress = totalModules > 0
        ? Math.round((completedModules / totalModules) * 100)
        : 0;

      enrollment.lastAccessedAt = new Date();
      await enrollment.save();

      // Update activity log
      const user = await User.findById(studentId);
      if (user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEntry = user.activityLog.find(
          (entry) => new Date(entry.date).toDateString() === today.toDateString()
        );
        if (todayEntry) {
          todayEntry.count += 1;
        } else {
          user.activityLog.push({ date: today, count: 1 });
        }
        await user.save();
      }

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: enrollment,
        message: "Progress updated successfully",
      });
    }
  );

  // ==================== GENERATE / GET MY CERTIFICATE ====================
  static getMyCertificate = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { courseId } = req.params;
      const studentId = req.user!._id;

      // Verify enrollment is completed
      const enrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId,
      });
      if (!enrollment) return next(new ErrorResponse("You are not enrolled in this course", 404));
      if (enrollment.overallProgress < 100) {
        return next(new ErrorResponse("Course not yet completed", 400));
      }

      const Certificate = require("../models/certificate.mode").default;

      // Check if certificate already exists
      let certificate = await Certificate.findOne({ student: studentId, course: courseId })
        .populate("student", "name email")
        .populate("course", "title description");

      if (!certificate) {
        // Auto-generate certificate
        const course = await Course.findById(courseId);

        certificate = await Certificate.create({
          student: studentId,
          course: courseId,
          title: `${course?.title || "Course"} Completion Certificate`,
          issuedAt: new Date(),
          grade: "Completed",
          verificationLink: `${req.protocol}://${req.get("host")}/api/v1/certificates/verify/${Date.now().toString(36)}${(studentId as Types.ObjectId).toString().slice(-4)}`,
        });

        // Populate for response
        certificate = await Certificate.findById(certificate._id)
          .populate("student", "name email")
          .populate("course", "title description");
      }

      res.status(200).json(new ApiResponse(200, certificate, "Certificate retrieved successfully"));
    }
  );

  // ==================== GET MY CERTIFICATES ====================
  static getMyCertificates = asyncHandler(
    async (req: Request, res: Response) => {
      const studentId = req.user!._id;
      const Certificate = require("../models/certificate.mode").default;

      const certificates = await Certificate.find({ student: studentId })
        .populate("course", "title description")
        .sort({ issuedAt: -1 });

      res.status(200).json(new ApiResponse(200, certificates, "Certificates retrieved successfully"));
    }
  );

  // ==================== GET BATCHES FOR A COURSE ====================
  static getCourseBatches = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { courseId } = req.params;

      const course = await Course.findById(courseId);
      if (!course) return next(new ErrorResponse("Course not found", 404));

      // Get upcoming/active batches for this course's organisation
      const filter: any = {};
      if (course.organisation) {
        filter.organisation = course.organisation;
      }
      // Only show batches that haven't ended yet
      filter.endDate = { $gte: new Date() };

      const batches = await Batch.find(filter)
        .populate("organisation", "name")
        .sort({ startDate: 1 });

      res.status(200).json(new ApiResponse(200, batches, "Batches retrieved successfully"));
    }
  );

  // ==================== SELF ENROLL (BATCH-BASED) ====================
  static selfEnroll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { courseId } = req.params;
      const studentId = req.user!._id;
      const { batchId } = req.body;

      if (!batchId) return next(new ErrorResponse("Batch ID is required", 400));

      const course = await Course.findById(courseId);
      if (!course) return next(new ErrorResponse("Course not found", 404));

      // Check if already enrolled
      const existing = await Enrollment.findOne({ student: studentId, course: courseId });
      if (existing) return next(new ErrorResponse("You are already enrolled in this course", 400));

      // Initialize module progress
      const modules = await Module.find({ course: courseId }).sort({ order: 1 });

      const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        batch: batchId,
        moduleProgress: modules.map((m) => ({
          module: m._id,
          status: "NOT_STARTED",
          completedSubmodules: [],
        })),
      });

      res.status(201).json(new ApiResponse(201, enrollment, "Enrolled successfully"));
    }
  );

  // ==================== GET PLAYGROUND QUESTIONS ====================
  static getPlaygroundQuestions = asyncHandler(
    async (req: Request, res: Response) => {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const search = req.query.search as string;
      const difficulty = req.query.difficulty as string;
      const language = req.query.language as string;
      const tag = req.query.tag as string;

      const filter: any = {
        type: "CODING",
        status: "PUBLISHED",
        isDeleted: false,
      };

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $regex: search, $options: "i" } },
        ];
      }

      if (difficulty) filter.difficulty = difficulty;
      if (language) filter.languages = language;
      if (tag) filter.tags = tag;

      const studentId = req.user!._id;
      const skip = (page - 1) * limit;
      const [questions, total, allTags] = await Promise.all([
        Question.find(filter)
          .select("title slug description difficulty points languages tags createdAt")
          .sort({ difficulty: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Question.countDocuments(filter),
        Question.distinct("tags", {
          type: "CODING",
          status: "PUBLISHED",
          isDeleted: false,
        }),
      ]);

      // Get submission counts for the current student for these questions
      const questionIds = questions.map((q) => q._id);
      const submissions = await StudentSubmission.aggregate([
        { $match: { student: studentId, question: { $in: questionIds } } },
        { $group: { _id: "$question", count: { $sum: 1 } } },
      ]);
      const submissionMap = new Map(submissions.map((s) => [s._id.toString(), s.count]));

      const questionsWithSubmissions = questions.map((q) => ({
        ...q,
        submissionCount: submissionMap.get(q._id.toString()) || 0,
      }));

      res.status(200).json(
        new ApiResponse(200, {
          questions: questionsWithSubmissions,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalQuestions: total,
          availableTags: allTags.filter(Boolean),
        }, "Playground questions retrieved successfully")
      );
    }
  );

  // ==================== GET PLAYGROUND QUESTION BY ID ====================
  static getPlaygroundQuestionById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const question = await Question.findOne({
        _id: id,
        type: "CODING",
        status: "PUBLISHED",
        isDeleted: false,
      });

      if (!question) return next(new ErrorResponse("Question not found", 404));

      res.status(200).json(new ApiResponse(200, question, "Question fetched successfully"));
    }
  );

  // ==================== SUBMIT PLAYGROUND SOLUTION ====================
  static submitPlaygroundSolution = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id: questionId } = req.params;
      const { language, code } = req.body;
      const studentId = req.user!._id;

      if (!language || !code) {
        return next(new ErrorResponse("Language and code are required", 400));
      }

      if (typeof code !== "string" || code.length > 65_536) {
        return next(new ErrorResponse("Code exceeds maximum allowed size", 400));
      }

      const question = await Question.findOne({
        _id: questionId,
        type: "CODING",
        status: "PUBLISHED",
        isDeleted: false,
      });
      if (!question) return next(new ErrorResponse("Question not found", 404));

      const testCases = question.testCases || [];
      const results = [];
      let totalWeight = 0;
      let earnedWeight = 0;

      for (const tc of testCases) {
        const weight = tc.weight || 1;
        totalWeight += weight;
        try {
          const result = await executeCode(language, code, tc.input);
          const actual = result.stdout?.trim() || "";
          const passed = actual === tc.output.trim();
          if (passed) earnedWeight += weight;
          results.push({
            passed,
            input: tc.input,
            expected: tc.output.trim(),
            actual,
            hidden: tc.hidden || false,
          });
        } catch {
          results.push({
            passed: false,
            input: tc.input,
            expected: tc.output.trim(),
            actual: "Execution error",
            hidden: tc.hidden || false,
          });
        }
      }

      const passedCount = results.filter((r) => r.passed).length;
      const allPassed = passedCount === results.length && results.length > 0;
      const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * (question.points || 0)) : 0;

      // Update activity log and streak if all test cases passed
      if (allPassed) {
        const user = await User.findById(studentId);
        if (user) {
          user.points += score;

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayEntry = user.activityLog.find(
            (entry) => new Date(entry.date).toDateString() === today.toDateString()
          );
          if (todayEntry) {
            todayEntry.count += 1;
          } else {
            user.activityLog.push({ date: today, count: 1 });
          }

          // Update streak
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const hadActivityYesterday = user.activityLog.some(
            (entry) => new Date(entry.date).toDateString() === yesterday.toDateString() && entry.count > 0
          );
          if (hadActivityYesterday || user.streak === 0) {
            user.streak += 1;
            if (user.streak > user.maxStreak) {
              user.maxStreak = user.streak;
            }
          } else if (!todayEntry) {
            user.streak = 1;
          }

          await user.save();
        }
      }

      await StudentSubmission.create({
        student: studentId,
        question: questionId,
        type: "CODING",
        code,
        language,
        score,
        maxScore: question.points || 0,
        passedTestCases: passedCount,
        totalTestCases: results.length,
        attemptedAt: new Date(),
      });

      res.status(200).json(
        new ApiResponse(200, {
          results: results.map((r) =>
            r.hidden
              ? { passed: r.passed, input: "Hidden", expected: "Hidden", actual: r.passed ? "Correct" : "Wrong answer", hidden: true }
              : r
          ),
          passed: passedCount,
          total: results.length,
          allPassed,
          score,
        }, allPassed ? "All test cases passed!" : "Some test cases failed")
      );
    }
  );

  // ==================== GET PLAYGROUND SUBMISSIONS ====================
  static getPlaygroundSubmissions = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id: questionId } = req.params;
      const studentId = req.user!._id;

      const submissions = await StudentSubmission.find({
        student: studentId,
        question: questionId,
        type: "CODING"
      })
      .select("code language score maxScore passedTestCases totalTestCases attemptedAt")
      .sort({ attemptedAt: -1 });

      res.status(200).json(
        new ApiResponse(200, submissions, "Submissions history retrieved successfully")
      );
    }
  );

  // ==================== GET SUBMODULES BY MODULE ====================
  static getSubmodulesByModule = asyncHandler(
    async (req: Request, res: Response) => {
      const { moduleId } = req.params;

      const submodules = await Submodule.find({ module: moduleId })
        .sort({ order: 1 });

      res.status(200).json({
        statusCode: 200,
        success: true,
        data: submodules,
        message: "Submodules retrieved successfully",
      });
    }
  );

  // ==================== GET TEST SUBMISSION ====================
  static getTestSubmission = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id: submissionId } = req.params;
      const studentId = req.user!._id;

      const submission = await StudentTestSubmission.findOne({
        _id: submissionId,
        student: studentId,
      })
        .populate({
          path: "test",
          select: "title description duration totalPoints",
        })
        .populate({
          path: "answers.question",
          select: "title type difficulty points options description",
        });

      if (!submission) {
        return next(new ErrorResponse("Submission not found", 404));
      }

      res
        .status(200)
        .json(new ApiResponse(200, submission, "Submission retrieved"));
    }
  );

  // ================= GET GAMIFIED PROFILE STATS =================
  static getProfileStats = asyncHandler(
    async (req: Request, res: Response) => {
      const studentId = req.user!._id;
      const user = await User.findById(studentId).lean();
      if (!user) {
        return res.status(404).json(new ApiResponse(404, null, "User not found"));
      }

      const points = user.points || 0;
      const streak = user.streak || 0;
      const maxStreak = user.maxStreak || 0;

      // Level system
      const levelThresholds = [
        { min: 10000, level: 50, title: "Legendary Coder" },
        { min: 5000, level: 40, title: "Grand Master" },
        { min: 2000, level: 30, title: "Champion" },
        { min: 1000, level: 20, title: "Warrior" },
        { min: 500, level: 15, title: "Fighter" },
        { min: 200, level: 10, title: "Apprentice" },
        { min: 0, level: 1, title: "Novice" },
      ];
      const levelInfo = levelThresholds.find((t) => points >= t.min) || levelThresholds[levelThresholds.length - 1];
      const nextThreshold = levelThresholds
        .slice()
        .reverse()
        .find((t) => t.min > points);
      const nextLevelXP = nextThreshold ? nextThreshold.min : points + 1000;

      // Count completed courses from enrollments
      const completedCourses = await Enrollment.countDocuments({
        student: studentId,
        status: "COMPLETED",
      });

      // Badges
      const badges = [
        { id: "first-blood", name: "First Blood", description: "Complete your first quest", icon: "⚔️", earned: points > 0, rarity: "common" },
        { id: "streak-3", name: "On Fire", description: "Achieve a 3-day streak", icon: "🔥", earned: maxStreak >= 3, rarity: "common" },
        { id: "streak-7", name: "Unstoppable", description: "Achieve a 7-day streak", icon: "💪", earned: maxStreak >= 7, rarity: "rare" },
        { id: "streak-30", name: "Iron Will", description: "Achieve a 30-day streak", icon: "🏆", earned: maxStreak >= 30, rarity: "epic" },
        { id: "xp-500", name: "Rising Star", description: "Earn 500 XP", icon: "⭐", earned: points >= 500, rarity: "common" },
        { id: "xp-2000", name: "Code Warrior", description: "Earn 2000 XP", icon: "🗡️", earned: points >= 2000, rarity: "rare" },
        { id: "xp-5000", name: "Grand Master", description: "Earn 5000 XP", icon: "👑", earned: points >= 5000, rarity: "epic" },
        { id: "xp-10000", name: "Legend", description: "Earn 10000 XP", icon: "🐉", earned: points >= 10000, rarity: "legendary" },
        { id: "course-1", name: "Scholar", description: "Complete a course", icon: "📚", earned: completedCourses >= 1, rarity: "common" },
        { id: "course-3", name: "Knowledge Seeker", description: "Complete 3 courses", icon: "🎓", earned: completedCourses >= 3, rarity: "rare" },
        { id: "hot-streak", name: "Hot Streak", description: "Current streak of 5+", icon: "🌟", earned: streak >= 5, rarity: "rare" },
      ];

      // Skill radar from submissions by tags
      const submissions = await StudentSubmission.find({
        student: studentId,
        isDeleted: false,
        type: "CODING",
      })
        .populate("question", "tags")
        .lean();

      const tagScores = new Map<string, { total: number; count: number }>();
      for (const sub of submissions) {
        const question = sub.question as any;
        if (question?.tags) {
          for (const tag of question.tags) {
            const existing = tagScores.get(tag) || { total: 0, count: 0 };
            existing.total += (sub.score / sub.maxScore) * 100;
            existing.count++;
            tagScores.set(tag, existing);
          }
        }
      }

      const skillRadar = Array.from(tagScores.entries())
        .map(([name, { total, count }]) => ({
          name,
          value: Math.round(total / count),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      res.status(200).json(
        new ApiResponse(200, {
          level: levelInfo.level,
          title: levelInfo.title,
          xp: points,
          nextLevelXP,
          streak,
          maxStreak,
          badges,
          skillRadar,
          completedCourses,
        }, "Profile stats fetched successfully")
      );
    }
  );
}

export default StudentController;

