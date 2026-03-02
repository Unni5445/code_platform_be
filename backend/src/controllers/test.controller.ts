import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import Test from "../models/test.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class TestController {
  // ================= CREATE TEST =================
  static createTest = asyncHandler(async (req: Request, res: Response) => {
    const test = await Test.create(req.body);
    res.status(201).json(new ApiResponse(201, test, "Test created successfully"));
  });

  // ================= GET ALL TESTS =================
  static getTests = asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const search = req.query.search as string;
    const courseFilter = req.query.course as string;
    const activeFilter = req.query.isActive as string;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (courseFilter) filter.course = courseFilter;
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

  // ================= DELETE TEST =================
  static deleteTest = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const test = await Test.findById(id);
    if (!test) return next(new ErrorResponse("Test not found", 404));

    await Test.findByIdAndDelete(id);
    res.status(200).json(new ApiResponse(200, {}, "Test deleted successfully"));
  });
}

export default TestController;
