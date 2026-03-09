import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import Organisation from "../models/organisation.model";
import User from "../models/user.model";
import Batch from "../models/batch.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class OrganisationController {
  // ================= CREATE ORGANISATION =================
  static createOrganisation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;

    const existing = await Organisation.findOne({ name });
    if (existing) return next(new ErrorResponse("Organisation with this name already exists", 400));

    const organisation = await Organisation.create(req.body);
    res.status(201).json(new ApiResponse(201, organisation, "Organisation created successfully"));
  });

  // ================= GET ALL ORGANISATIONS =================
  static getOrganisations = asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.search as string;

    const filter: any = {};
    if (search) filter.name = { $regex: search, $options: "i" };

    const organisations = await Organisation.find(filter)
      .populate("admin", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const orgIds = organisations.map((org) => org._id);

    const [studentCounts, batchCounts] = await Promise.all([
      User.aggregate([
        { $match: { organisation: { $in: orgIds }, role: "STUDENT", isDeleted: { $ne: true } } },
        { $group: { _id: "$organisation", count: { $sum: 1 } } },
      ]),
      Batch.aggregate([
        { $match: { organisation: { $in: orgIds } } },
        { $group: { _id: "$organisation", count: { $sum: 1 } } },
      ]),
    ]);

    const studentMap = Object.fromEntries(studentCounts.map((s) => [s._id.toString(), s.count]));
    const batchMap = Object.fromEntries(batchCounts.map((b) => [b._id.toString(), b.count]));

    const result = organisations.map((org) => ({
      ...org,
      studentCount: studentMap[org._id.toString()] || 0,
      batchCount: batchMap[org._id.toString()] || 0,
    }));

    res.status(200).json(new ApiResponse(200, result, "Organisations retrieved successfully"));
  });

  // ================= GET ORGANISATION BY ID =================
  static getOrganisationById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const organisation = await Organisation.findById(id)
      .populate("admin", "name email")

    if (!organisation) return next(new ErrorResponse("Organisation not found", 404));

    res.status(200).json(new ApiResponse(200, organisation, "Organisation fetched successfully"));
  });

  // ================= UPDATE ORGANISATION =================
  static updateOrganisation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const organisation = await Organisation.findById(id);
    if (!organisation) return next(new ErrorResponse("Organisation not found", 404));

    Object.assign(organisation, req.body);
    await organisation.save();

    res.status(200).json(new ApiResponse(200, organisation, "Organisation updated successfully"));
  });

  // ================= DELETE ORGANISATION =================
  static deleteOrganisation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const organisation = await Organisation.findById(id);
    if (!organisation) return next(new ErrorResponse("Organisation not found", 404));

    await Organisation.findByIdAndDelete(id);
    res.status(200).json(new ApiResponse(200, {}, "Organisation deleted successfully"));
  });
}

export default OrganisationController;
