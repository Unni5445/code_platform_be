import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";
import Batch from "../models/batch.model";
import Course from "../models/course.model";
import mongoose from "mongoose";

class BatchController {
  // ================= CREATE BATCH =================
  static createBatch = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { name, course, students } = req.body;

      if (!name || !course) {
        return next(new ErrorResponse("Batch name and course are required", 400));
      }

      if (!mongoose.Types.ObjectId.isValid(course)) {
        return next(new ErrorResponse("Invalid course ID", 400));
      }

      const courseExists = await Course.findById(course);
      if (!courseExists) {
        return next(new ErrorResponse("Course not found", 404));
      }

      const batch = await Batch.create({
        name,
        course,
        students: students || [],
      });

      const populatedBatch = await Batch.findById(batch._id)
        .populate("course", "title description")
        .populate("students", "name email");

      res
        .status(201)
        .json(
          new ApiResponse(
            201,
            populatedBatch,
            "Batch created successfully"
          )
        );
    }
  );

  // ================= GET ALL BATCHES =================
  static getAllBatches = asyncHandler(
    async (req: Request, res: Response) => {
      const { courseId } = req.query;
      
      let filter = {};
      if (courseId && mongoose.Types.ObjectId.isValid(courseId as string)) {
        filter = { course: courseId };
      }

      const batches = await Batch.find(filter)
        .sort({ createdAt: -1 })
        .populate("course", "title description")
        .populate("students", "name email");

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            batches,
            "Batches retrieved successfully"
          )
        );
    }
  );

  // ================= GET BATCH BY ID =================
  static getBatchById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorResponse("Invalid batch ID", 400));
      }

      const batch = await Batch.findById(id)
        .populate("course", "title description roadmap")
        .populate("students", "name email");

      if (!batch) {
        return next(new ErrorResponse("Batch not found", 404));
      }

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            batch,
            "Batch fetched successfully"
          )
        );
    }
  );

  // ================= UPDATE BATCH =================
  static updateBatch = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { course, ...updateData } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorResponse("Invalid batch ID", 400));
      }

      const batch = await Batch.findById(id);

      if (!batch) {
        return next(new ErrorResponse("Batch not found", 404));
      }

      if (course && !mongoose.Types.ObjectId.isValid(course)) {
        return next(new ErrorResponse("Invalid course ID", 400));
      }

      if (course) {
        const courseExists = await Course.findById(course);
        if (!courseExists) {
          return next(new ErrorResponse("Course not found", 404));
        }
      }

      Object.assign(batch, req.body);
      await batch.save();

      const populatedBatch = await Batch.findById(batch._id)
        .populate("course", "title description")
        .populate("students", "name email");

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            populatedBatch,
            "Batch updated successfully"
          )
        );
    }
  );

  // ================= DELETE BATCH =================
  static deleteBatch = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorResponse("Invalid batch ID", 400));
      }

      const batch = await Batch.findById(id);

      if (!batch) {
        return next(new ErrorResponse("Batch not found", 404));
      }

      await Batch.findByIdAndDelete(id);

      res
        .status(200)
        .json(
          new ApiResponse(200, {}, "Batch deleted successfully")
        );
    }
  );

  // ================= ADD STUDENT TO BATCH =================
  static addStudentToBatch = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { batchId, studentId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(batchId) || !mongoose.Types.ObjectId.isValid(studentId)) {
        return next(new ErrorResponse("Invalid batch ID or student ID", 400));
      }

      const batch = await Batch.findById(batchId);

      if (!batch) {
        return next(new ErrorResponse("Batch not found", 404));
      }

      if (batch.students.includes(studentId)) {
        return next(new ErrorResponse("Student is already in this batch", 400));
      }

      batch.students.push(studentId);
      await batch.save();

      const populatedBatch = await Batch.findById(batch._id)
        .populate("course", "title description")
        .populate("students", "name email");

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            populatedBatch,
            "Student added to batch successfully"
          )
        );
    }
  );

  // ================= REMOVE STUDENT FROM BATCH =================
  static removeStudentFromBatch = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { batchId, studentId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(batchId) || !mongoose.Types.ObjectId.isValid(studentId)) {
        return next(new ErrorResponse("Invalid batch ID or student ID", 400));
      }

      const batch = await Batch.findById(batchId);

      if (!batch) {
        return next(new ErrorResponse("Batch not found", 404));
      }

      batch.students = batch.students.filter(
        (student) => student.toString() !== studentId
      );

      await batch.save();

      const populatedBatch = await Batch.findById(batch._id)
        .populate("course", "title description")
        .populate("students", "name email");

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            populatedBatch,
            "Student removed from batch successfully"
          )
        );
    }
  );
}

export default BatchController;