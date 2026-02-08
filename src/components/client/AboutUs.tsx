'use client';

import { ClientConfig } from '@/config/types';
import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Info, Instagram } from 'lucide-react';

interface AboutUsProps {
    config: ClientConfig;
}

export default function AboutUs({ config }: AboutUsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentImage, setCurrentImage] = useState(0);

    const gallery = config.assets.gallery || [];

    if (!config.features.showAboutUs || gallery.length === 0) return null;

    const nextImage = () => {
        setCurrentImage((prev) => (prev + 1) % gallery.length);
    };

    const prevImage = () => {
        setCurrentImage((prev) => (prev - 1 + gallery.length) % gallery.length);
    };

    const accentColor = config.theme.accentColor || config.theme.primaryColor;

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="w-full py-4 rounded-3xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg"
                style={{
                    backgroundColor: config.theme.primaryColor,
                    color: config.theme.secondaryColor,
                }}
            >
                <Info size={20} />
                Acerca de Nosotros
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
                    <div
                        className="relative w-full max-w-lg rounded-4xl overflow-hidden shadow-2xl"
                        style={{ backgroundColor: config.theme.secondaryColor }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                            style={{
                                backgroundColor: config.theme.primaryColor,
                                color: config.theme.secondaryColor,
                            }}
                        >
                            <X size={20} />
                        </button>

                        {/* Image Carousel */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden">
                            <img
                                src={gallery[currentImage]}
                                alt={`${config.name} - Imagen ${currentImage + 1}`}
                                className="w-full h-full object-cover transition-all duration-500"
                            />

                            {/* Navigation Arrows */}
                            {gallery.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                                        style={{
                                            backgroundColor: `${config.theme.primaryColor}CC`,
                                            color: config.theme.secondaryColor,
                                        }}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                                        style={{
                                            backgroundColor: `${config.theme.primaryColor}CC`,
                                            color: config.theme.secondaryColor,
                                        }}
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}

                            {/* Dots Indicator */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {gallery.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImage(index)}
                                        className="w-2 h-2 rounded-full transition-all duration-300"
                                        style={{
                                            backgroundColor: index === currentImage
                                                ? accentColor
                                                : `${config.theme.secondaryColor}80`,
                                            transform: index === currentImage ? 'scale(1.3)' : 'scale(1)',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 text-center" style={{ color: config.theme.primaryColor }}>
                            <img
                                src={config.assets.logo}
                                alt={config.name}
                                className="w-40 h-40 mx-auto mb-6 object-contain"
                            />
                            <h2
                                className="text-2xl font-bold mb-2"
                                style={{ fontFamily: config.theme.fontFamily }}
                            >
                                {config.name}
                            </h2>
                            <p className="opacity-80">{config.texts.welcomeSubtitle}</p>

                            {/* Social Media */}
                            {config.social?.instagram && (
                                <div className="mt-6 pt-4 border-t border-current/10">
                                    <a
                                        href={config.social.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all hover:scale-105 shadow-md hover:shadow-lg"
                                        style={{
                                            backgroundColor: config.theme.primaryColor,
                                            color: config.theme.secondaryColor
                                        }}
                                    >
                                        <Instagram size={20} />
                                        Síguenos en Instagram
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
