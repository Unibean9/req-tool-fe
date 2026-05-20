import { Inter, Roboto_Condensed, Rubik } from "next/font/google";

/** Body — Inter variable (opsz, wght). */
export const fontInter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

/** Tiêu đề trang / dialog — Roboto Condensed variable (wght). */
export const fontRobotoCondensed = Roboto_Condensed({
  subsets: ["latin", "latin-ext"],
  variable: "--font-roboto-condensed",
  display: "swap",
});

/** Brand & display — Rubik variable (wght 300..900). */
export const fontRubik = Rubik({
  subsets: ["latin", "latin-ext"],
  variable: "--font-rubik",
  display: "swap",
});

export const rootFontVariables = `${fontInter.variable} ${fontRobotoCondensed.variable} ${fontRubik.variable}`;
