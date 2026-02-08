'use client';

import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';

export default function PerezosoQRPreview() {
    // URL de registro para clientes
    // Usamos window.location.origin para que funcione en local y prod, 
    // pero como es preview hardcodeamos un ejemplo o usamos un hook si fuera componente real.
    // Para este archivo de prueba, usaremos una URL base genérica o la IP local si la conocemos.
    const registerUrl = "http://192.168.1.78:3001/auth/login?role=customer";

    return (
        <div className="min-h-screen bg-[#2E2333] flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-[40px] p-8 md:p-12 max-w-sm w-full shadow-2xl text-center relative overflow-hidden border-8 border-[#F5A623]">
                
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-4 bg-[#F5A623]"></div>
                <div className="absolute bottom-0 left-0 w-full h-4 bg-[#F5A623]"></div>

                {/* Header */}
                <div className="mb-8 relative">
                    <div className="w-24 h-24 mx-auto bg-[#2E2333] rounded-full flex items-center justify-center mb-4 shadow-lg border-4 border-[#FFF5E1]">
                        <span className="text-4xl">🦥</span>
                    </div>
                    <h2 className="text-3xl font-black text-[#2E2333] mb-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
                        ¡Únete al Club!
                    </h2>
                    <p className="text-gray-500 font-medium text-sm leading-relaxed">
                        Escanea para registrarte y empezar a sumar puntos en <span className="text-[#F5A623] font-bold">Perezoso Cafe</span>
                    </p>
                </div>

                {/* QR Container */}
                <div className="relative mx-auto w-64 h-64 bg-[#FFF5E1] p-4 rounded-3xl border-4 border-dashed border-[#2E2333]/20 flex items-center justify-center mb-8">
                    <QRCodeSVG
                        value={registerUrl}
                        size={200}
                        bgColor="transparent"
                        fgColor="#2E2333"
                        level="H"
                        includeMargin={false}
                    />
                    
                    {/* Center Logo Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white p-1.5 rounded-full shadow-md">
                            <div className="w-10 h-10 relative bg-[#F5A623] rounded-full flex items-center justify-center">
                                <span className="text-xl">☕</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="space-y-3">
                    <div className="inline-block bg-[#F5A623]/10 text-[#F5A623] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                        10 Sellos = 1 Café Gratis
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium mt-4">
                        Desarrollado por Brandia
                    </p>
                </div>
            </div>
        </div>
    );
}
