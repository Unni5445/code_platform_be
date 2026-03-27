import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import Batch, { BATCH_DURATIONS } from "../models/batch.model";
import Organisation from "../models/organisation.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class BatchController {
  // ================= CREATE BATCH =================
  static createBatch = asyncHandler(async (req: Request, res: Response, next:NextFunction) => {
    const { name, organisation, duration, startDate, endDate } = req.body;

    // Validate required fields
    if (!organisation) {
      return next(new ErrorResponse("Organisation ID is required", 400));
    }
    if (!duration || !BATCH_DURATIONS.includes(duration)) {
      return next(new ErrorResponse(`Duration is required and must be one of: ${BATCH_DURATIONS.join(", ")}`, 400));
    }
    if (!startDate || !endDate) {
      return next(new ErrorResponse("Start date and end date are required", 400));
    }

    // Validate organisation exists
    const orgExists = await Organisation.findById(organisation);
    if (!orgExists) {
      return next(new ErrorResponse("Organisation not found", 404));
    }

    const batch = await Batch.create(req.body);
    res.status(201).json(new ApiResponse(201, batch, "Batch created successfully"));
  });

  // ================= GET ALL BATCHES =================
  static getBatches = asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.search as string;
    const orgFilter = req.query.organisation as string;

    const filter: any = { isDeleted: false }; // Filter out deleted batches
    if (search) filter.name = { $regex: search, $options: "i" };
    if (orgFilter) filter.organisation = orgFilter;

    // Admin can only see their org batches
    if (req.user?.role === "ADMIN") filter.organisation = req.user.organisation;

    const batches = await Batch.find(filter)
      .populate("organisation", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, batches, "Batches retrieved successfully"));
  });

  // ================= GET BATCH BY ID =================
  static getBatchById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const batch = await Batch.findById(id)
      .populate("organisation", "name");

    if (!batch) return next(new ErrorResponse("Batch not found", 404));

    res.status(200).json(new ApiResponse(200, batch, "Batch fetched successfully"));
  });

  // ================= UPDATE BATCH =================
  static updateBatch = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const batch = await Batch.findById(id);
    if (!batch) return next(new ErrorResponse("Batch not found", 404));

    Object.assign(batch, req.body);
    await batch.save();

    res.status(200).json(new ApiResponse(200, batch, "Batch updated successfully"));
  });

  // ================= DELETE BATCH (SOFT DELETE) =================
  static deleteBatch = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const batch = await Batch.findById(id);
    if (!batch) return next(new ErrorResponse("Batch not found", 404));

    // Soft delete: set isDeleted to true instead of removing from database
    await Batch.findByIdAndUpdate(id, { isDeleted: true });

    res.status(200).json(new ApiResponse(200, {}, "Batch deleted successfully"));
  });

  // ================= DELETE MULTIPLE BATCHES (SOFT DELETE) =================
  static deleteBatches = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { batchIds } = req.body;

    if (!Array.isArray(batchIds) || batchIds.length === 0) {
      return next(new ErrorResponse("Batch IDs are required", 400));
    }

    const result = await Batch.updateMany(
      { _id: { $in: batchIds } },
      { isDeleted: true }
    );

    res.status(200).json(new ApiResponse(200, { deletedCount: result.modifiedCount }, "Batches deleted successfully"));
  });

  // ================= UPDATE MULTIPLE BATCHES =================
  static updateBatches = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { batchIds, organisationId } = req.body;

    if (!Array.isArray(batchIds) || batchIds.length === 0) {
      return next(new ErrorResponse("Batch IDs are required", 400));
    }

    const updateData: any = {};
    if (organisationId) {
      updateData.organisation = organisationId;
    }

    const result = await Batch.updateMany(
      { _id: { $in: batchIds } },
      { $set: updateData }
    );

    res.status(200).json(new ApiResponse(200, { updatedCount: result.modifiedCount }, "Batches updated successfully"));
  });

}

export default BatchController;
