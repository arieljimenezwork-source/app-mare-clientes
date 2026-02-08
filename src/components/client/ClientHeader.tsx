'use client';

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ClientConfig } from "@/config/types";

interface ClientHeaderProps {
    config: ClientConfig;
    userName?: string;
    level?: number;
}

export default function ClientHeader({ config, userName = "Cliente", level = 1 }: ClientHeaderProps) {
    const router = useRouter();
    const [showNotifications, setShowNotifications] = useState(false);

    const hasLogo = config.assets?.logo;
    const logoIsProtagonist = config.code === 'perezoso_cafe';

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

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

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors backdrop-blur-sm relative"
                        >
                            <Bell size={18} />
                            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-[#2E2333]"></span>
                        </button>

                        {showNotifications && (
                            <div className="absolute top-12 right-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 animate-in fade-in zoom-in-50 duration-200 z-50">
                                <h3 className="text-gray-900 font-bold text-sm mb-3">Novedades</h3>
                                <div className="space-y-3">
                                    <div className="flex gap-3 items-start p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-gray-800 text-xs font-medium">¡Se acerca un evento!</p>
                                            <p className="text-gray-400 text-[10px]">Hace 2 horas</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-start p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-gray-800 text-xs font-medium">Tenemos productos nuevos</p>
                                            <p className="text-gray-400 text-[10px]">Ayer</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80 hover:bg-red-500/20 hover:text-red-200 transition-colors backdrop-blur-sm"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}
