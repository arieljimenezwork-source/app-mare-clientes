import { ClientConfig } from '@/config/types';
import { Coffee } from 'lucide-react';
import Link from 'next/link';

interface MenuButtonProps {
    config: ClientConfig;
}

export default function MenuButton({ config }: MenuButtonProps) {
    const isInternal = config.features.menuEnabled;
    const externalUrl = config.features.externalMenuUrl;

    if (isInternal) {
        return (
            <Link href="/client/menu" className="w-full">
                <button
                    className="w-full py-4 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"
                    style={{ backgroundColor: config.theme.primaryColor }}
                >
                    <Coffee size={20} /> Ver Nuestro Menú
                </button>
            </Link>
        );
    }

    if (externalUrl) {
        return (
            <button
                onClick={() => window.open(externalUrl, '_blank')}
                className="w-full py-4 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"
                style={{ backgroundColor: config.theme.primaryColor }}
            >
                <Coffee size={20} /> Ver Nuestro Menú
            </button>
        );
    }

    return null;
}
