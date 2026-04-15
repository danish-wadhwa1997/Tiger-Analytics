import type { Request } from "express";

export type UserRole = "admin" | "editor" | "viewer";

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
