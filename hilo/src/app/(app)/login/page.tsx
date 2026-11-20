import { AppChrome } from "@/components/layout/AppChrome";
import { Login } from "@/components/dashboard/Login";

export const metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = (await searchParams).next ?? "/dashboard";
  return <AppChrome><Login next={next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"} /></AppChrome>;
}
