'use client';

import { ClientConfig } from "@/config/types";
import { X } from "lucide-react";
import QRCode from 'react-qr-code';

interface QRSheetProps {
    isOpen: boolean;
    onClose: () => void;
    config: ClientConfig;
    userUUID: string;
    isReward?: boolean;
}

export default function QRSheet({ isOpen, onClose, config, userUUID, isReward }: QRSheetProps) {
    if (!isOpen) return null;

    // We construct the value string to be encoded in the QR.
    // Format: "CLIENT_CODE:USER_UUID" or similar. Staff app handles parsing logic.
    // For safety, let's keep it simple: just UUID or a JSON string.
    // Previous implementatin was just UUID or specific JSON.
    // Let's assume just UUID for identification, or JSON for redeem?
    // Existing logic in staff is `verify_shop_pin` via API? No, staff scans USER.
    // So QR just needs to represent the User ID or a temporary token.
    // Let's stick to JSON for flexibility:
    const qrData = JSON.stringify({
        uid: userUUID,
        action: isReward ? 'redeem' : 'scan',
        shop: config.code // Optional context
    });

    return (
        <>
            <div
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px] transition-opacity duration-300"
                onClick={onClose}
            />
            <div
                className="fixed bottom-0 left-0 right-0 z-50 animate-[slideUp_0.3s_ease-out]"
            >
                <div
                    className="bg-white rounded-t-[32px] max-w-sm mx-auto w-full px-6 pt-3 pb-10"
                    style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}
                >
                    {/* Handle bar */}
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 opacity-50" />

                    <div className="text-center mb-6">
                        <span
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold ring-1 ring-inset"
                            style={{
                                backgroundColor: isReward ? "#FEF3C7" : `${config.theme.accentColor}10`,
                                color: isReward ? "#92400E" : config.theme.accentColor,
                            }}
                        >
                            {isReward ? "🎁 ¡Premio disponible!" : "☕ Muestra al barista"}
                        </span>
                    </div>

                    <div
                        className="rounded-[32px] p-8 flex items-center justify-center mx-auto max-w-[280px] transition-colors duration-300"
                        style={{
                            backgroundColor: isReward ? config.theme.primaryColor : "#F9FAFB",
                            border: isReward ? "none" : "2px solid #F3F4F6"
                        }}
                    >
                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                            <div className="w-48 h-48 flex items-center justify-center bg-white">
                                <QRCode
                                    value={qrData}
                                    size={192}
                                    viewBox={`0 0 192 192`}
                                    fgColor={config.theme.primaryColor}
                                    bgColor="#FFFFFF"
                                />
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6 max-w-[200px] mx-auto leading-relaxed">
                        {isReward
                            ? "El barista escaneará este código para canjear tu premio."
                            : "Acumula sellos con cada compra presentando este código."}
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full mt-8 py-3.5 rounded-2xl font-bold text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <X size={16} /> Cerrar
                    </button>
                </div>
            </div>
        </>
    );
}
