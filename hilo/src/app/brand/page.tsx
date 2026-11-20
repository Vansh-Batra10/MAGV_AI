import { requireAdmin } from "@/lib/server/admin";
import { AppChrome } from "@/components/layout/AppChrome";
import { LogoMark, Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { ThreadDivider } from "@/components/ui/Thread";
import { CoverGenerator } from "@/components/admin/CoverGenerator";
import { Moon, Envelope, WaxSeal, Lantern, Candle, Cake, Ornament, Rose, Teddy, ChaiCup, SnowGlobeArt, Diya, GlobeOutline } from "@/components/art";

export const metadata = { title: "Brand kit", robots: { index: false } };

const COLORS: [string, string][] = [["ink-950", "#0B0714"], ["ink-900", "#120B20"], ["plum-900", "#1A0F2E"], ["plum-700", "#3B1F5C"], ["plum-500", "#6B3FA0"], ["lavender-300", "#C9B6FF"], ["rose-500", "#FF4D7E"], ["rose-400", "#FF7A9C"], ["coral-400", "#FF8A65"], ["amber-300", "#FFC870"], ["blush-100", "#FFE4EC"], ["cream-50", "#FFF8EF"], ["paper-200", "#F3E6D3"], ["ink-text", "#2A1E1A"]];

export default async function Brand() {
  await requireAdmin({ devOpen: true });
  const h = "font-display text-[34px] text-hi mt-14 mb-5";
  return (
    <AppChrome>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-6"><LogoMark size={120} /><h1 className="font-display text-[64px] text-hi">Brand kit</h1></div>
        <h2 className={h}>Colour tokens</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {COLORS.map(([n, c]) => <div key={n} className="glass overflow-hidden"><div className="h-20" style={{ background: c }} /><p className="p-2 text-xs text-mid">{n}<br /><span className="font-mono text-lo">{c}</span></p></div>)}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {["--grad-kiss", "--grad-aurora", "--grad-paper"].map((g) => <div key={g} className="h-20 rounded-2xl" style={{ background: `var(${g})` }}><span className="p-2 text-xs text-white/70">{g}</span></div>)}
        </div>
        <h2 className={h}>Type</h2>
        <p className="font-display text-[64px] leading-none text-hi">Kuch baatein <em className="text-kiss">text</em> mein nahi aati.</p>
        <p className="mt-3 text-lg text-mid">Manrope — UI & body. The quick brown fox jumps over the lazy dog.</p>
        <p className="mt-3 font-hand text-3xl text-hi">Kalam — letters & handwriting. तुम्हारी याद आती है।</p>
        <p className="mt-3 font-deva text-3xl text-hi">Tiro Devanagari — कुछ बातें टेक्स्ट में नहीं आतीं।</p>
        <h2 className={h}>Logo</h2>
        <div className="flex flex-wrap items-center gap-10"><Logo /><LogoMark size={80} /><a href="/icon-512.png" download className="text-sm text-mid underline">Download PNG</a></div>
        <h2 className={h}>Components</h2>
        <div className="flex flex-wrap items-center gap-3"><Button>Gift banao</Button><Button variant="glass">Group</Button><Button variant="paper">Paper</Button><Chip selected>Cute</Chip><Chip>Emotional</Chip></div>
        <ThreadDivider className="my-10" />
        <div className="grid items-start gap-8 md:grid-cols-[300px_1fr]">
          <PhoneFrame><div className="grid h-full place-items-center [background:var(--grad-aurora)]"><p className="font-display text-4xl text-hi">9:16</p></div></PhoneFrame>
          <div className="glass grid grid-cols-3 gap-6 p-6 sm:grid-cols-5">
            <Moon /><Envelope size={110} /><WaxSeal /><Lantern /><Candle size={40} /><Cake size={110} name="Zoya" /><Ornament /><Rose /><Teddy /><ChaiCup /><SnowGlobeArt size={90} /><Diya /><GlobeOutline size={90} />
          </div>
        </div>
        <h2 className={h}>Reel cover generator</h2>
        <CoverGenerator />
      </div>
    </AppChrome>
  );
}
