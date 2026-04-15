import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthenticatedRequest, UserRole } from "../types/index.js";
import { ApiError } from "./errors.js";

export function requireAuth(allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new ApiError(401, "Missing bearer token.");
    }

    try {
      const token = header.slice(7);
      const payload = jwt.verify(token, env.jwtSecret) as AuthenticatedRequest["user"];

      if (!allowedRoles.includes(payload.role)) {
        throw new ApiError(403, "Insufficient permissions.");
      }

      (req as AuthenticatedRequest).user = payload;
      next();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(401, "Invalid or expired token.");
    }
  };
}
