import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import User, { UserRole } from "../models/user.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";
import createJWTToken from "../utils/createJwtToken";
import { Types } from "mongoose";

class UserController {
  // ================= CREATE USER =================
  static createUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;

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
    const users = await User.find(filter).select("-password").populate("college organisation").sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalUsers = await User.countDocuments(filter);

    res.status(200).json(new ApiResponse(200, { users, currentPage: page, totalPages: Math.ceil(totalUsers / limit), totalUsers }, "Users retrieved successfully"));
  });

  // ================= UPDATE USER =================
  static updateUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) return next(new ErrorResponse("User not found", 404));

    Object.assign(user, req.body);
    await user.save();
    res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
  });

  // ================= DELETE USER (SOFT) =================
  static deleteUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) return next(new ErrorResponse("User not found", 404));

    user.isDeleted = true;
    await user.save();
    res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));
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
    });

    res.status(200).json(new ApiResponse(200, { token, _id: user._id, email: user.email, role: user.role }, "Login successful"));
  });

  static signOut = asyncHandler(async (_req: Request, res: Response) => {
    // Clear the token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json(new ApiResponse(200, {}, "Logout successful"));
  });

  // ================= GET USER FROM TOKEN =================
  static getUserByToken = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    res.json(new ApiResponse(200, {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      points: user.points,
      streak: user.streak,
      maxStreak: user.maxStreak,
      organisation: user.organisation,
      batch: user.batch,
      enrolledCourses: user.enrolledCourses,
      isActive: user.isActive,
      isDeleted: user.isDeleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  });
}

export default UserController;