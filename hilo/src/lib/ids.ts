import { customAlphabet } from "nanoid";

const URLSAFE = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export const newId = customAlphabet(URLSAFE, 16);
/** Gift slugs: 14 chars from a 58-char alphabet ≈ 82 bits. Unguessable. */
export const newSlug = customAlphabet(URLSAFE, 14);
export const newToken = customAlphabet(URLSAFE, 20);
export const newCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);
