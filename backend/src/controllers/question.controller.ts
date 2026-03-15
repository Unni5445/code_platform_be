import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import Question from "../models/question.model";
import Test from "../models/test.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class QuestionController {
  // ================= CREATE QUESTION =================
  static createQuestion = asyncHandler(async (req: Request, res: Response) => {
    const question = await Question.create(req.body);

    // If test is provided, add question to the test's questions array
    if (req.body.test) {
      await Test.findByIdAndUpdate(req.body.test, {
        $addToSet: { questions: question._id },
      });
    }

    res.status(201).json(new ApiResponse(201, question, "Question created successfully"));
  });

  // ================= GET ALL QUESTIONS =================
  static getQuestions = asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const search = req.query.search as string;
    const typeFilter = req.query.type as string;
    const difficultyFilter = req.query.difficulty as string;
    const courseFilter = req.query.course as string;
    const moduleFilter = req.query.module as string;
    const testFilter = req.query.test as string;
    const tagFilter = req.query.tag as string;

    const filter: any = {};
    if (search) filter.title = { $regex: search, $options: "i" };
    if (typeFilter) filter.type = typeFilter;
    if (difficultyFilter) filter.difficulty = difficultyFilter;
    if (testFilter === "none") {
      if (!filter.$and) filter.$and = [];
      filter.$and.push({ $or: [{ test: { $exists: false } }, { test: null }] });
    } else if (testFilter) {
      filter.test = testFilter;
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
    if (tagFilter) filter.tags = { $in: [tagFilter] };

    const skip = (page - 1) * limit;
    const questions = await Question.find(filter)
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalQuestions = await Question.countDocuments(filter);

    res.status(200).json(
      new ApiResponse(200, {
        questions,
        currentPage: page,
        totalPages: Math.ceil(totalQuestions / limit),
        totalQuestions,
      }, "Questions retrieved successfully")
    );
  });

  // ================= GET QUESTION BY ID =================
  static getQuestionById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const question = await Question.findById(id).populate("course", "title");
    if (!question) return next(new ErrorResponse("Question not found", 404));

    res.status(200).json(new ApiResponse(200, question, "Question fetched successfully"));
  });

  // ================= UPDATE QUESTION =================
  static updateQuestion = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const question = await Question.findById(id);
    if (!question) return next(new ErrorResponse("Question not found", 404));

    Object.assign(question, req.body);
    question.version = (question.version || 1) + 1;
    await question.save();

    res.status(200).json(new ApiResponse(200, question, "Question updated successfully"));
  });

  // ================= BULK IMPORT QUESTIONS =================
  static bulkImportQuestions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return next(new ErrorResponse("Please provide an array of questions", 400));
    }

    if (questions.length > 100) {
      return next(new ErrorResponse("Maximum 100 questions per import", 400));
    }

    // Strip course/module/test and auto-generate slugs
    const questionsWithSlugs = questions.map((q: any) => {
      const { course, module, test, ...rest } = q;
      return {
        ...rest,
        slug: q.slug || q.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      };
    });

    const created = await Question.insertMany(questionsWithSlugs, { ordered: false });

    res.status(201).json(
      new ApiResponse(201, { imported: created.length, questions: created }, `${created.length} question(s) imported successfully`)
    );
  });

  // ================= DELETE QUESTION =================
  static deleteQuestion = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const question = await Question.findById(id);
    if (!question) return next(new ErrorResponse("Question not found", 404));

    // Remove question from its test's questions array
    if (question.test) {
      await Test.findByIdAndUpdate(question.test, {
        $pull: { questions: question._id },
      });
    }

    await Question.findByIdAndDelete(id);
    res.status(200).json(new ApiResponse(200, {}, "Question deleted successfully"));
  });
}

export default QuestionController;
