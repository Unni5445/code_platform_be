import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import Submodule from "../models/submodule.model";
import Module from "../models/module.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class SubmoduleController {
  // ================= CREATE SUBMODULE =================
  static createSubmodule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { module: moduleId } = req.body;

    const parentModule = await Module.findById(moduleId);
    if (!parentModule) return next(new ErrorResponse("Parent module not found", 404));

    // Auto-assign order
    const lastSubmodule = await Submodule.findOne({ module: moduleId }).sort({ order: -1 });
    req.body.order = lastSubmodule ? lastSubmodule.order + 1 : 0;

    const submodule = await Submodule.create(req.body);
    res.status(201).json(new ApiResponse(201, submodule, "Submodule created successfully"));
  });

  // ================= GET SUBMODULES BY MODULE =================
  static getSubmodulesByModule = asyncHandler(async (req: Request, res: Response) => {
    const { moduleId } = req.params;

    const submodules = await Submodule.find({ module: moduleId }).sort({ order: 1 });

    res.status(200).json(new ApiResponse(200, submodules, "Submodules retrieved successfully"));
  });

  // ================= GET SUBMODULE BY ID =================
  static getSubmoduleById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const submodule = await Submodule.findById(id).populate("module", "title");
    if (!submodule) return next(new ErrorResponse("Submodule not found", 404));

    res.status(200).json(new ApiResponse(200, submodule, "Submodule fetched successfully"));
  });

  // ================= UPDATE SUBMODULE =================
  static updateSubmodule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const submodule = await Submodule.findById(id);
    if (!submodule) return next(new ErrorResponse("Submodule not found", 404));

    Object.assign(submodule, req.body);
    await submodule.save();

    res.status(200).json(new ApiResponse(200, submodule, "Submodule updated successfully"));
  });

  // ================= DELETE SUBMODULE =================
  static deleteSubmodule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const submodule = await Submodule.findById(id);
    if (!submodule) return next(new ErrorResponse("Submodule not found", 404));

    await Submodule.findByIdAndDelete(id);
    res.status(200).json(new ApiResponse(200, {}, "Submodule deleted successfully"));
  });

  // ================= REORDER SUBMODULES =================
  static reorderSubmodules = asyncHandler(async (req: Request, res: Response) => {
    const { submoduleOrders } = req.body; // [{ id: "...", order: 0 }, ...]

    const bulkOps = submoduleOrders.map((item: { id: string; order: number }) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: item.order } },
      },
    }));

    await Submodule.bulkWrite(bulkOps);
    res.status(200).json(new ApiResponse(200, {}, "Submodules reordered successfully"));
  });
}

export default SubmoduleController;
