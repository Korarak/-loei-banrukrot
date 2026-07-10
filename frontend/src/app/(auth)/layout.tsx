import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex bg-zinc-950">
            {/* ── Brand panel (desktop only) ─────────────────────────────── */}
            <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden bg-gradient-to-br from-primary via-emerald-900 to-black p-12 text-white">
                {/* Static radial accents — same language as storefront hero */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 60% 50% at 85% 0%, rgba(236,72,153,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 45% at 0% 100%, rgba(16,185,129,0.22) 0%, transparent 60%)' }}
                />

                <Link href="/" className="relative z-10 flex items-center gap-3 group w-fit">
                    <div className="h-11 px-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105">
                        <span className="text-white font-black text-[11px] italic tracking-tight leading-none">VESPA</span>
                    </div>
                    <div>
                        <div className="text-lg font-black italic tracking-tighter leading-none">{siteConfig.brand.name}</div>
                        <div className="text-[10px] font-bold text-white/50 uppercase tracking-[0.25em] mt-1">{siteConfig.brand.englishName}</div>
                    </div>
                </Link>

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-accent font-bold text-xs uppercase tracking-widest mb-6">
                        <Zap className="h-3.5 w-3.5 fill-accent" />
                        Back Office
                    </div>
                    <h1 className="text-5xl xl:text-6xl font-black tracking-tighter leading-[1.05] mb-6">
                        ระบบจัดการร้าน<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-amber-600 italic pr-2">
                            บ้านรักรถเมืองเลย
                        </span>
                    </h1>
                    <p className="text-white/60 font-medium leading-relaxed max-w-sm">
                        จัดการสินค้า คำสั่งซื้อ สต็อก และการขายหน้าร้าน ครบจบในที่เดียว
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
                    <ShieldCheck className="h-4 w-4" />
                    สำหรับพนักงานและเจ้าของร้านเท่านั้น
                </div>
            </div>

            {/* ── Form panel ─────────────────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-zinc-950 lg:bg-white">
                {/* Mobile-only ambience */}
                <div
                    className="absolute inset-0 pointer-events-none lg:hidden"
                    style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.25) 0%, transparent 60%)' }}
                />

                <div className="w-full max-w-md relative z-10">
                    <div className="mb-6">
                        <Button variant="ghost" size="sm" asChild className="text-gray-400 hover:text-primary lg:text-gray-500 -ml-3 font-bold rounded-full">
                            <Link href="/">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                กลับหน้าร้าน
                            </Link>
                        </Button>
                    </div>
                    <div className="bg-white rounded-[2rem] shadow-2xl shadow-black/30 lg:shadow-gray-200/60 border border-gray-100 p-8 sm:p-10">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
