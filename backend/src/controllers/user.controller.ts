import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import User, { UserRole } from "../models/user.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";
import createJWTToken from "../utils/createJwtToken";
import sendEmail from "../utils/sendEmail";
import { Types } from "mongoose";

class UserController {
  // ================= CREATE USER =================
  static createUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;

    // ADMIN can only create STUDENT users in their own org
    if (req.user?.role === "ADMIN") {
      data.role = "STUDENT";
      data.organisation = req.user.organisation;
    }

    const existingUser = await User.findOne({ email: data.email, isDeleted: false });
    if (existingUser) return next(new ErrorResponse("User already exists", 400));

    const user = await User.create(data);
    res.status(201).json(new ApiResponse(201, user, "User created successfully"));
  });

  // ================= GET USER BY ID =================
  static getUserById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const requestingUser = req.user;

    let query: any = { _id: id, isDeleted: false };

    // Role-based access
    if (requestingUser?.role === "ADMIN") query.organisation = requestingUser.organisation;

    const user = await User.findOne(query).select("-password").populate("college batch organisation");
    if (!user) return next(new ErrorResponse("User not found", 404));

    res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
  });

  // ================= GET ALL USERS WITH ROLE =================
  static getUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const search = req.query.search as string;
    const roleFilter = req.query.role as UserRole;

    const filter: any = { isDeleted: false };
    if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    if (roleFilter) filter.role = roleFilter;

    // Admin can only see their org users
    if (req.user?.role === "ADMIN") filter.organisation = req.user.organisation;

    const skip = (page - 1) * limit;
    const users = await User.find(filter).select("-password").populate("organisation").sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalUsers = await User.countDocuments(filter);

    res.status(200).json(new ApiResponse(200, { users, currentPage: page, totalPages: Math.ceil(totalUsers / limit), totalUsers }, "Users retrieved successfully"));
  });

  // ================= UPDATE USER =================
  static updateUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const query: any = { _id: id, isDeleted: false };

    // ADMIN can only update users in their own org
    if (req.user?.role === "ADMIN") {
      query.organisation = req.user.organisation;
      // Prevent ADMIN from changing role or organisation
      delete req.body.role;
      delete req.body.organisation;
    }

    const user = await User.findOne(query);
    if (!user) return next(new ErrorResponse("User not found", 404));

    Object.assign(user, req.body);
    await user.save();
    res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
  });

  // ================= DELETE USER (SOFT) =================
  static deleteUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const query: any = { _id: id, isDeleted: false };

    // ADMIN can only delete users in their own org
    if (req.user?.role === "ADMIN") query.organisation = req.user.organisation;

    const user = await User.findOne(query);
    if (!user) return next(new ErrorResponse("User not found", 404));

    user.isDeleted = true;
    await user.save();
    res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));
  });

  // ================= EXPORT USERS =================
  static exportUsers = asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.search as string;
    const roleFilter = req.query.role as UserRole;
    const isAdmin = req.user?.role === "ADMIN";

    const filter: any = { isDeleted: false };
    if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    if (roleFilter) filter.role = roleFilter;

    // Admin can only see their org users
    if (isAdmin) filter.organisation = req?.user?.organisation;

    const users = await User.find(filter).select("-password").populate("organisation").sort({ createdAt: -1 });

    // Convert to CSV
    const headers = ["Name", "Email", "Role", "Department", "Passout Year", "Gender", "Status", "Points", "Streak", "Joined"];
    const rows = users.map(user => [
      `"${(user.name || "").replace(/"/g, '""')}"`,
      `"${(user.email || "").replace(/"/g, '""')}"`,
      user.role || "",
      `"${(user.department || "").replace(/"/g, '""')}"`,
      user.passoutYear || "",
      user.gender || "",
      user.isActive ? "Active" : "Inactive",
      user.points || 0,
      user.streak || 0,
      new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=users-export-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  });

  // ================= SIGN UP (STUDENT) =================
  static signupUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return next(new ErrorResponse("Name, email and password are required", 400));

    const existingUser = await User.findOne({ email, isDeleted: false });
    if (existingUser) return next(new ErrorResponse("An account with this email already exists", 400));

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: "STUDENT",
      organisation: "69a4771afb503d57808b866e",
      isActive: true,
    });

    const token = createJWTToken((user._id as Types.ObjectId).toString(), user.role);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json(new ApiResponse(201, { token, _id: user._id, email: user.email, role: user.role }, "Account created successfully"));
  });

  // ================= GOOGLE AUTH =================
  static googleAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, name, googleId } = req.body;
    if (!email || !googleId) return next(new ErrorResponse("Invalid Google auth data", 400));

    let user = await User.findOne({ email, isDeleted: false });

    if (!user) {
      // Auto-create student account on first Google sign-in
      user = await User.create({
        email,
        name,
        googleId,
        role: "STUDENT",
        organisation: "69a4771afb503d57808b866e",
        isActive: true,
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      await user.save();
    }

    const token = createJWTToken((user._id as Types.ObjectId).toString(), user.role);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json(new ApiResponse(200, { token, _id: user._id, email: user.email, role: user.role }, "Google login successful"));
  });

  // ================= FORGOT PASSWORD =================
  static forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!email) return next(new ErrorResponse("Please provide an email", 400));

    const user = await User.findOne({ email, isDeleted: false });
    if (!user) return next(new ErrorResponse("No account found with this email", 404));

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendEmail(
      email,
      "Password Reset OTP - Skill & Brains",
      `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1f2937; margin-bottom: 16px;">Password Reset</h2>
        <p style="color: #6b7280;">Use the OTP below to reset your password. It expires in 10 minutes.</p>
        <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7c3aed;">${otp}</span>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>`
    );

    res.status(200).json(new ApiResponse(200, {}, "OTP sent to your email"));
  });

  // ================= VERIFY OTP =================
  static verifyOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    if (!email || !otp) return next(new ErrorResponse("Email and OTP are required", 400));

    const user = await User.findOne({ email, isDeleted: false });
    if (!user) return next(new ErrorResponse("No account found", 404));

    if (!user.otp || !user.otpExpiry || user.otp !== otp) {
      return next(new ErrorResponse("Invalid OTP", 400));
    }

    if (new Date() > user.otpExpiry) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
      return next(new ErrorResponse("OTP has expired", 400));
    }

    res.status(200).json(new ApiResponse(200, {}, "OTP verified successfully"));
  });

  // ================= RESET PASSWORD =================
  static resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return next(new ErrorResponse("All fields are required", 400));

    const user = await User.findOne({ email, isDeleted: false }).select("+password");
    if (!user) return next(new ErrorResponse("No account found", 404));

    if (!user.otp || !user.otpExpiry || user.otp !== otp) {
      return next(new ErrorResponse("Invalid OTP", 400));
    }

    if (new Date() > user.otpExpiry) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
      return next(new ErrorResponse("OTP has expired", 400));
    }

    if (newPassword.length < 6) {
      return next(new ErrorResponse("Password must be at least 6 characters", 400));
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"));
  });

  // ================= SIGN IN =================
  static signinUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    if (!email || !password) return next(new ErrorResponse("Please provide valid credentials", 400));

    const user = await User.findOne({ email, isDeleted: false }).select("+password");
    if (!user) return next(new ErrorResponse("Invalid email or password", 400));

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(new ErrorResponse("Invalid email or password", 400));

    const token = createJWTToken((user._id as Types.ObjectId).toString(), user.role);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
      domain: ".morattucoder.com",
    });

    res.status(200).json(new ApiResponse(200, { token, _id: user._id, email: user.email, role: user.role }, "Login successful"));
  });

  static signOut = asyncHandler(async (_req: Request, res: Response) => {
    // Clear the token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain: ".morattucoder.com",
      maxAge: 0,
    });

    res.status(200).json(new ApiResponse(200, {}, "Logout successful"));
  });

  // ================= GET USER FROM TOKEN =================
  static getUserByToken = asyncHandler(async (req: Request, res: Response) => {
    const User = require("../models/user.model").default;
    const user = await User.findById(req.user!._id)
      .populate("organisation", "name")
      .select("-password -refreshToken -refreshTokenExpiry -otp -otpExpiry");

    res.json(new ApiResponse(200, user));
  });

  // ================= BULK IMPORT USERS =================
  static bulkImportUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return next(new ErrorResponse("Please provide an array of users", 400));
    }

    if (users.length > 100) {
      return next(new ErrorResponse("Maximum 100 users per import", 400));
    }

    const requestingUser = req.user;

    // Prepare users
    const preparedUsers = users.map((u: any) => {
      const userData: any = {
        name: u.name,
        email: u.email?.toLowerCase(),
        phone: u.phone,
        password: u.password || "123456", // default password
        department: u.department,
        passoutYear: u.passoutYear,
        role: u.role || "STUDENT",
        isActive: true,
      };

      // ADMIN restrictions
      if (requestingUser?.role === "ADMIN") {
        userData.role = "STUDENT";
        userData.organisation = requestingUser.organisation;
      }

      // SUPER_ADMIN can assign org
      if (requestingUser?.role === "SUPER_ADMIN") {
        userData.organisation = u.organisation;
      }

      return userData;
    });

    // Remove duplicates (email)
    const emails = preparedUsers.map((u) => u.email).filter(Boolean);

    const existingUsers = await User.find({
      email: { $in: emails },
      isDeleted: false,
    }).select("email");

    const existingEmails = new Set(existingUsers.map((u) => u.email));

    const filteredUsers = preparedUsers.filter((u) => !existingEmails.has(u.email));

    if (filteredUsers.length === 0) {
      return next(new ErrorResponse("All users already exist", 400));
    }

    const createdUsers = await User.insertMany(filteredUsers, { ordered: false });

    res.status(201).json(
      new ApiResponse(
        201,
        {
          imported: createdUsers.length,
          skipped: users.length - createdUsers.length,
          users: createdUsers,
        },
        `${createdUsers.length} user(s) imported successfully`
      )
    );
  });
}

export default UserController;