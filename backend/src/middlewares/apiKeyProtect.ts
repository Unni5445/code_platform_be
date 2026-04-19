import { Request, Response, NextFunction } from "express";
import ErrorResponse from "../utils/errorResponse";

export const apiKeyProtect = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"];

  // Skip API key protection for public certificate verification
  if (req.path.includes("/certificates/verify/")) {
    return next();
  }

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return next(new ErrorResponse("Invalid or missing API key", 403));
  }

  next();
};
