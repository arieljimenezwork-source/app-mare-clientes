'use client';

import { useEffect } from 'react';
import { ShieldAlert, RefreshCcw } from 'lucide-react';
import PoweredBy from '@/components/PoweredBy';

export default function AdminError({
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
        <div className="bg-slate-50 flex items-center justify-center min-h-[calc(100vh-80px)] md:min-h-screen p-6 font-sans">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-red-100">
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert size={32} className="text-red-500" />
                </div>

                <h2 className="text-xl font-bold text-slate-800 mb-2">Error en el Panel de Administración</h2>
                <p className="text-slate-500 text-sm mb-6">
                    No se pudo cargar el módulo solicitado. Esto puede deberse a un problema de conexión o permisos.
                </p>

                <div className="bg-slate-50 p-3 rounded-lg text-left mb-6 border border-slate-100 overflow-hidden">
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Detalles Técnicos</p>
                    <p className="text-xs font-mono text-slate-600 truncate">{error.message}</p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-800 transition shadow-lg shadow-blue-900/10"
                    >
                        <RefreshCcw size={18} /> Recargar Panel
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-white text-slate-600 font-semibold py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                    >
                        Forzar Recarga Completa
                    </button>
                </div>

                <div className="mt-8 opacity-70">
                    <PoweredBy />
                </div>
            </div>
        </div>
    );
}
