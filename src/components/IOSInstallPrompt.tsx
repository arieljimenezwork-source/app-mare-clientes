'use client';

import { useEffect, useState } from 'react';
import { Share, PlusSquare } from 'lucide-react';
import { useClientConfig } from '@/context/ClientConfigContext';

export default function IOSInstallPrompt() {
    const config = useClientConfig();
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // 1. Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // 2. Detect Standalone (Installed)
        const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
        setIsStandalone(isInStandaloneMode);

        // 3. Show only if iOS + Not Installed
        if (isIosDevice && !isInStandaloneMode) {
            // Wait a bit to show
            const timer = setTimeout(() => setShowPrompt(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom duration-500">
            <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-4 max-w-sm mx-auto flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-black">Instalar App</h3>
                        <p className="text-xs text-gray-500">Agrega <strong>{config.name}</strong> a tu inicio para una mejor experiencia.</p>
                    </div>
                    <button onClick={() => setShowPrompt(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-700">
                    <span>1. Toca</span>
                    <Share size={20} className="text-blue-500" />
                    <span>(Compartir)</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                    <span>2. Elige</span>
                    <div className="flex items-center gap-1 font-semibold">
                        <PlusSquare size={20} />
                        Agregar a Inicio
                    </div>
                </div>
            </div>

            {/* Pointer arrow to bottom for Safari typically */}
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white mx-auto mt-[-1px] opacity-90 drop-shadow-sm"></div>
        </div>
    );
}
