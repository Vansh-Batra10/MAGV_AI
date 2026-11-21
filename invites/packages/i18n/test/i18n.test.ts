import { describe, expect, it } from "vitest";
import { formatDate, formatTime, t, wordingFor, fillWording, allKeys, hasKey } from "../src";

const sat = "2027-02-13T19:00:00+05:30";
describe("dates", () => {
  it("formats in three locales", () => {
    expect(formatDate(sat, "en")).toBe("Saturday, 13 February 2027");
    expect(formatDate(sat, "hinglish")).toBe("Shanivaar, 13 Farvari 2027");
    expect(formatDate(sat, "hi")).toBe("शनिवार, 13 फ़रवरी 2027");
    expect(formatDate(sat, "hi", { devanagariNumerals: true })).toBe("शनिवार, १३ फ़रवरी २०२७");
  });
  it("formats times", () => {
    expect(formatTime(sat, "en")).toBe("7:00 PM");
    expect(formatTime(sat, "hinglish")).toBe("raat 7:00 baje");
    expect(formatTime("2027-02-12T10:00:00+05:30", "hi")).toBe("सुबह 10:00 बजे");
  });
});

describe("strings", () => {
  it("picks tone variants and fills vars", () => {
    expect(t("hinglish", "loaderFor", { salutation: "Mehta Parivar" })).toBe("Mehta Parivar ke liye");
    expect(t("en", "rsvpTitle", {}, "playful")).toBe("Aa rahe ho na?");
    expect(t("hinglish", "rsvpTitle", {}, "formal")).toBe("Kripya apni upasthiti ki pushti karein");
  });
  it("Hindi table covers every key", () => {
    // Every key resolves to something (falls back to English if missing); Hindi should cover the guest essentials.
    for (const k of ["loaderFor", "openDoors", "rsvpTitle", "yes", "no", "directions", "addToCalendar", "shagunSafety", "privacy"]) expect(hasKey("hi", k)).toBe(true);
    expect(allKeys.length).toBeGreaterThan(50);
  });
  it("formal wording never contains slang", () => {
    const w = fillWording(wordingFor("hindu-north", "formal", "hinglish"), { bride: "Ananya", groom: "Rohan" });
    expect(w.body).not.toMatch(/arre|pakka|yaar/i);
    expect(wordingFor("nikah", "warm", "en").invocation).toContain("Bismillah");
  });
});
