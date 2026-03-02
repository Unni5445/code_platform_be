import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import Organisation from "../models/organisation.model";
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
      .populate("courses", "title")
      .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, organisations, "Organisations retrieved successfully"));
  });

  // ================= GET ORGANISATION BY ID =================
  static getOrganisationById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const organisation = await Organisation.findById(id)
      .populate("admin", "name email")
      .populate("students", "name email points")
      .populate("courses", "title description");

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
