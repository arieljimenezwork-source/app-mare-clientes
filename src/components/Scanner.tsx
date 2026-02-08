'use client';

import React from 'react';
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner';
import { X } from 'lucide-react';

interface ScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white backdrop-blur-sm transition-colors"
                >
                    <X size={24} color="black" />
                </button>

                <div className="p-4 bg-gray-900 text-white text-center">
                    <h2 className="text-lg font-bold">Escanear Código QR</h2>
                    <p className="text-sm opacity-80">Apunta la cámara al QR del cliente</p>
                </div>

                <div className="w-full aspect-square bg-black relative">
                    <QrScanner
                        onScan={(result) => {
                            if (result && result.length > 0) {
                                onScan(result[0].rawValue);
                            }
                        }}
                        onError={(error) => console.error(error)}
                        styles={{
                            container: { width: '100%', height: '100%' },
                            video: { width: '100%', height: '100%', objectFit: 'cover' }
                        }}
                    />

                    {/* Overlay for guidance */}
                    <div className="absolute inset-0 border-2 border-white/30 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Scanner;
