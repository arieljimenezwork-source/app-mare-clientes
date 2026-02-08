'use client';

import Image from "next/image";
import { Bell } from "lucide-react";
import { ClientConfig } from "@/config/types";

interface ClientHeaderProps {
    config: ClientConfig;
    userName?: string;
    level?: number;
}

export default function ClientHeader({ config, userName = "Cliente", level = 1 }: ClientHeaderProps) {
    const hasLogo = config.assets?.logo;
    const logoIsProtagonist = config.code === 'perezoso_cafe';

    return (
        <header className="fixed w-full top-0 z-20 transition-all duration-300">
            <div
                className="px-5 pt-12 pb-4 flex items-center justify-between shadow-sm"
                style={{ backgroundColor: config.theme.primaryColor }}
            >
                <div className="flex items-center gap-4">
                    {/* Logo como protagonista (especialmente para Perezoso) */}
                    <div className={`flex-shrink-0 flex items-center justify-center overflow-hidden rounded-xl ${logoIsProtagonist ? 'h-20 w-20 bg-white/5' : 'h-10 w-10 bg-white/10'} backdrop-blur-sm`}>
                        {hasLogo ? (
                            <Image
                                src={config.assets!.logo}
                                alt={config.name}
                                width={logoIsProtagonist ? 80 : 40}
                                height={logoIsProtagonist ? 80 : 40}
                                className="object-contain"
                            />
                        ) : (
                            <span className="text-xl">{config.code === 'perezoso_cafe' ? '🦥' : '☕'}</span>
                        )}
                    </div>
                    <div>
                        {!logoIsProtagonist && (
                            <p className="text-white font-bold text-base leading-tight tracking-wide">
                                {config.name}
                            </p>
                        )}
                        <p className={`text-white font-bold mt-0.5 ${logoIsProtagonist ? 'text-2xl' : 'text-base'}`}>
                            Hola, {userName}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {level > 1 && (
                        <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2.5 py-1 rounded-full font-bold border border-amber-400/30 backdrop-blur-sm">
                            ★ Lv {level}
                        </span>
                    )}
                    <button className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors backdrop-blur-sm relative">
                        <Bell size={18} />
                        {/* Notification Dot */}
                        <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-[#2E2333]"></span>
                    </button>
                </div>
            </div>
        </header>
    );
}
