'use client';

import { useClientConfig } from '@/context/ClientConfigContext';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

/* ─── Dashboard Dedicado: Perezoso ─── */
const PerezosoDashboard = dynamic(() => import('@/components/admin/dashboards/PerezosoDashboard'), {
    loading: () => <div className="flex h-screen items-center justify-center bg-brand-primary text-white font-bold animate-pulse">Cargando Perezoso...</div>
});

/* ─── Dashboard Dedicado: Mare Café (Premium Editorial) ─── */
const MareDashboard = dynamic(() => import('@/components/admin/dashboards/MareDashboard'), {
    loading: () => (
        <div style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#8C8B88', fontSize: 14 }}>Cargando Panel Mare...</span>
        </div>
    )
});

/* ─── Dashboard Genérico (Fallback para futuros clientes) ─── */
const StandardDashboard = dynamic(() => import('@/components/admin/dashboards/StandardDashboard'), {
    loading: () => <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-900 font-medium">Cargando Panel...</div>
});

export default function AdminPage() {
    const config = useClientConfig();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // Avoid hydration mismatch

    // 🏭 Factory: enruta al dashboard dedicado según el código del cliente
    if (config.code === 'perezoso_cafe') {
        return <PerezosoDashboard />;
    }

    if (config.code === 'mare_cafe') {
        return <MareDashboard />;
    }

    // Fallback genérico para futuros clientes
    return <StandardDashboard />;
}
