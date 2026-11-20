import { Instrument_Serif, Manrope, Kalam, Tiro_Devanagari_Hindi } from "next/font/google";

export const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });
export const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-manrope", display: "swap" });
export const kalam = Kalam({ subsets: ["latin", "devanagari"], weight: ["300", "400", "700"], variable: "--font-kalam", display: "swap" });
export const tiro = Tiro_Devanagari_Hindi({ subsets: ["devanagari", "latin"], weight: "400", style: ["normal", "italic"], variable: "--font-tiro", display: "swap", preload: false });

export const fontVars = [instrument.variable, manrope.variable, kalam.variable, tiro.variable].join(" ");
