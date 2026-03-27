import { NextFunction, Response, Request } from "express";
import path from "path";
import fs from "fs";
import asyncHandler from "../utils/asyncHandler";
import Submodule from "../models/submodule.model";
import Module from "../models/module.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

// ── Helper: build public URL from uploaded file ───────────────────────────────
// e.g.  https://yourdomain.com/uploads/pdfs/pdf-1234567890.pdf
function getPdfUrl(req: Request, file: Express.Multer.File): string {
  // Use BASE_URL if defined, otherwise construct with HTTPS
  const baseUrl = process.env.BASE_URL || `https://${req.get("host")}`;
  return `${baseUrl}/uploads/pdfs/${file.filename}`;
}

// ── Helper: delete old pdf file from disk ─────────────────────────────────────
function deleteOldPdf(pdfUrl?: string) {
  if (!pdfUrl) return;
  try {
    // Extract just the filename from the stored URL
    const filename = pdfUrl.split("/uploads/pdfs/").pop();
    if (!filename) return;
    const filePath = path.join(process.cwd(), "public", "uploads", "pdfs", filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Non-fatal: log but don't crash
    console.error("Failed to delete old PDF:", pdfUrl);
  }
}

class SubmoduleController {
  // ================= CREATE SUBMODULE =================
  static createSubmodule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { module: moduleId } = req.body;

    const parentModule = await Module.findById(moduleId);
    if (!parentModule) return next(new ErrorResponse("Parent module not found", 404));

    // Auto-assign order
    const lastSubmodule = await Submodule.findOne({ module: moduleId }).sort({ order: -1 });
    req.body.order = lastSubmodule ? lastSubmodule.order + 1 : 0;

    // Attach PDF URL if a file was uploaded
    if (req.file) {
      req.body.pdfUrl = getPdfUrl(req, req.file);
    }

    const submodule = await Submodule.create(req.body);
    res.status(201).json(new ApiResponse(201, submodule, "Submodule created successfully"));
  });

  // ================= GET SUBMODULES BY MODULE =================
  static getSubmodulesByModule = asyncHandler(async (req: Request, res: Response) => {
    const { moduleId } = req.params;

    const submodules = await Submodule.find({ module: moduleId, isDeleted: false }).sort({ order: 1 });

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

    // If a new PDF is uploaded, delete the old one and save the new URL
    if (req.file) {
      deleteOldPdf((submodule as any).pdfUrl);
      req.body.pdfUrl = getPdfUrl(req, req.file);
    }

    Object.assign(submodule, req.body);
    await submodule.save();

    res.status(200).json(new ApiResponse(200, submodule, "Submodule updated successfully"));
  });

  // ================= DELETE SUBMODULE (SOFT DELETE) =================
  static deleteSubmodule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const submodule = await Submodule.findById(id);
    if (!submodule) return next(new ErrorResponse("Submodule not found", 404));

    // Delete the PDF file from disk on hard delete (optional: skip for soft delete)
    deleteOldPdf((submodule as any).pdfUrl);

    await Submodule.findByIdAndUpdate(id, { isDeleted: true });

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