import Link from 'next/link';
import { ArrowLeft, Coffee } from 'lucide-react';

interface MenuHeaderProps {
    title: string;
}

export default function MenuHeader({ title }: MenuHeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 bg-white z-20 shadow-sm">
            <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/client" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Coffee className="w-5 h-5 text-amber-600" />
                        {title}
                    </h1>
                </div>
            </div>
        </header>
    );
}
