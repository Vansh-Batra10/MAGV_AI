import "server-only";
import { q } from "./db";
import { newId } from "@/lib/ids";

export const NOTICE_VERSION = "2026-11-v1";

export async function recordConsent(subjectType: "buyer" | "contributor" | "recipient", subjectRef: string, purpose: string, granted: boolean) {
  await q(`insert into consents (id, subject_type, subject_ref, purpose, notice_version, granted) values ($1,$2,$3,$4,$5,$6)`, [newId(), subjectType, subjectRef, purpose, NOTICE_VERSION, granted]);
}
