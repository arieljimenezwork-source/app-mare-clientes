import { ClientConfig } from '@/config/types';
import { Coffee } from 'lucide-react';

interface StampProgressProps {
    config: ClientConfig;
    stamps: number;
}

export default function StampProgress({ config, stamps }: StampProgressProps) {
    const percentage = Math.min((stamps / config.rules.stampsPerReward) * 100, 100);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-orange-100 text-orange-600 shadow-sm">
                        <Coffee size={28} />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <p className="font-bold text-3xl">{stamps}</p>
                            <p className="text-sm font-medium text-gray-400">/ {config.rules.stampsPerReward}</p>
                        </div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Sellos acumulados</p>
                    </div>
                </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                    className="bg-orange-500 h-2.5 rounded-full transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>

            <p className="text-xs text-center mt-2 text-gray-400">
                {stamps >= config.rules.stampsPerReward
                    ? '¡Tienes una bebida gratis disponible!'
                    : `Faltan ${config.rules.stampsPerReward - stamps} sellos para tu premio.`}
            </p>
        </div>
    );
}
