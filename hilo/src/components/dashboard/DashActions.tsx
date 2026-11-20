"use client";
import { useRouter } from "next/navigation";

export function DashActions({ giftId, slug, template, isDraft, isGroup, labels }: { giftId: string; slug: string | null; template: string; isDraft: boolean; isGroup: boolean; labels: Record<string, string> }) {
  const router = useRouter();
  const a = "inline-flex h-9 items-center rounded-full bg-white/[0.06] px-3 text-xs font-semibold text-hi hover:bg-white/10";
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {isDraft ? <a className={a} href={`/create/${template}?gift=${giftId}`}>{labels.cont}</a> : <>
        {slug && <a className={a} href={`/g/${slug}`} target="_blank">{labels.open}</a>}
        <a className={a} href={`/success/${giftId}`}>{labels.manage}</a>
        <a className={a} href={`/create/${template}?gift=${giftId}&mode=form`}>{labels.edit}</a>
      </>}
      {isGroup && <a className={a} href={`/group/${giftId}/manage`}>👥</a>}
      <button type="button" className={`${a} text-rose-300`} onClick={async () => {
        if (!confirm(labels.confirm)) return;
        await fetch(`/api/gifts/${giftId}`, { method: "DELETE" });
        router.refresh();
      }}>{labels.del}</button>
    </div>
  );
}

export function AccountActions({ labels }: { labels: Record<string, string> }) {
  const router = useRouter();
  return (
    <div className="mt-20 flex flex-wrap gap-4 border-t border-white/6 pt-6 text-sm">
      <button type="button" className="text-mid hover:text-hi" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); }}>{labels.signOut}</button>
      <button type="button" className="text-rose-300/80 hover:text-rose-300" onClick={async () => {
        if (!confirm(labels.confirm)) return;
        await fetch("/api/account", { method: "DELETE" });
        router.push("/");
      }}>{labels.del}</button>
    </div>
  );
}
