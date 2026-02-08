import { ClientConfig } from '@/config/types';
import QRCode from 'react-qr-code';
import { Gift, X } from 'lucide-react';

interface QRModalProps {
    isOpen: boolean;
    onClose: () => void;
    userUUID: string | null;
    isRewardReady: boolean;
    config: ClientConfig;
}

export default function QRModal({ isOpen, onClose, userUUID, isRewardReady, config }: QRModalProps) {
    if (!isOpen) return null;

    const accentColor = config.theme.accentColor || '#d97706'; // Fallback to amber-600

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center font-sans" style={{ fontFamily: config.theme.fontFamily }}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={`relative w-full max-w-md rounded-t-4xl sm:rounded-4xl p-8 shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{
                    backgroundColor: config.theme.secondaryColor,
                    color: config.theme.primaryColor,
                    border: `1px solid ${config.theme.primaryColor}20`
                }}
            >
                {/* Close Handle / Button */}
                <div className="flex justify-center mb-4 sm:hidden">
                    <div className="w-12 h-1.5 rounded-full opacity-20" style={{ backgroundColor: config.theme.primaryColor }} />
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 transition-transform hover:scale-110 sm:block hidden"
                    style={{ color: config.theme.primaryColor }}
                >
                    <X size={24} />
                </button>

                <div className="flex flex-col items-center gap-6 text-center">

                    {/* Branding Logo (Optional but nice) */}
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-[-10px] shadow-sm" style={{ backgroundColor: config.theme.secondaryColor }}>
                        <img src={config.assets.logo} alt="Logo" className="w-12 h-12 object-contain" />
                    </div>

                    {isRewardReady ? (
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold flex items-center justify-center gap-2" style={{ color: accentColor }}>
                                <Gift size={28} className="animate-bounce" />
                                ¡Premio Listo!
                            </h2>
                            <p className="font-medium opacity-80">Muestra este código para canjear tu bebida gratis.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold">Tu Código</h2>
                            <p className="opacity-70">Muestra esto al barista para sumar sellos.</p>
                        </div>
                    )}

                    {/* QR Code Container */}
                    <div
                        className="p-4 bg-white rounded-3xl shadow-inner relative transition-all"
                        style={{
                            boxShadow: `0 10px 30px -10px ${config.theme.primaryColor}30`,
                            border: isRewardReady ? `4px solid ${accentColor}` : 'none'
                        }}
                    >
                        {userUUID ? (
                            <QRCode
                                value={userUUID}
                                size={220}
                                fgColor={config.theme.primaryColor}
                                bgColor="#FFFFFFFF" // Keep QR background white for readability
                            />
                        ) : (
                            <div className="w-[220px] h-[220px] bg-gray-100 animate-pulse rounded-xl" />
                        )}

                        {isRewardReady && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                <Gift size={120} style={{ color: accentColor }} />
                            </div>
                        )}
                    </div>

                    <p className="text-xs opacity-50 mt-2 uppercase tracking-widest">
                        {config.name}
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full py-4 mt-2 font-bold rounded-2xl transition-all hover:opacity-90 active:scale-95"
                        style={{
                            backgroundColor: config.theme.primaryColor,
                            color: config.theme.secondaryColor
                        }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
