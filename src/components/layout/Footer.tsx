import Link from "next/link";
import { Languages, Share2, Info } from "lucide-react";

export const EditorialFooter = () => {
  return (
    <footer className="w-full py-20 px-6 md:px-12 flex flex-col md:flex-row justify-between items-start gap-12 bg-surface border-t border-on-background/5 relative overflow-hidden">
      <div className="flex flex-col gap-6 max-w-xs relative z-10">
        <h2 className="font-bodoni text-3xl md:text-4xl text-primary uppercase tracking-tighter font-black italic">SolTix</h2>
        <p className="font-inter text-sm text-text-muted leading-relaxed font-medium italic opacity-80">
          Defining the next era of cultural commerce in Indonesia. <br />
          A premium archive for the creative society.
        </p>
        <div className="flex gap-6 text-accent relative z-10">
          <Languages className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
          <Share2 className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
          <Info className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-16 relative z-10">
        <div className="flex flex-col gap-6">
          <span className="font-inter text-[10px] text-accent uppercase tracking-[0.3em] font-bold italic opacity-60">Discovery</span>
          <nav className="flex flex-col gap-3">
            <Link href="#" className="font-inter text-xs text-text-muted hover:text-primary transition-colors font-bold uppercase tracking-widest">Curated Series</Link>
            <Link href="#" className="font-inter text-xs text-text-muted hover:text-primary transition-colors font-bold uppercase tracking-widest">Art Rituals</Link>
            <Link href="#" className="font-inter text-xs text-text-muted hover:text-primary transition-colors font-bold uppercase tracking-widest">Soundscapes</Link>
          </nav>
        </div>
        
        <div className="flex flex-col gap-6">
          <span className="font-inter text-[10px] text-accent uppercase tracking-[0.3em] font-bold italic opacity-60">Society</span>
          <nav className="flex flex-col gap-3">
            <Link href="#" className="font-inter text-xs text-text-muted hover:text-primary transition-colors font-bold uppercase tracking-widest">Resale Exchange</Link>
            <Link href="#" className="font-inter text-xs text-text-muted hover:text-primary transition-colors font-bold uppercase tracking-widest">Safety Protocol</Link>
            <Link href="#" className="font-inter text-xs text-text-muted hover:text-primary transition-colors font-bold uppercase tracking-widest">Member Identity</Link>
          </nav>
        </div>

        <div className="flex flex-col gap-6">
          <span className="font-inter text-[10px] text-accent uppercase tracking-[0.3em] font-bold italic opacity-60">Archive HQ</span>
          <p className="font-inter text-xs text-text-muted leading-relaxed font-bold uppercase tracking-widest">
            SCBD, District 8<br />
            Jakarta Selatan<br />
            12190
          </p>
        </div>
      </div>

      <div className="w-full md:w-auto mt-8 md:mt-0 flex flex-col items-start md:items-end gap-4 text-text-muted/30 relative z-10">
        <p className="font-inter text-[10px] leading-loose md:text-right font-bold tracking-[0.3em] uppercase italic">
          © 2026 SOLTIX ARCHIVE.<br />
          ALL RIGHTS RESERVED.
        </p>
        <div className="w-16 h-[1px] bg-on-background/10" />
      </div>
    </footer>
  );
};
