import { ClientConfig } from '@/config/types';
import { Gift } from 'lucide-react';

interface RewardsCardProps {
    config: ClientConfig;
    isRewardReady: boolean;
    onOpenQR: () => void;
}

export default function RewardsCard({ config, isRewardReady, onOpenQR }: RewardsCardProps) {
    if (!isRewardReady) return null;

    return (
        <div className="w-full">
            <button
                onClick={onOpenQR}
                className="w-full py-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-2xl font-bold text-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 animate-bounce"
            >
                <Gift size={24} />
                ¡TIENES UN PREMIO!
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">Toca para mostrar tu QR y canjear</p>
        </div>
    );
}
