'use client';

import Link from 'next/link';
import { Wrench, ChevronDown, Facebook, Instagram, Phone, Mail, MapPin, Twitter } from 'lucide-react';
import { useState } from 'react';
import { siteConfig } from '@/config/site';

export default function Footer() {
    const [openSection, setOpenSection] = useState<string | null>(null);

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    return (
        <footer className="bg-zinc-950 text-white mt-0 pt-20 pb-24 md:pb-12 rounded-t-[3rem] relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),rgba(255,255,255,0))]" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>

            {/* Floating Glows */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none animate-breathe"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none animate-breathe" style={{ animationDelay: '2s' }}></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-20 mb-16">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <Wrench className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black italic tracking-tighter text-white">BANRAKROD</h2>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Loei Province</p>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-8">
                            {siteConfig.brand.description}
                        </p>
                        <div className="flex gap-4">
                            <Link href={siteConfig.footerData.contact.social.facebook} className="h-10 w-10 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#1877F2] hover:text-white transition-all transform hover:-translate-y-1">
                                <Facebook className="h-5 w-5" />
                            </Link>
                            <Link href={siteConfig.footerData.contact.social.instagram} className="h-10 w-10 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#E4405F] hover:text-white transition-all transform hover:-translate-y-1">
                                <Instagram className="h-5 w-5" />
                            </Link>
                            <Link href={siteConfig.footerData.contact.social.line} className="h-10 w-10 bg-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#06C755] hover:text-white transition-all transform hover:-translate-y-1">
                                <span className="font-bold text-sm">L</span>
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
                                {siteConfig.footerData.contact.items.map((item, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <div className="mt-1 min-w-[16px]">
                                            {item.type === 'email' && <Mail className="h-4 w-4 text-primary" />}
                                            {item.type === 'phone' && <Phone className="h-4 w-4 text-primary" />}
                                            {item.type === 'address' && <MapPin className="h-4 w-4 text-primary" />}
                                        </div>
                                        <span>{item.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Newsletter (Optional/Placeholder) */}
                        <div className="col-span-2 md:col-span-1 hidden md:block">
                            <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-6">Stay Updated</h3>
                            <p className="text-xs text-gray-500 mb-4">Subscribe to get the latest products and news.</p>
                            <div className="flex gap-2">
                                <input type="email" placeholder="Email address" className="bg-gray-900 border-none rounded-lg px-4 py-2 text-sm w-full focus:ring-1 focus:ring-primary text-white" />
                                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-500 transition-colors">OK</button>
                            </div>
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
