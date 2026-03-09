import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import Course from "../models/course.model";
import Enrollment from "../models/enrollment.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class CourseController {
  // ================= CREATE COURSE =================
  static createCourse = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;

    const existingCourse = await Course.findOne({ title: data.title });
    if (existingCourse) return next(new ErrorResponse("Course with this title already exists", 400));

    // If marked global, clear organisation
    if (data.isGlobal) {
      data.organisation = undefined;
    }

    const course = await Course.create(data);
    res.status(201).json(new ApiResponse(201, course, "Course created successfully"));
  });

  // ================= GET ALL COURSES =================
  static getCourses = asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const search = req.query.search as string;

    const filter: any = {};
    if (search) {
      filter.$and = [
        { $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ]}
      ];
    }

    // Admin sees global courses + their org's courses
    if (req.user?.role === "ADMIN") {
      const orgFilter = { $or: [{ isGlobal: true }, { organisation: req.user.organisation }, { organisation: { $exists: false } }, { organisation: null }] };
      if (filter.$and) {
        filter.$and.push(orgFilter);
      } else {
        Object.assign(filter, orgFilter);
      }
    }

    const skip = (page - 1) * limit;
    const courses = await Course.find(filter)
      .populate("organisation", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCourses = await Course.countDocuments(filter);

    const courseIds = courses.map((c) => c._id);
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds }, status: { $ne: "DROPPED" } } },
      { $group: { _id: "$course", count: { $sum: 1 } } },
    ]);
    const enrollMap = Object.fromEntries(enrollmentCounts.map((e) => [e._id.toString(), e.count]));

    const coursesWithCount = courses.map((c) => ({
      ...c,
      enrolledCount: enrollMap[c._id.toString()] || 0,
    }));

    res.status(200).json(
      new ApiResponse(200, {
        courses: coursesWithCount,
        currentPage: page,
        totalPages: Math.ceil(totalCourses / limit),
        totalCourses,
      }, "Courses retrieved successfully")
    );
  });

  // ================= GET COURSE BY ID =================
  static getCourseById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate("organisation", "name");

    if (!course) return next(new ErrorResponse("Course not found", 404));

    res.status(200).json(new ApiResponse(200, course, "Course fetched successfully"));
  });

  // ================= UPDATE COURSE =================
  static updateCourse = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) return next(new ErrorResponse("Course not found", 404));

    Object.assign(course, req.body);
    await course.save();

    res.status(200).json(new ApiResponse(200, course, "Course updated successfully"));
  });

  // ================= DELETE COURSE =================
  static deleteCourse = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) return next(new ErrorResponse("Course not found", 404));

    await Course.findByIdAndDelete(id);
    res.status(200).json(new ApiResponse(200, {}, "Course deleted successfully"));
  });

}

export default CourseController;
