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
      const { _id, email, name, role, points, streak, maxStreak, organisation, batch, enrolledCourses, isActive, isDeleted, createdAt, updatedAt } = req.user!;

      res.json(
        new ApiResponse(200, {
          _id,
          email,
          name,
          role,
          points,
          streak,
          maxStreak,
          organisation,
          batch,
          enrolledCourses,
          isActive,
          isDeleted,
          createdAt,
          updatedAt,
        })
      );
    }
  );

  // ================= GET USER STREAK DATA =================
  static getUserStreakData = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const user = await User.findOne({ _id: id, isDeleted: false }).select(
        "streak maxStreak activityLog"
      );

      if (!user) {
        return next(new ErrorResponse("User not found", 404));
      }

      res.status(200).json(
        new ApiResponse(
          200,
          {
            currentStreak: user.streak,
            maxStreak: user.maxStreak,
            activityLog: user.activityLog,
          },
          "Streak data retrieved successfully"
        )
      );
    }
  );

  // ================= UPDATE USER ACTIVITY =================
  static updateUserActivity = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { date, count } = req.body;

      if (!date || typeof count !== "number") {
        return next(new ErrorResponse("Invalid activity data", 400));
      }

      const user = await User.findOne({ _id: id, isDeleted: false });

      if (!user) {
        return next(new ErrorResponse("User not found", 404));
      }

      const activityDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      activityDate.setHours(0, 0, 0, 0);

      // Find existing activity log entry for the date
      const existingEntryIndex = user.activityLog.findIndex(
        (entry) => {
          const entryDate = new Date(entry.date);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === activityDate.getTime();
        }
      );

      if (existingEntryIndex >= 0) {
        // Update existing entry
        user.activityLog[existingEntryIndex].count += count;
      } else {
        // Add new entry
        user.activityLog.push({ date: activityDate, count });
      }

      // Calculate streak
      await this.calculateStreak(user);

      await user.save();

      res.status(200).json(
        new ApiResponse(
          200,
          {
            currentStreak: user.streak,
            maxStreak: user.maxStreak,
            activityLog: user.activityLog,
          },
          "Activity updated successfully"
        )
      );
    }
  );

  // ================= GET USER ACTIVITY LOG =================
  static getUserActivityLog = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const user = await User.findOne({ _id: id, isDeleted: false }).select(
        "activityLog"
      );

      if (!user) {
        return next(new ErrorResponse("User not found", 404));
      }

      let filteredActivity = user.activityLog;

      if (startDate || endDate) {
        const start = startDate ? new Date(startDate as string) : new Date(0);
        const end = endDate ? new Date(endDate as string) : new Date();

        filteredActivity = user.activityLog.filter((entry) => {
          const entryDate = new Date(entry.date);
          return entryDate >= start && entryDate <= end;
        });
      }

      // Format activity log for frontend
      const formattedActivity = filteredActivity.map((entry) => ({
        date: new Date(entry.date).toISOString().split("T")[0],
        count: entry.count,
      }));

      res.status(200).json(
        new ApiResponse(
          200,
          formattedActivity,
          "Activity log retrieved successfully"
        )
      );
    }
  );

  // ================= CALCULATE STREAK (HELPER) =================
  private static calculateStreak = async (user: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort activity log by date (descending)
    const sortedActivities = [...user.activityLog].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Find the most recent activity date
    const mostRecentActivity = sortedActivities[0];
    if (!mostRecentActivity) {
      user.streak = 0;
      return;
    }

    const mostRecentDate = new Date(mostRecentActivity.date);
    mostRecentDate.setHours(0, 0, 0, 0);

    // Calculate days difference
    const daysDiff = Math.floor(
      (today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If the most recent activity was yesterday or today, start counting streak
    if (daysDiff <= 1) {
      let streak = 1;
      let currentDate = new Date(mostRecentDate);

      for (let i = 1; i < sortedActivities.length; i++) {
        const prevDate = new Date(currentDate);
        prevDate.setDate(prevDate.getDate() - 1);
        prevDate.setHours(0, 0, 0, 0);

        const hasActivity = sortedActivities.some((entry) => {
          const entryDate = new Date(entry.date);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === prevDate.getTime();
        });

        if (hasActivity) {
          streak++;
          currentDate = prevDate;
        } else {
          break;
        }
      }

      user.streak = streak;

      // Update max streak if current streak is higher
      if (streak > user.maxStreak) {
        user.maxStreak = streak;
      }
    } else {
      // Streak broken
      user.streak = 0;
    }
  };
}

export default UserController;
