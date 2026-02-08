'use client';

import { ClientConfig } from "@/config/types";
import { ArrowRight } from "lucide-react";

interface PromoBannerProps {
    config: ClientConfig;
}

export default function PromoBanner({ config }: PromoBannerProps) {
    return (
        <div
            className="relative overflow-hidden rounded-[24px] p-5 flex items-center justify-between shadow-lg transform transition-transform duration-500 hover:scale-[1.02]"
            style={{ backgroundColor: config.theme.primaryColor }}
        >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }} />

            <div className="relative z-10 space-y-1">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                    Coffee Day
                </p>
                <p className="text-white text-3xl font-black leading-none tracking-tight">
                    OFF 20%
                </p>
                <button
                    className="mt-3 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-md hover:bg-opacity-90 transition-all active:scale-95"
                    style={{ backgroundColor: config.theme.accentColor, color: "#fff" }}
                >
                    Obtener
                    <span className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                        <ArrowRight size={10} />
                    </span>
                </button>
            </div>

            <div className="relative z-10 w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-4xl backdrop-blur-sm border border-white/10 rotate-3">
                ☕
            </div>
        </div>
    );
}
