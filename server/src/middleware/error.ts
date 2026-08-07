import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import { sendError } from "../utils/response.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${err.message} \nStack: ${err.stack}`);

  if (err.code === "P2002") {
    return sendError(res, "Conflict: Database unique constraint failed", 409, err.meta);
  }

  const status = err.statusCode || 500;
  const message = err.message || "An unexpected error occurred on the server";
  
  return sendError(res, message, status, process.env.NODE_ENV === "development" ? err.stack : undefined);
};
