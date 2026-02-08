'use client';

import { ClientConfig } from "@/config/types";
import { Check, Gift } from "lucide-react";

interface StampProgressProps {
    currentStamps: number;
    config: ClientConfig;
    onStampClick?: (index: number) => void; // Optional for simulation
}

export default function StampProgress({ currentStamps, config, onStampClick }: StampProgressProps) {
    const total = config.rules.stampsPerReward || 10;
    const pct = Math.min((currentStamps / total) * 100, 100);

    return (
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="font-bold text-gray-900 text-sm">Tu Tarjeta</h3>
                    <p className="text-gray-400 text-xs mt-0.5 font-medium">
                        {currentStamps >= total ? "¡Premio disponible!" : `${total - currentStamps} más para tu premio`}
                    </p>
                </div>
                <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-black text-gray-900 tracking-tight">{currentStamps}</span>
                    <span className="text-sm text-gray-300 font-bold">/{total}</span>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-3 mb-6">
                {Array.from({ length: total }).map((_, i) => {
                    const filled = i < currentStamps;
                    const next = i === currentStamps;
                    const isReward = i === total - 1;

                    return (
                        <div
                            key={i}
                            onClick={() => onStampClick?.(i + 1)}
                            className={`
                aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 relative
                ${filled ? "text-white scale-100 shadow-md transform" : next ? "border-2 border-dashed bg-gray-50 scale-105" : "bg-gray-50 text-gray-300"}
              `}
                            style={{
                                backgroundColor: filled ? config.theme.accentColor : undefined,
                                borderColor: next ? config.theme.accentColor : undefined,
                                color: next ? config.theme.accentColor : undefined,
                                cursor: onStampClick ? 'pointer' : 'default'
                            }}
                        >
                            {filled ? (
                                <Check size={14} strokeWidth={4} />
                            ) : isReward ? (
                                <Gift size={16} />
                            ) : (
                                i + 1
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: config.theme.accentColor }}
                />
            </div>
        </div>
    );
}
