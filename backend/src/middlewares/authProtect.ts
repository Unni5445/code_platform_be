import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";
import ErrorResponse from "../utils/errorResponse";
import asyncHandler from "../utils/asyncHandler";
import { UserRole } from "../models/user.model";

interface DecodedToken {
  id: string;
  role: UserRole;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// ================= AUTH PROTECT =================
export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new ErrorResponse("Unauthorized access", 401));
    }

    let decoded: DecodedToken;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_TOKEN_SECRET as string
      ) as DecodedToken;
    } catch (error) {
      return next(new ErrorResponse("Invalid or expired token", 401));
    }

    const user = await User.findOne({
      _id: decoded.id,
      isDeleted: false,
    }).select("-password");

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    req.user = user;
    next();
  }
);

// ================= ROLE BASED ACCESS =================
export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ErrorResponse("Unauthorized access", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse("You do not have permission to access this resource", 403)
      );
    }

    next();
  };
