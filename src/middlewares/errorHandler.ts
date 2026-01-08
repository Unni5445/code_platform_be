import { Request, Response, NextFunction } from "express";
import ErrorResponse from "../utils/errorResponse";
import ApiResponse from "../utils/ApiResponse";

const errorHandler = (err: ErrorResponse, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  error.statusCode = err.statusCode || 500;

  // console.error(err);

  res.status(error.statusCode).json(new ApiResponse(error.statusCode,null, error.message || "Server Error"));
};

export default errorHandler;
