'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert size={40} className="text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600 mb-8 max-w-md">
                No tienes permisos para ver esta página o tu cuenta no pertenece a este comercio.
            </p>
            <div className="flex gap-4">
                <Link
                    href="/"
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:scale-105 transition-transform"
                >
                    Volver al Inicio
                </Link>
                <Link
                    href="/auth/login?role=customer"
                    className="px-6 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                    Iniciar Sesión
                </Link>
            </div>
        </div>
    );
}
