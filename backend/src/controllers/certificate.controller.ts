import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import Certificate from "../models/certificate.mode";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class CertificateController {
  // ================= CREATE CERTIFICATE =================
  static createCertificate = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;

    // Auto-generate verification link
    if (!data.verificationLink) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      data.verificationLink = `${frontendUrl}/verify-certificate/${Date.now()}`;
    }

    const certificate = await Certificate.create(data);
    res.status(201).json(new ApiResponse(201, certificate, "Certificate created successfully"));
  });

  // ================= GET ALL CERTIFICATES =================
  static getCertificates = asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const search = req.query.search as string;
    const studentFilter = req.query.student as string;
    const courseFilter = req.query.course as string;

    const filter: any = {isDeleted: false};
    if (search) filter.title = { $regex: search, $options: "i" };
    if (studentFilter) filter.student = studentFilter;
    if (courseFilter) filter.course = courseFilter;

    const skip = (page - 1) * limit;
    const certificates = await Certificate.find(filter)
      .populate("student", "name email")
      .populate("course", "title")
      .populate("test", "title")
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCertificates = await Certificate.countDocuments(filter);

    res.status(200).json(
      new ApiResponse(200, {
        certificates,
        currentPage: page,
        totalPages: Math.ceil(totalCertificates / limit),
        totalCertificates,
      }, "Certificates retrieved successfully")
    );
  });

  // ================= GET CERTIFICATE BY ID =================
  static getCertificateById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const certificate = await Certificate.findById(id)
      .populate("student", "name email")
      .populate("course", "title")
      .populate("test", "title");

    if (!certificate) return next(new ErrorResponse("Certificate not found", 404));

    res.status(200).json(new ApiResponse(200, certificate, "Certificate fetched successfully"));
  });

  // ================= DELETE CERTIFICATE =================
  static deleteCertificate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const certificate = await Certificate.findById(id);
    if (!certificate) return next(new ErrorResponse("Certificate not found", 404));

    await Certificate.findByIdAndUpdate(id, { isDeleted: true });
    res.status(200).json(new ApiResponse(200, {}, "Certificate deleted successfully"));
  });

  // ================= VERIFY CERTIFICATE =================
  static verifyCertificate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { verificationId } = req.params;
    const mongoose = require("mongoose");

    const query: any = { $or: [{ verificationLink: { $regex: verificationId } }] };
    if (mongoose.Types.ObjectId.isValid(verificationId)) {
      query.$or.push({ _id: verificationId });
    }

    const certificate = await Certificate.findOne(query)
      .populate("student", "name email")
      .populate("course", "title")
      .populate("test", "title");

    if (!certificate) return next(new ErrorResponse("Certificate not found or invalid", 404));

    res.status(200).json(new ApiResponse(200, certificate, "Certificate verified successfully"));
  });
}

export default CertificateController;
