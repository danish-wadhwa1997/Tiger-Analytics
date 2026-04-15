import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./errors.js";

interface BucketEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketEntry>();

export function rateLimit(windowMs: number, maxHits: number) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = buckets.get(key);

    if (!entry || now > entry.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    entry.count += 1;
    if (entry.count > maxHits) {
      throw new ApiError(429, "Too many requests. Please try again later.");
    }
    next();
  };
}
