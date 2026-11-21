import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { Admin } from "./Admin";
import "../studio/studio.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminPage() {
  if (!(await requireAdmin())) redirect("/login?next=/admin");
  return <div className="st"><Admin /></div>;
}
