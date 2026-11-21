import { notFound } from "next/navigation";
import { Playground } from "./Playground";

export const metadata = { title: "Playground", robots: { index: false } };

export default function Page() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_PLAYGROUND !== "true") notFound();
  return <Playground />;
}
