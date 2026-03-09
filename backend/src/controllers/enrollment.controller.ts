import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import Enrollment from "../models/enrollment.model";
import Course from "../models/course.model";
import Module from "../models/module.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class EnrollmentController {
  // ================= ENROLL STUDENTS =================
  static enrollStudents = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { courseId } = req.params;
    const { studentIds } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return next(new ErrorResponse("Course not found", 404));

    // Get all modules for this course to initialize progress
    const modules = await Module.find({ course: courseId }).sort({ order: 1 });

    const enrollments = [];
    const alreadyEnrolled: string[] = [];

    for (const studentId of studentIds) {
      const existing = await Enrollment.findOne({ student: studentId, course: courseId });
      if (existing) {
        alreadyEnrolled.push(studentId);
        continue;
      }

      const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        enrolledBy: req.user?._id,
        moduleProgress: modules.map((m) => ({
          module: m._id,
          status: "NOT_STARTED",
          completedSubmodules: [],
        })),
      });
      enrollments.push(enrollment);
    }

    res.status(201).json(
      new ApiResponse(201, { enrolled: enrollments.length, alreadyEnrolled }, "Students enrolled successfully")
    );
  });

  // ================= GET ENROLLMENTS BY COURSE =================
  static getEnrollmentsByCourse = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const statusFilter = req.query.status as string;
    const search = req.query.search as string;

    const filter: any = { course: courseId };
    if (statusFilter) filter.status = statusFilter;

    const skip = (page - 1) * limit;

    let query = Enrollment.find(filter)
      .populate("student", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const enrollments = await query;
    const totalEnrollments = await Enrollment.countDocuments(filter);

    // If search is provided, filter populated results (student name/email)
    let filtered = enrollments;
    if (search) {
      const regex = new RegExp(search, "i");
      filtered = enrollments.filter((e: any) =>
        regex.test(e.student?.name || "") || regex.test(e.student?.email || "")
      );
    }

    res.status(200).json(
      new ApiResponse(200, {
        enrollments: filtered,
        currentPage: page,
        totalPages: Math.ceil(totalEnrollments / limit),
        totalEnrollments,
      }, "Enrollments retrieved successfully")
    );
  });

  // ================= GET ENROLLMENT BY STUDENT + COURSE =================
  static getEnrollment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { courseId, studentId } = req.params;

    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId })
      .populate("student", "name email")
      .populate("moduleProgress.module", "title order")
      .populate("moduleProgress.testSubmission");

    if (!enrollment) return next(new ErrorResponse("Enrollment not found", 404));

    res.status(200).json(new ApiResponse(200, enrollment, "Enrollment fetched successfully"));
  });

  // ================= UPDATE ENROLLMENT STATUS =================
  static updateEnrollmentStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) return next(new ErrorResponse("Enrollment not found", 404));

    enrollment.status = status;
    if (status === "COMPLETED") enrollment.completedAt = new Date();
    await enrollment.save();

    res.status(200).json(new ApiResponse(200, enrollment, "Enrollment status updated successfully"));
  });

  // ================= DROP / REMOVE ENROLLMENT =================
  static removeEnrollment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) return next(new ErrorResponse("Enrollment not found", 404));

    await Enrollment.findByIdAndDelete(id);
    res.status(200).json(new ApiResponse(200, {}, "Enrollment removed successfully"));
  });

  // ================= GET MY ENROLLMENTS (STUDENT) =================
  static getMyEnrollments = asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user?._id;

    const enrollments = await Enrollment.find({ student: studentId, status: "ACTIVE" })
      .populate("course", "title description")
      .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, enrollments, "My enrollments retrieved successfully"));
  });
}

export default EnrollmentController;
