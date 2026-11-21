import { describe, expect, it } from "vitest";
import { inviteMessage, normalizePhone, parseCsv, parsePaste, waLink } from "./messages";
import { toCsv } from "./dashboard";

describe("send helpers", () => {
  it("parses a pasted list", () => {
    expect(parsePaste("Sharma Parivar, 98100 12345\nRiya\t+447700900123\nNani")).toEqual([
      { salutation: "Sharma Parivar", phone: "+919810012345" }, { salutation: "Riya", phone: "+447700900123" }, { salutation: "Nani" }]);
  });
  it("normalises phones", () => { expect(normalizePhone("919810012345")).toBe("+919810012345"); expect(normalizePhone("123")).toBeUndefined(); });
  it("parses quoted CSV", () => { expect(parseCsv('name,phone\n"Mehta, Uncle",9810012345\r\n')).toEqual([["name", "phone"], ["Mehta, Uncle", "9810012345"]]); });
  it("builds wa.me links with the link on its own line", () => {
    const m = inviteMessage({ locale: "hinglish", tone: "playful", salutation: "Riya", names: "Ananya & Rohan", link: "https://x.example/demo/abc" });
    expect(m.split("\n").at(-1)).toBe("https://x.example/demo/abc");
    expect(waLink("+919810012345", m)).toMatch(/^https:\/\/wa\.me\/919810012345\?text=Arre%20Riya/);
  });
  it("CSV export neutralises formulas", () => { expect(toCsv([["=1+1", "a,b"]])).toBe("﻿'=1+1,\"a,b\""); });
});
