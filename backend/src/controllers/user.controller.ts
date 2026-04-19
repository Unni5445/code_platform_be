import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import User, { UserRole } from "../models/user.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";
import createJWTToken from "../utils/createJwtToken";
import sendEmail from "../utils/sendEmail";
import { Types } from "mongoose";
import StudentSubmission from "../models/studentSubmission.model";

class UserController {
  // ================= CREATE USER =================
  static createUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    const { phone } = data;

    if (phone && !/^\d{10}$/.test(phone)) {
      return next(new ErrorResponse("Invalid phone number. Must be 10 digits.", 400));
    }

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
    const statusFilter = req.query.status as string;

    const filter: any = { isDeleted: false };
    if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    if (roleFilter) filter.role = roleFilter;
    if (statusFilter === "active") filter.isActive = true;
    if (statusFilter === "inactive") filter.isActive = false;

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

    // Security: Students can only update their own profile
    if (req.user?.role === "STUDENT" && req.user._id.toString() !== id) {
      return next(new ErrorResponse("Unauthorized to update other's profile", 403));
    }

    // Sanitization: Strip sensitive fields for non-admin/super-admin updates
    if (req.user?.role === "STUDENT") {
      delete req.body.email;
      delete req.body.role;
      delete req.body.organisation;
      delete req.body.points;
      delete req.body.streak;
      delete req.body.maxStreak;
      delete req.body.isActive;
      delete req.body.isDeleted;
      delete req.body.playerClass;
      delete req.body.hasCompletedOnboarding;
    }

    // ADMIN can only update users in their own org
    if (req.user?.role === "ADMIN") {
      query.organisation = req.user.organisation;
      // Prevent ADMIN from changing role or organisation
      delete req.body.role;
      delete req.body.organisation;
    }

    const user = await User.findOne(query);
    if (!user) return next(new ErrorResponse("User not found", 404));

    if (req.body.phone && !/^\d{10}$/.test(req.body.phone)) {
      return next(new ErrorResponse("Invalid phone number. Must be 10 digits.", 400));
    }

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
    const statusFilter = req.query.status as string;
    const isAdmin = req.user?.role === "ADMIN";

    const filter: any = { isDeleted: false };
    if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    if (roleFilter) filter.role = roleFilter;
    if (statusFilter === "active") filter.isActive = true;
    if (statusFilter === "inactive") filter.isActive = false;

    // Admin can only see their org users
    if (isAdmin) filter.organisation = req?.user?.organisation;

    const users = await User.find(filter).select("-password").populate("organisation").sort({ createdAt: -1 });

    // Convert to CSV
    const headers = ["Name", "Email", "Department", "Passout Year", "Gender", "Status", "Points", "Streak", "Joined"];
    const rows = users.map(user => [
      `"${(user.name || "").replace(/"/g, '""')}"`,
      `"${(user.email || "").replace(/"/g, '""')}"`,
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
    if (phone && !/^\d{10}$/.test(phone)) {
      return next(new ErrorResponse("Invalid phone number. Must be 10 digits.", 400));
    }
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
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
      maxAge: 7 * 24 * 60 * 60 * 1000,
      // domain: ".morattucoder.com",
    });

