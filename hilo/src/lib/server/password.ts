import "server-only";
import bcrypt from "bcryptjs";

// bcryptjs instead of argon2: pure JS, no native build on serverless. See DECISIONS.md.
export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const checkPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);
