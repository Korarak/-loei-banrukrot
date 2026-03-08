'use client';

import { Bike, Loader2, Wind } from 'lucide-react';
import React from 'react';

export function VespaLoader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="relative flex flex-col items-center">
                {/* Scooter Container with bouncing animation */}
                <div className="relative animate-bounce">
                    {/* Wind lines behind */}
                    <div className="absolute -left-12 bottom-2 space-y-2 opacity-60">
                        <div className="w-8 h-1 bg-primary/40 rounded-full" />
                        <div className="w-6 h-1 bg-primary/30 rounded-full" />
                        <div className="w-10 h-1 bg-primary/20 rounded-full" />
                    </div>

                    {/* The Scooter Icon */}
                    <div className="relative z-10 p-4 bg-white rounded-full shadow-xl border-4 border-primary/20">
                        <div className="text-primary transform -scale-x-100">
                            {/* Flipped Bike icon to look like driving forward (right) */}
                            <Bike className="w-12 h-12" strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* Shadow underneath */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/10 rounded-full animate-pulse mx-auto opacity-50 blur-[2px]" />
                </div>

                {/* Loading Text */}
                <div className="mt-8 flex items-center gap-2 text-primary font-bold tracking-widest text-lg animate-pulse">
                    <span>L</span>
                    <span>O</span>
                    <span>A</span>
                    <span>D</span>
                    <span>I</span>
                    <span>N</span>
                    <span>G</span>
                    <span className="ml-1 px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs font-normal">Vespa Parts</span>
                </div>
            </div>
        </div>
    );
}
