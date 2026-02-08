import { ClientConfig } from '@/config/types';
import { Crown, LogOut } from 'lucide-react';

interface ClientHeaderProps {
    config: ClientConfig;
    level: number;
    onLogout: () => void;
    showGoldQR: boolean;
}

export default function ClientHeader({ config, level, onLogout, showGoldQR }: ClientHeaderProps) {
    return (
        <header className={`p-4 shadow-sm fixed w-full top-0 z-20 transition-colors ${showGoldQR ? 'bg-black text-amber-400' : 'bg-white'}`}>
            <div className="max-w-md mx-auto relative flex items-center justify-center h-48">

                {/* Centered Logo */}
                <div className="flex flex-col items-center">
                    {config.assets?.logo ? (
                        <img
                            src={config.assets.logo}
                            alt={config.name}
                            className="h-44 w-auto object-contain"
                        />
                    ) : (
                        <h1 className="text-xl font-bold">{config.name}</h1>
                    )}
                </div>

                {/* Absolute Level Badge (Right of Logo) */}
                {level > 1 && (
                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                        <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm border border-amber-200">
                            <Crown size={10} /> Lv {level}
                        </span>
                    </div>
                )}

                {/* Logout Button (Top Right) */}
                <button
                    onClick={onLogout}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 transition"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
}
