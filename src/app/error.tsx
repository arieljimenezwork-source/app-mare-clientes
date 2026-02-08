'use client';

import { useEffect } from 'react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';
import PoweredBy from '@/components/PoweredBy';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="bg-gray-50 flex items-center justify-center min-h-screen p-6 font-sans">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-red-100">
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} className="text-red-500" />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Ups! Algo salió mal.</h2>
                <p className="text-gray-500 text-sm mb-8">
                    Ha ocurrido un error inesperado en la aplicación. Nuestro equipo ha sido notificado.
                </p>

                <div className="bg-gray-50 p-4 rounded-xl text-left mb-8 border border-gray-100 overflow-hidden">
                    <p className="text-xs font-mono text-gray-400">Error Digest: {error.digest}</p>
                    <p className="text-xs font-mono text-gray-600 mt-1 truncate">{error.message}</p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition"
                    >
                        Ir al Inicio
                    </button>
                    <button
                        onClick={() => reset()}
                        className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-blue-900/10"
                    >
                        <RefreshCcw size={18} /> Reintentar
                    </button>
                </div>

                <div className="mt-8">
                    <PoweredBy />
                </div>
            </div>
        </div>
    );
}
