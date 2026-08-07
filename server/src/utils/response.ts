import { Response } from "express";

export const sendSuccess = (res: Response, data: any, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
  });
};

export const sendError = (res: Response, message: string, status = 500, errors?: any) => {
  return res.status(status).json({
    success: false,
    error: message,
    errors,
  });
};
