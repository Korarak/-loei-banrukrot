'use client';

import Link from 'next/link';
import { ChevronRight, Facebook, Phone, MapPin } from 'lucide-react';
import { siteConfig } from '@/config/site';

export default function Footer() {
    return (
        <footer className="bg-zinc-950 text-white mt-0 pt-12 md:pt-20 pb-12 rounded-t-[3rem] relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),rgba(255,255,255,0))]" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-20 mb-16">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 px-2.5 bg-gradient-to-br from-primary to-red-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <span className="font-black text-[10px] italic tracking-tight leading-none">VESPA</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black italic tracking-tighter text-white">บ้านรักรถเมืองเลย</h2>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">OAT ENGINEERING</p>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-8">
                            {siteConfig.brand.description}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href={siteConfig.footerData.contact.social.facebook} aria-label="Facebook" className="h-10 w-10 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#1877F2] hover:text-white transition-all transform hover:-translate-y-1">
                                <Facebook className="h-5 w-5" />
                            </Link>
                            <Link href={siteConfig.footerData.contact.social.tiktok} aria-label="TikTok" className="h-10 w-10 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#000000] hover:text-white transition-all transform hover:-translate-y-1">
                                <span className="font-bold text-xs" aria-hidden="true">TT</span>
                            </Link>
                            <Link href={siteConfig.footerData.contact.social.youtube} aria-label="YouTube" className="h-10 w-10 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#FF0000] hover:text-white transition-all transform hover:-translate-y-1">
                                <span className="font-bold text-xs" aria-hidden="true">YT</span>
                            </Link>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
                        {/* Explore */}
                        <div>
                            <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-6">Explore</h3>
                            <ul className="space-y-4 text-sm font-medium">
                                {siteConfig.footerData.explore.map((item, index) => (
                                    <li key={index}>
                                        <Link href={item.href} className="text-gray-400 hover:text-primary transition-colors block">
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact */}
                        <div className="col-span-2 md:col-span-1">
                            <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-6">Contact Us</h3>
                            <ul className="space-y-4 text-sm text-gray-400 font-medium">
                                {siteConfig.footerData.contact.items.map((item: any, index: number) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <div className="mt-1 min-w-[16px]">
                                            {item.type === 'phone' && <Phone className="h-4 w-4 text-primary" />}
                                            {item.type === 'address' && <MapPin className="h-4 w-4 text-primary" />}
                                            {item.type === 'maps' && <ChevronRight className="h-4 w-4 text-primary" />}
                                        </div>
                                        {item.href ? (
                                            <Link href={item.href} target="_blank" className="hover:text-primary transition-colors">
                                                {item.label ? `${item.label}: ` : ''}{item.value}
                                            </Link>
                                        ) : (
                                            <span>{item.label ? `${item.label}: ` : ''}{item.value}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Quick shop CTA */}
                        <div className="col-span-2 md:col-span-1 hidden md:block">
                            <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-6">เริ่มช้อปเลย</h3>
                            <p className="text-xs text-gray-500 mb-4">อะไหล่และอุปกรณ์ตกแต่ง Vespa คัดสรรโดยช่างผู้เชี่ยวชาญ</p>
                            <Link
                                href="/products"
                                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-500 transition-colors"
                            >
                                ดูสินค้าทั้งหมด
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-600 text-xs font-medium">{siteConfig.footerData.copyright}</p>
                    <div className="flex gap-6">
                        {siteConfig.footerData.legal.map((item, index) => (
                            <Link key={index} href={item.href} className="text-gray-600 hover:text-white text-xs font-medium transition-colors">
                                {item.label}
                            </Link>
                        ))}
                        <Link href="/login" className="text-gray-800 hover:text-primary text-[10px] font-bold transition-colors uppercase tracking-widest border border-gray-800 rounded px-1.5 py-0.5 ml-4">
                            Admin
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
