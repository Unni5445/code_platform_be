import type { NextFunction, Request, Response } from "express";
import ApiResponse from "../utils/ApiResponse";

export const pageNotFound = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new ApiResponse(404,{},`page not found-${req.originalUrl}`);
  next(error);
};
