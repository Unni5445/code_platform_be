import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import Course from "../models/course.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class CourseController {
  // ================= CREATE COURSE =================
  static createCourse = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;

    const existingCourse = await Course.findOne({ title: data.titlen });
    if (existingCourse) return next(new ErrorResponse("Course with this title already exists", 400));

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
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Admin can only see their org courses
    if (req.user?.role === "ADMIN") filter.organisation = req.user.organisation;

    const skip = (page - 1) * limit;
    const courses = await Course.find(filter)
      // .populate("organisation", "name")
      .populate("enrolledStudents", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCourses = await Course.countDocuments(filter);

    res.status(200).json(
      new ApiResponse(200, {
        courses,
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
      // .populate("organisation", "name")
      .populate("enrolledStudents", "name email points");

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

  // ================= ENROLL STUDENTS =================
  static enrollStudents = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { studentIds } = req.body;

    const course = await Course.findById(id);
    if (!course) return next(new ErrorResponse("Course not found", 404));

    const newStudents = studentIds.filter(
      (sid: string) => !course.enrolledStudents.map(String).includes(sid)
    );
    course.enrolledStudents.push(...newStudents);
    await course.save();

    res.status(200).json(new ApiResponse(200, course, "Students enrolled successfully"));
  });
}

export default CourseController;
