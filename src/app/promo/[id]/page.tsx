'use client';

import { Suspense, useEffect, useState } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import { useClientConfig } from '@/context/ClientConfigContext';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function PromoContent({ params }: { params: { id: string } }) {
    const [status, setStatus] = useState<'loading' | 'active' | 'inactive' | 'error'>('loading');
    const [campaign, setCampaign] = useState<any>(null);
    const searchParams = useSearchParams();
    const userEmail = searchParams.get('user');
    const config = useClientConfig();

    useEffect(() => {
        const checkCampaign = async () => {
            if (!params.id || !userEmail) {
                setStatus('error');
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('campaigns')
                    .select('*')
                    .eq('id', params.id)
                    .single();

                if (error || !data) {
                    setStatus('error');
                    return;
                }

                setCampaign(data);
                setStatus(data.status === 'active' ? 'active' : 'inactive');
            } catch (err) {
                setStatus('error');
            }
        };

        checkCampaign();
    }, [params.id, userEmail]);

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="text-center space-y-4 max-w-md">
                    <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-red-600">
                        <AlertCircle size={32} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">Enlace no válido</h1>
                    <p className="text-gray-500">No pudimos encontrar la promoción solicitada.</p>
                </div>
            </div>
        );
    }

    if (status === 'inactive') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="text-center space-y-4 max-w-md">
                    <div className="bg-gray-200 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-gray-500">
                        <AlertCircle size={32} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">Promoción Finalizada</h1>
                    <p className="text-gray-500">Lo sentimos, esta campaña {campaign?.title} ya no está disponible.</p>
                </div>
            </div>
        );
    }

    // QR Data Payload
    const qrPayload = JSON.stringify({
        type: 'promo',
        campaignId: campaign.id,
        user: userEmail,
        timestamp: Date.now() // Prevent replay attacks if we check this in scanner
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 w-full h-64 bg-blue-900 rounded-b-[40px] z-0" style={{ backgroundColor: config.theme.primaryColor }}></div>

            <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm z-10 text-center space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4 flex flex-col items-center">
                    {config.assets?.logo ? (
                        <div className="w-48 h-48 mb-4 relative">
                            <img
                                src={config.assets.logo}
                                alt={config.name}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ) : (
                        <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">{config.name}</h2>
                    )}
                    <h1 className="text-2xl font-black text-gray-800 leading-tight">{campaign.title}</h1>
                </div>

                <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-gray-200 inline-block relative group">
                    <QRCodeSVG value={qrPayload} size={200} level="H" className="mx-auto" />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap flex items-center gap-1">
                        <CheckCircle2 size={12} /> Listo para Canjear
                    </div>
                </div>

                <p className="text-sm text-gray-500">
                    Muestra este código QR al staff para validar tu beneficio.
                </p>
            </div>

            <p className="mt-8 text-xs text-center text-gray-400 z-10">
                Usuario: {userEmail}
            </p>
        </div>
    );
}

export default function PromoPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Cargando...</div>}>
            <PromoContent params={params} />
        </Suspense>
    );
}
