'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface MenuGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: { src: string; label: string }[];
    initialIndex?: number;
}

export default function MenuGalleryModal({ isOpen, onClose, images, initialIndex = 0 }: MenuGalleryModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen, initialIndex]);

    if (!isOpen || images.length === 0) return null;

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 z-[110] p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                aria-label="Cerrar"
            >
                <X size={28} />
            </button>

            {/* Navigation Buttons (Desktop/Mobile) */}
            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                <button
                    onClick={handlePrevious}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors pointer-events-auto"
                    aria-label="Anterior"
                >
                    <ChevronLeft size={32} />
                </button>
                <button
                    onClick={handleNext}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors pointer-events-auto"
                    aria-label="Siguiente"
                >
                    <ChevronRight size={32} />
                </button>
            </div>

            {/* Image Container */}
            <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8">
                <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
                    <img
                        src={images[currentIndex].src}
                        alt={images[currentIndex].label}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                    />
                </div>

                {/* Info Overlay */}
                <div className="mt-6 text-center">
                    <h3 className="text-white text-xl font-bold tracking-tight">
                        {images[currentIndex].label}
                    </h3>
                    <p className="text-white/60 text-sm mt-1">
                        {currentIndex + 1} de {images.length}
                    </p>
                </div>
            </div>

            {/* Thumbnail Indicators */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/30'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
