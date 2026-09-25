import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { sendError } from "../utils/response.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

import { prisma } from "../config/db.js";

let cachedGuestUser: { id: string; email: string } | null = null;

async function getOrCreateGuestUser() {
  if (cachedGuestUser) return cachedGuestUser;

  let guest = await prisma.user.findUnique({
    where: { email: "guest@timeforge.local" },
  });

  if (!guest) {
    guest = await prisma.user.create({
      data: {
        email: "guest@timeforge.local",
        password: "guestpassword123",
        name: "Student",
      },
    });
  }

  cachedGuestUser = { id: guest.id, email: guest.email };
  return cachedGuestUser;
}

export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, env.JWT_SECRET, async (err, user) => {
      if (!err && user) {
        req.user = user as { id: string; email: string };
        return next();
      }
      try {
        req.user = await getOrCreateGuestUser();
        next();
      } catch (e) {
        sendError(res, "Failed to authenticate guest", 500);
      }
    });
  } else {
    try {
      req.user = await getOrCreateGuestUser();
      next();
    } catch (e) {
      sendError(res, "Failed to authenticate guest", 500);
    }
  }
};
