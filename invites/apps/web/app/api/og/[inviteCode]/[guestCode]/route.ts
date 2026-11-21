import { store } from "@/lib/store";
import { renderViaWorker } from "@/lib/worker";

/** Per-guest Open Graph image, rendered by the worker with headless Chromium (correct Indic shaping), cached per guest version. */
export async function GET(_req: Request, { params }: { params: Promise<{ inviteCode: string; guestCode: string }> }) {
  const { inviteCode, guestCode } = await params;
  if (!store().guestBundle(inviteCode, guestCode)) return new Response("not found", { status: 404 });
  return renderViaWorker({ kind: "og", inviteCode, guest: guestCode }, 45_000);
}
