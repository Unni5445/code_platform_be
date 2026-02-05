import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import User from "../models/user.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";
import createJWTToken from "../utils/createJwtToken";
import { UserRole } from "../models/user.model";

class UserController {
  // ================= CREATE USER =================
  static createUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const data = req.body;

      const existingUser = await User.findOne({
        email: data.email,
        isDeleted: false,
      });

      if (existingUser) {
        return next(new ErrorResponse("User already exists", 400));
      }

      const user = await User.create(data);

      res
        .status(201)
        .json(new ApiResponse(201, user, "User created successfully"));
    }
  );

  // ================= GET USER BY ID =================
  static getUserById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const user = await User.findOne({ _id: id, isDeleted: false }).select(
        "-password"
      );

      if (!user) {
        return next(new ErrorResponse("User not found", 404));
      }

      res
        .status(200)
        .json(new ApiResponse(200, user, "User fetched successfully"));
    }
  );

  // ================= GET ALL USERS =================
  static getAllUsers = asyncHandler(
    async (req: Request, res: Response) => {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 100);
      const search = req.query.search as string;

      const filter: any = { isDeleted: false };

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const skip = (page - 1) * limit;

      const users = await User.find(filter)
        .populate('college organisation')
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalUsers = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalUsers / limit);

      res.status(200).json(
        new ApiResponse(
          200,
          {
            users,
            currentPage: page,
            totalPages,
            totalUsers,
          },
          "Users retrieved successfully"
        )
      );
    }
  );

  // ================= GET USERS BY ROLE =================
  static getAllUsersByRole = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { role } = req.params;

      if (!["STUDENT", "ADMIN", "SUPER_ADMIN"].includes(role)) {
        return next(new ErrorResponse("Invalid user role", 400));
      }

      const users = await User.find({
        role: role as UserRole,
        isDeleted: false,
      }).select("-password").populate('college organisation');

      res.status(200).json(
        new ApiResponse(
          200,
          users,
          `Users with role ${role} retrieved successfully`
        )
      );
    }
  );

  // ================= UPDATE USER =================
  static updateUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const user = await User.findOne({ _id: id, isDeleted: false });

      if (!user) {
        return next(new ErrorResponse("User not found", 404));
      }

      Object.assign(user, req.body);
      await user.save();

      res
        .status(200)
        .json(new ApiResponse(200, user, "User updated successfully"));
    }
  );

  // ================= DELETE USER (SOFT) =================
  static deleteUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const user = await User.findOne({ _id: id, isDeleted: false });

      if (!user) {
        return next(new ErrorResponse("User not found", 404));
      }

      user.isDeleted = true;
      await user.save();

      res
        .status(200)
        .json(new ApiResponse(200, {}, "User deleted successfully"));
    }
  );

  // ================= DROPDOWN USERS =================
  static getUsersForDropdown = asyncHandler(
    async (_req: Request, res: Response) => {
      const users = await User.find({ isDeleted: false }).select("_id name");

      res.status(200).json(
        new ApiResponse(200, users, "Users retrieved successfully")
      );
    }
  );

  // ================= SIGN IN (ALL ROLES) =================
  static signinUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorResponse("Please provide valid credentials", 400));
      }

      const user = await User.findOne({
        email,
        isDeleted: false,
      }).select("+password");

      if (!user) {
        return next(new ErrorResponse("Invalid email or password", 400));
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return next(new ErrorResponse("Invalid email or password", 400));
      }

      const token = createJWTToken(user?._id!.toString(), user.role);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(200).json(
        new ApiResponse(
          200,
          {
            token,
            _id: user._id,
            email: user.email,
            role: user.role,
          },
          "Login successful"
        )
      );
    }
  );

  // ================= SIGN OUT =================
  static signOut = asyncHandler(
    async (_req: Request, res: Response) => {
      res
        .clearCookie("token")
        .status(200)
        .json(new ApiResponse(200, {}, "Logout successful"));
    }
  );

  // ================= GET USER FROM TOKEN =================
  static getUserByToken = asyncHandler(
    async (req: Request, res: Response) => {
      const { _id, email, name, role } = req.user!;

      res.json(
        new ApiResponse(200, {
          _id,
          email,
          name,
          role,
        })
      );
    }
  );
}

export default UserController;
