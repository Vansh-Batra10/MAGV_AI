import { brand } from "@invites/config";
import { Home } from "@/components/marketing/Home";
export const metadata = { title: { absolute: `${brand.name}: cinematic Indian wedding invitations` }, description: "Animated wedding invitation websites for Indian families. Personal links on WhatsApp, RSVP per function, shagun by UPI.", alternates: { languages: { hi: "/hi" } } };
export default function Page() { return <Home lang="en" />; }
