import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";
import Course from "../models/course.model";
import mongoose from "mongoose";

class CourseController {
  // ================= CREATE COURSE =================
  static createCourse = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { title, description, roadmap } = req.body;

      if (!title) {
        return next(new ErrorResponse("Course title is required", 400));
      }

      const course = await Course.create({
        title,
        description,
        roadmap,
      });

      res
        .status(201)
        .json(
          new ApiResponse(
            201,
            course,
            "Course created successfully"
          )
        );
    }
  );

  // ================= GET ALL COURSES =================
  static getAllCourses = asyncHandler(
    async (_req: Request, res: Response) => {
      const courses = await Course.find({ isActive: true })
        .sort({ createdAt: -1 });

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            courses,
            "Courses retrieved successfully"
          )
        );
    }
  );

  // ================= GET COURSE BY ID =================
  static getCourseById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorResponse("Invalid course ID", 400));
      }

      const course = await Course.findById(id);

      if (!course) {
        return next(new ErrorResponse("Course not found", 404));
      }

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            course,
            "Course fetched successfully"
          )
        );
    }
  );

  // ================= UPDATE COURSE =================
  static updateCourse = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const course = await Course.findById(id);

      if (!course) {
        return next(new ErrorResponse("Course not found", 404));
      }

      Object.assign(course, req.body);
      await course.save();

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            course,
            "Course updated successfully"
          )
        );
    }
  );

  // ================= DELETE COURSE =================
  static deleteCourse = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const course = await Course.findById(id);

      if (!course) {
        return next(new ErrorResponse("Course not found", 404));
      }

      course.isActive = false;

      await course.save();

      res
        .status(200)
        .json(
          new ApiResponse(200, {}, "Course deleted successfully")
        );
    }
  );
}

export default CourseController;