import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../config/db.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../middleware/errors.js";
import type { AuthUser, UserRole } from "../../types/index.js";

export async function loginUser(
  username: string,
  password: string
): Promise<{ token: string; user: Omit<AuthUser, "role"> & { role: string } }> {
  const { rows } = await pool.query(
    "SELECT id, username, password_hash, role FROM app_user WHERE username = $1",
    [username]
  );
  const row = rows[0];
  if (!row) throw new ApiError(401, "Invalid credentials.");

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) throw new ApiError(401, "Invalid credentials.");

  const payload: AuthUser = {
    id: row.id,
    username: row.username,
    role: row.role as UserRole,
  };

  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: "8h" });

  return { token, user: { id: row.id, username: row.username, role: row.role } };
}
