import { join } from "node:path";
import { currentUser } from "./auth";

export async function requireAdmin() {
  const u = await currentUser();
  return u?.role === "admin" ? u : null;
}

export async function assets() {
  process.env.ASSET_DIR ??= join(process.cwd(), ".data", "assets");
  return import("@invites/ai-assets");
}
