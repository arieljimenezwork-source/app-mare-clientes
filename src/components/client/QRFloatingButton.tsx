import { QrCode } from 'lucide-react';

interface QRFloatingButtonProps {
    onClick: () => void;
    primaryColor: string;
}

export default function QRFloatingButton({ onClick, primaryColor }: QRFloatingButtonProps) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-40 text-white p-4 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all animate-bounce-slow"
            style={{ backgroundColor: primaryColor }}
            aria-label="Mi QR"
        >
            <QrCode size={28} />
        </button>
    );
}
