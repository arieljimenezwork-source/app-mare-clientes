'use client';

import { useClientConfig } from '@/context/ClientConfigContext';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

/* ─── Layout Dedicado: Perezoso ─── */
const PerezosoClient = dynamic(() => import('@/components/client/layouts/PerezosoClient'), {
  loading: () => <div className="flex h-screen items-center justify-center bg-gray-50 text-slate-900">Cargando...</div>
});

/* ─── Layout Dedicado: Mare Café (Premium Editorial) ─── */
const MareClient = dynamic(() => import('@/components/client/layouts/MareClient'), {
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#8C8B88', fontSize: 14 }}>Cargando Mare...</span>
    </div>
  )
});

/* ─── Layout Genérico (Fallback para futuros clientes) ─── */
const StandardClient = dynamic(() => import('@/components/client/layouts/StandardClient'), {
  loading: () => <div className="flex h-screen items-center justify-center bg-gray-50 text-slate-900">Cargando...</div>
});

export default function ClientPage() {
  const config = useClientConfig();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // 🏭 Factory: enruta al layout dedicado según el código del cliente
  if (config.code === 'perezoso_cafe') {
    return <PerezosoClient />;
  }

  if (config.code === 'mare_cafe') {
    return <MareClient />;
  }

  // Fallback genérico para futuros clientes
  return <StandardClient />;
}
