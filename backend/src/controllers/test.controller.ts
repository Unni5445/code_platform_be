import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import Test from "../models/test.model";
import Module from "../models/module.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";
import Question from "../models/question.model";
import StudentTestSubmission from "../models/studentTestSubmission.model";

class TestController {
  // ================= CREATE TEST =================
  static createTest = asyncHandler(async (req: Request, res: Response) => {
    const test = await Test.create(req.body);

    // If module is provided, link the test to the module
    if (req.body.module) {
      await Module.findByIdAndUpdate(req.body.module, { test: test._id });
    }

    res.status(201).json(new ApiResponse(201, test, "Test created successfully"));
  });

  // ================= GET ALL TESTS =================
  static getTests = asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const search = req.query.search as string;
    const courseFilter = req.query.course as string;
    const moduleFilter = req.query.module as string;
    const activeFilter = req.query.isActive as string;

    const filter: any = { isDeleted: false }; // Filter out deleted tests
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (courseFilter === "none") {
      if (!filter.$and) filter.$and = [];
      filter.$and.push({ $or: [{ course: { $exists: false } }, { course: null }] });
    } else if (courseFilter) {
      filter.course = courseFilter;
    }
    if (moduleFilter === "none") {
      if (!filter.$and) filter.$and = [];
      filter.$and.push({ $or: [{ module: { $exists: false } }, { module: null }] });
    } else if (moduleFilter) {
      filter.module = moduleFilter;
    }
    if (activeFilter !== undefined) filter.isActive = activeFilter === "true";

    const skip = (page - 1) * limit;
    const tests = await Test.find(filter)
      .populate("course", "title")
      .populate("questions")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTests = await Test.countDocuments(filter);

    res.status(200).json(
      new ApiResponse(200, {
        tests,
        currentPage: page,
        totalPages: Math.ceil(totalTests / limit),
        totalTests,
      }, "Tests retrieved successfully")
    );
  });

  // ================= GET TEST BY ID =================
  static getTestById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const test = await Test.findById(id)
      .populate("course", "title")
      .populate("questions");

    if (!test) return next(new ErrorResponse("Test not found", 404));

    res.status(200).json(new ApiResponse(200, test, "Test fetched successfully"));
  });

  // ================= UPDATE TEST =================
  static updateTest = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const test = await Test.findById(id);
    if (!test) return next(new ErrorResponse("Test not found", 404));

    Object.assign(test, req.body);
    await test.save();

    res.status(200).json(new ApiResponse(200, test, "Test updated successfully"));
  });

 // ================= ADD EXISTING QUESTIONS TO TEST =================
  static addQuestions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return next(new ErrorResponse("Please provide an array of questionIds", 400));
    }

    const test = await Test.findById(id);
    if (!test) return next(new ErrorResponse("Test not found", 404));

    // Only process IDs not already in the test (avoid double-counting points)
    const existingIds = new Set(test.questions.map((q: any) => q.toString()));
    const newQuestionIds = questionIds.filter((qId: string) => !existingIds.has(qId));

    if (newQuestionIds.length === 0) {
      return res.status(200).json(new ApiResponse(200, test, "Questions already in test"));
    }

    // Sum points of the new questions being added
    const newQuestions = await Question.find({ _id: { $in: newQuestionIds } }).select("points");
    const pointsToAdd = newQuestions.reduce((sum: number, q: any) => sum + (q.points ?? 0), 0);

    // Add questions + increment totalPoints atomically
    await Test.findByIdAndUpdate(id, {
      $addToSet: { questions: { $each: newQuestionIds } },
      $inc: { totalPoints: pointsToAdd },
    });

    // Update each question's test/module/course reference
    await Question.updateMany(
      { _id: { $in: newQuestionIds } },
      { $set: { test: id, module: test.module, course: test.course } }
    );

    const updated = await Test.findById(id).populate("questions");
    res.status(200).json(new ApiResponse(200, updated, "Questions added to test successfully"));
  });

  // ================= REMOVE QUESTION FROM TEST =================
  static removeQuestion = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id, questionId } = req.params;

    const test = await Test.findById(id);
    if (!test) return next(new ErrorResponse("Test not found", 404));

    const Question = require("../models/question.model").default;

    // Fetch the question's points before removing
    const question = await Question.findById(questionId).select("points");
    const pointsToRemove = question?.points ?? 0;

    // Remove question + decrement totalPoints atomically
    await Test.findByIdAndUpdate(id, {
      $pull: { questions: questionId },
      $inc: { totalPoints: -pointsToRemove },
    });

    // Unset the question's test reference
    await Question.findByIdAndUpdate(questionId, {
      $unset: { test: 1 },
    });

    res.status(200).json(new ApiResponse(200, {}, "Question removed from test"));
  });

  // ================= DELETE TEST (SOFT DELETE) =================
  static deleteTest = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const test = await Test.findById(id);
    if (!test) return next(new ErrorResponse("Test not found", 404));

    // Soft delete: set isDeleted to true instead of removing from database
    await Test.findByIdAndUpdate(id, { isDeleted: true });

    res.status(200).json(new ApiResponse(200, {}, "Test deleted successfully"));
  });

  static getTestSubmissions = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id:testId } = req.params;

      const submission = await StudentTestSubmission.find({
        test: testId,
      })
        .populate({
          path: "student",
          select: "-password -__v",
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

   static getTestSubmission = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id:submissionId } = req.params;

      const submission = await StudentTestSubmission.findById(submissionId)
        .populate({
          path: "student",
          select: "-password -__v",
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
}

export default TestController;
