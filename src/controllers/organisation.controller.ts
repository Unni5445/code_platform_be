import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";
import Organisation from "../models/organisation.model";
import mongoose from "mongoose";

class OrganisationController {
  // ================= CREATE ORGANISATION =================
  static createOrganisation = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { name, address, admins } = req.body;

      if (!name) {
        return next(new ErrorResponse("Organisation name is required", 400));
      }

      const organisation = await Organisation.create({
        name,
        address,
        admins,
      });

      res
        .status(201)
        .json(
          new ApiResponse(
            201,
            organisation,
            "Organisation created successfully"
          )
        );
    }
  );

  // ================= GET ALL ORGANISATIONS =================
  static getAllOrganisations = asyncHandler(
    async (_req: Request, res: Response) => {
      const organisations = await Organisation.find()
        .sort({ createdAt: -1 })
        .populate("admins", "name email role");

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            organisations,
            "Organisations retrieved successfully"
          )
        );
    }
  );

  // ================= GET ORGANISATION BY ID =================
  static getOrganisationById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorResponse("Invalid organisation ID", 400));
      }

      const organisation = await Organisation.findById(id).populate(
        "admins",
        "name email role"
      );

      if (!organisation) {
        return next(new ErrorResponse("Organisation not found", 404));
      }

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            organisation,
            "Organisation fetched successfully"
          )
        );
    }
  );

  // ================= UPDATE ORGANISATION =================
  static updateOrganisation = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const organisation = await Organisation.findById(id);

      if (!organisation) {
        return next(new ErrorResponse("Organisation not found", 404));
      }

      Object.assign(organisation, req.body);
      await organisation.save();

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            organisation,
            "Organisation updated successfully"
          )
        );
    }
  );

  // ================= DELETE ORGANISATION =================
  static deleteOrganisation = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const organisation = await Organisation.findById(id);

      if (!organisation) {
        return next(new ErrorResponse("Organisation not found", 404));
      }

      organisation.isDeleted = true

      await organisation.save()

      res
        .status(200)
        .json(
          new ApiResponse(200, {}, "Organisation deleted successfully")
        );
    }
  );

  // ================= ADD ADMIN =================
  static addAdminToOrganisation = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { organisationId, userId } = req.body;

      const organisation = await Organisation.findById(organisationId);

      if (!organisation) {
        return next(new ErrorResponse("Organisation not found", 404));
      }

      if (organisation.admins.includes(userId)) {
        return next(new ErrorResponse("User is already an admin", 400));
      }

      organisation.admins.push(userId);
      await organisation.save();

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            organisation,
            "Admin added to organisation successfully"
          )
        );
    }
  );

  // ================= REMOVE ADMIN =================
  static removeAdminFromOrganisation = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { organisationId, userId } = req.body;

      const organisation = await Organisation.findById(organisationId);

      if (!organisation) {
        return next(new ErrorResponse("Organisation not found", 404));
      }

      organisation.admins = organisation.admins.filter(
        (adminId) => adminId.toString() !== userId
      );

      await organisation.save();

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            organisation,
            "Admin removed from organisation successfully"
          )
        );
    }
  );
}

export default OrganisationController;
