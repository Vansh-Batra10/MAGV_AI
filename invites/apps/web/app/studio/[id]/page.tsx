import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { Editor } from "./Editor";

export const dynamic = "force-dynamic";

export default async function WeddingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await currentUser();
  if (!u) redirect(`/login?next=/studio/${id}`);
  try { store().wedding(u.id, id); } catch { notFound(); }
  return <Editor id={id} />;
}
