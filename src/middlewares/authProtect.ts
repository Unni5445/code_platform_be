import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import ErrorResponse from "../utils/errorResponse";
import asyncHandler from "../utils/asyncHandler";
import Student from "../models/student.model";

interface DecodedToken {
  id: string;
  role: "super-admin" | "admin" | "employee";
  iat: number;
  exp: number;
}

declare global {
    namespace Express {
      interface Request {
        user: any; 
        student: any;
      }
    }
}

const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return next(
        new ErrorResponse("Unauthorized Access", 401)
      );
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_TOKEN_SECRET as string
    ) as DecodedToken;

    const employee = await User.findById(decoded.id).select("-password");

    if (!employee) {
      return next(new ErrorResponse("No employee found with this ID", 404));
    }

    req.user = employee;

    next();
  }
);

const studentProtect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return next(
        new ErrorResponse("Unauthorized Access", 401)
      );
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_TOKEN_SECRET as string
    ) as DecodedToken;

    const employee = await Student.findById(decoded.id).select("-password");

    if (!employee) {
      return next(new ErrorResponse("No employee found with this ID", 404));
    }

    req.student = employee;

    next();
  }
);


export { protect,studentProtect };