    res.status(200).json(new ApiResponse(200, { token, _id: user._id, email: user.email, role: user.role }, "Login successful"));
  });

  // ================= COMPLETE ONBOARDING =================
  static completeOnboarding = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { playerClass, dailyGoal } = req.body;

    // allow partial updates, but must provide at least one if we want flexibility
    // in this case we'll require both for simplicity.
    if (!playerClass || !dailyGoal) {
      return next(new ErrorResponse("Both player class and daily goal are required", 400));
    }

    const User = require("../models/user.model").default;
    const user = await User.findById(req.user!._id);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    user.playerClass = playerClass;
    user.dailyGoal = dailyGoal;
    user.hasCompletedOnboarding = true;

    await user.save();

    res.status(200).json(new ApiResponse(200, user, "Onboarding completed successfully"));
  });

  static signOut = asyncHandler(async (_req: Request, res: Response) => {
    // Clear the token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      // domain: ".morattucoder.com",
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

  // ================= GET STUDENT DASHBOARD STATS =================
  static getStudentStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json(new ApiResponse(404, {}, "User not found"));

    const totalXp = user.points || 0;

    const higherRankedUsers = await User.countDocuments({
      role: "STUDENT",
      isDeleted: false,
      points: { $gt: totalXp },
    });
    const globalRank = higherRankedUsers + 1;

    const submissions = await StudentSubmission.find({ student: userId, isDeleted: false });

    // Problems solved = unique questions with score > 0
    const solvedQuestionIds = new Set(
      submissions.filter((s) => s.score > 0).map((s) => s.question.toString())
    );
    const problemsSolved = solvedQuestionIds.size;

    // Acceptance = attempts with positive score / total attempts
    const successfulSubmissions = submissions.filter((s) => s.score > 0).length;
    const totalSubmissions = submissions.length;
    const acceptance = totalSubmissions > 0 ? Math.round((successfulSubmissions / totalSubmissions) * 100) : 0;

    res.status(200).json(
      new ApiResponse(200, {
        problemsSolved,
        totalXp,
        globalRank,
        acceptance,
      }, "Student dashboard stats fetched")
    );
  });

  // ================= CLAIM XP =================
  static claimXp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { amount, questId } = req.body;
    if (!amount || amount <= 0 || !questId) {
      return res.status(400).json(new ApiResponse(400, {}, "Invalid claim data"));
    }

    const userId = req.user!._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json(new ApiResponse(404, {}, "User not found"));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already claimed today
    const alreadyClaimed = user.claimedQuests.some(
      (q) => q.questId === questId && new Date(q.date).toDateString() === today.toDateString()
    );

    if (alreadyClaimed) {
      return next(new ErrorResponse("Quest already claimed today", 400));
    }

    // Record claim and add points
    user.claimedQuests.push({ questId, date: today });
    user.points = (user.points || 0) + amount;
    await user.save();

    res.status(200).json(new ApiResponse(200, user, `Claimed ${amount} XP`));
  });

  // ================= UNLOCK HINT =================
  static unlockHint = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { questionId, hintIndex, xpCost } = req.body;

    if (!questionId || hintIndex === undefined || xpCost === undefined) {
      return next(new ErrorResponse("Question ID, hint index, and XP cost are required", 400));
    }

    const userId = req.user!._id;
    const user = await User.findById(userId);
    if (!user) return next(new ErrorResponse("User not found", 404));

    // 1. Check if already unlocked
    const isAlreadyUnlocked = user.unlockedHints.some(
      (h) => h.questionId.toString() === questionId && h.hintIndex === hintIndex
    );

    if (isAlreadyUnlocked) {
      return res.status(200).json(new ApiResponse(200, user, "Hint already unlocked"));
    }

    // 2. Check if enough XP
    if (user.points < xpCost) {
      return next(new ErrorResponse(`Insufficient XP. Need ${xpCost} XP.`, 400));
    }

    // 3. Deduct XP and record unlock
    user.points -= xpCost;
    user.unlockedHints.push({ questionId: questionId as any, hintIndex });
    await user.save();

    res.status(200).json(new ApiResponse(200, user, "Hint unlocked successfully"));
  });

  // ================= GET DAILY QUESTS =================
  static getDailyQuests = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json(new ApiResponse(404, {}, "User not found"));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const submissionsToday = await StudentSubmission.find({
      student: userId,
      isDeleted: false,
      attemptedAt: { $gte: startOfToday }
    });

    const solvedQuestionsToday = new Set(
      submissionsToday.filter(s => s.score > 0).map(s => s.question.toString())
    );
    const totalSolvedToday = solvedQuestionsToday.size;

    const hasAnyPerfectSubmissionToday = submissionsToday.some(
      s => s.score > 0 && s.score === s.maxScore
    );

    const dailyGoal = user.dailyGoal || 3;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const claimedTodayIds = user.claimedQuests
      .filter((q) => new Date(q.date).toDateString() === today.toDateString())
      .map((q) => q.questId);

    const quests = [
      {
        id: 1,
        title: "Log In",
        desc: "Checking in to train.",
        xp: 20,
        completed: true,
        claimed: claimedTodayIds.includes(1),
        iconName: "Flame",
      },
      {
        id: 2,
        title: "Daily Goal",
        desc: `Solve ${dailyGoal} problems today.`,
        xp: 150,
        completed: totalSolvedToday >= dailyGoal,
        claimed: claimedTodayIds.includes(2),
        iconName: "Target",
      },
      {
        id: 3,
        title: "First Blood",
        desc: "Pass all test cases on a problem today.",
        xp: 50,
        completed: hasAnyPerfectSubmissionToday,
        claimed: claimedTodayIds.includes(3),
        iconName: "CheckCircle2",
      },
    ];

    res.status(200).json(new ApiResponse(200, quests, "Daily quests fetched"));
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

      // Final validation before pushing to preparedUsers (optional but good for debugging)
      if (userData.phone && !/^\d{10}$/.test(userData.phone)) {
        userData.phone = undefined; // Drop invalid phone numbers in bulk import or handle as error
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

  // ================= ADMIN RESET PASSWORD =================
  static adminResetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Security check: Only SUPER_ADMIN can reset passwords
    if (req.user?.role !== "SUPER_ADMIN") {
      return next(new ErrorResponse("Only Super Admin can reset user passwords", 403));
    }

    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) return next(new ErrorResponse("User not found", 404));

    // Generate 8-character temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    user.password = tempPassword;
    await user.save();

    await sendEmail(
      user.email as string,
      "Password Reset - Skill & Brains",
      `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 16px;">
        <h2 style="color: #1f2937; margin-bottom: 16px;">Password Reset by Admin</h2>
        <p style="color: #4b5563;">An administrator has reset your password. Use the temporary password below to log in.</p>
        <div style="background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Temporary Password</p>
          <span style="font-size: 24px; font-weight: bold; color: #7c3aed; font-family: monospace;">${tempPassword}</span>
        </div>
        <p style="color: #ef4444; font-size: 14px; font-weight: 500;">Please change your password immediately after logging in for security.</p>
        <div style="margin-top: 32px; padding-top: 24px; border-t: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px;">If you did not expect this change, please contact support immediately.</p>
        </div>
      </div>`
    );

    res.status(200).json(new ApiResponse(200, {}, "Password reset successfully and email sent"));
  });
}

export default UserController;
