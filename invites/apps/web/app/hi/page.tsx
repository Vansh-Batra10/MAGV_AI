import { brand } from "@invites/config";
import { Home } from "@/components/marketing/Home";
export const metadata = { title: { absolute: `${brand.name}: सिनेमाई शादी के निमंत्रण` }, description: "भारतीय परिवारों के लिए एनिमेटेड शादी का निमंत्रण। WhatsApp पर निजी लिंक, हर कार्यक्रम का उत्तर, UPI से शगुन।", alternates: { languages: { en: "/" } } };
export default function Page() { return <Home lang="hi" />; }
