import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import Module from "../models/module.model";
import Submodule from "../models/submodule.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";
import { Types } from "mongoose";

class ModuleController {
  // ================= CREATE MODULE =================
  static createModule = asyncHandler(async (req: Request, res: Response) => {
    const { course } = req.body;

    // Auto-assign order as last in the course
    const lastModule = await Module.findOne({ course }).sort({ order: -1 });
    req.body.order = lastModule ? lastModule.order + 1 : 0;

    const module = await Module.create(req.body);
    res.status(201).json(new ApiResponse(201, module, "Module created successfully"));
  });

  // ================= GET MODULES BY COURSE =================
  static getModulesByCourse = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;

    const modules = await Module.find({ course: courseId, isDeleted: false })
      .populate("test", "title totalPoints duration isActive")
      .sort({ order: 1 });

    // Attach submodule counts
    const moduleIds = modules.map((m) => m._id);
    const submoduleCounts = await Submodule.aggregate([
      { $match: { module: { $in: moduleIds } } },
      { $group: { _id: "$module", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(submoduleCounts.map((s) => [s._id.toString(), s.count]));

    const result = modules.map((m) => ({
      ...m.toJSON(),
      submoduleCount: countMap.get((m._id as Types.ObjectId).toString()) || 0,
    }));

    res.status(200).json(new ApiResponse(200, result, "Modules retrieved successfully"));
  });

  // ================= GET MODULE BY ID =================
  static getModuleById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const module = await Module.findById(id)
      .populate("test", "title totalPoints duration isActive questions")
      .populate("course", "title");

    if (!module) return next(new ErrorResponse("Module not found", 404));

    const submodules = await Submodule.find({ module: id }).sort({ order: 1 });

    res.status(200).json(new ApiResponse(200, { ...module.toJSON(), submodules }, "Module fetched successfully"));
  });

  // ================= UPDATE MODULE =================
  static updateModule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const module = await Module.findById(id);
    if (!module) return next(new ErrorResponse("Module not found", 404));

    Object.assign(module, req.body);
    await module.save();

    res.status(200).json(new ApiResponse(200, module, "Module updated successfully"));
  });

  // ================= DELETE MODULE (SOFT DELETE) =================
  static deleteModule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const module = await Module.findById(id);
    if (!module) return next(new ErrorResponse("Module not found", 404));

    // Soft delete: set isDeleted to true instead of removing from database
    await Module.findByIdAndUpdate(id, { isDeleted: true });

    res.status(200).json(new ApiResponse(200, {}, "Module deleted successfully"));
  });

  // ================= REORDER MODULES =================
  static reorderModules = asyncHandler(async (req: Request, res: Response) => {
    const { moduleOrders } = req.body; // [{ id: "...", order: 0 }, { id: "...", order: 1 }]

    const bulkOps = moduleOrders.map((item: { id: string; order: number }) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: item.order } },
      },
    }));

    await Module.bulkWrite(bulkOps);
    res.status(200).json(new ApiResponse(200, {}, "Modules reordered successfully"));
  });
}

export default ModuleController;
