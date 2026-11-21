import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { PublicNameForm } from "./PublicNameForm";

export const dynamic = "force-dynamic";

/** Public link mode: a generic link that asks "Aapka naam?" and shows only functions marked public. */
export default async function PublicInvite({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = await params;
  const w = store().weddingByCode(inviteCode);
  if (!w || w.status !== "published" || !w.content.events.some((e) => e.isPublic)) notFound();
  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: 24, background: "#1C1A22", color: "#FAF8F4" }}>
      <div style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
        <p style={{ opacity: 0.8 }}>{w.content.bride.name} &amp; {w.content.groom.name}</p>
        <PublicNameForm inviteCode={inviteCode} />
      </div>
    </main>
  );
}
