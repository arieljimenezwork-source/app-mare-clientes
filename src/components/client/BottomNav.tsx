'use client';

import { ClientConfig } from "@/config/types";
import { Home, ClipboardList, Gift, User, Scan } from "lucide-react";
import { useState } from "react";

interface BottomNavProps {
    config: ClientConfig;
    onQRClick: () => void;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
}

export default function BottomNav({ config, onQRClick, activeTab = 'home', onTabChange }: BottomNavProps) {
    const [internalActive, setInternalActive] = useState(activeTab);

    const handleTabClick = (id: string) => {
        setInternalActive(id);
        onTabChange?.(id);
    };

    const items = [
        { id: "home", icon: Home, label: "Inicio" },
        { id: "menu", icon: ClipboardList, label: "Menú" },
        { id: "qr", icon: null, label: "QR" },
        { id: "rewards", icon: Gift, label: "Premios" },
        { id: "profile", icon: User, label: "Perfil" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 pb-safe pt-2 px-6 h-[88px]">
            <div className="max-w-sm mx-auto flex items-center justify-between h-full pb-4">
                {items.map((item) =>
                    item.id === "qr" ? (
                        <button
                            key="qr"
                            onClick={onQRClick}
                            className="w-14 h-14 -mt-10 rounded-2xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shadow-lg relative z-40"
                            style={{ backgroundColor: config.theme.accentColor, boxShadow: `0 8px 24px ${config.theme.accentColor}50` }}
                        >
                            <Scan size={26} strokeWidth={2.5} />
                        </button>
                    ) : (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className="flex flex-col items-center gap-1 transition-all w-12"
                            style={{
                                color: internalActive === item.id ? config.theme.accentColor : "#D1D5DB",
                                transform: internalActive === item.id ? "translateY(-2px)" : "none"
                            }}
                        >
                            {item.icon && <item.icon size={24} strokeWidth={internalActive === item.id ? 2.5 : 2} />}
                            <span className={`text-[9px] font-bold ${internalActive === item.id ? 'opacity-100' : 'opacity-0'}`}>
                                {item.label}
                            </span>
                        </button>
                    )
                )}
            </div>
        </nav>
    );
}
