'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientConfig } from '@/context/ClientConfigContext';
import { ClientConfig } from '@/config/types';
import PoweredBy from '@/components/PoweredBy';
import Scanner from '@/components/Scanner';
import { Scan, LogOut, Coffee, Clock, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function StaffDashboard() {
    const router = useRouter();
    const config = useClientConfig();
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [scanCount, setScanCount] = useState(0);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const init = async () => {
            // Config from context
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/auth/login?role=staff'); return; }

            const { data: profile } = await supabase.from('profiles').select('role, client_code').eq('id', user.id).single();
            if (!profile || (profile.role !== 'staff' && profile.role !== 'admin')) {
                alert('Acceso denegado: No eres Staff.');
                router.push('/');
                return;
            }

            // Client Isolation Check
            let isValidUser = true;
            if (profile.role !== 'admin') {
                if (config.code === 'perezoso_cafe') {
                    if (profile.client_code !== 'perezoso_cafe') isValidUser = false;
                } else if (config.code === 'mare_cafe') {
                    if (profile.client_code && profile.client_code !== 'mare_cafe') isValidUser = false;
                } else {
                    if (profile.client_code && profile.client_code !== config.code) isValidUser = false;
                }
            }

            if (!isValidUser) {
                alert(`Esta cuenta de staff no pertenece a ${config.name}.`);
                await supabase.auth.signOut();
                router.push('/');
                return;
            }

            if (profile.role === 'admin') {
                setIsAdmin(true);
            }

            await fetchLogs(config, profile.client_code);
            setLoading(false);

            // Realtime Subscription
            const changes = supabase
                .channel('staff-dashboard-realtime')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'transaction_logs' },
                    (payload) => {
                        console.log('New log:', payload);
                        fetchLogs(config, profile.client_code);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(changes);
            };
        };
        init();
    }, [router, config]);

    const fetchLogs = async (cfg: ClientConfig, userClientCode: string) => {
        const today = new Date().toISOString().split('T')[0];
        let query = supabase.from('transaction_logs')
            .select('id, created_at, description, type, profiles!transaction_logs_user_id_fkey!inner(client_code)')
            .order('created_at', { ascending: false })
            .limit(5);

        // Filter by Client Code
        if (cfg.code === 'mare_cafe') {
            query = query.or('client_code.eq.mare_cafe,client_code.is.null', { foreignTable: 'profiles' });
        } else {
            query = query.eq('profiles.client_code', cfg.code);
        }

        const { data } = await query;
        if (data) setRecentLogs(data);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const handleScanOperation = async (targetId: string, force = false): Promise<any> => {
        const { data, error } = await supabase.rpc('add_stamp', { target_user_id: targetId, force_override: force });
        if (error) return { success: false, message: error.message };
        return data;
    };

    const handleRedemption = async (targetId: string) => {
        const { data, error } = await supabase.rpc('redeem_reward', { target_user_id: targetId });
        if (error) return { success: false, message: error.message };
        return data;
    };

    const handleScan = async (scannedData: string) => {
        if (!config) return;

        let targetUserId = scannedData;
        let isJson = false;
        let parsedData: any = {};

        // 1. TRY TO PARSE JSON
        try {
            if (scannedData.startsWith('{')) {
                parsedData = JSON.parse(scannedData);
                isJson = true;

                // Extract UID if available (This fixes the "invalid input syntax for type uuid" error)
                if (parsedData.uid) {
                    targetUserId = parsedData.uid;
                }
            }
        } catch (e) {
            // Not JSON, treat as raw UUID string
        }

        // 2. PROMO FLOW
        if (isJson && parsedData.type === 'promo') {
            // --- PROMO REDEMPTION FLOW ---
            const { campaignId, user } = parsedData;

            // 1. Verify Campaign Status
            const { data: campaign, error } = await supabase.from('campaigns').select('status, title').eq('id', campaignId).single();

            if (error || !campaign) {
                alert('❌ Error: Campaña no encontrada o inválida.');
                setShowScanner(false);
                return;
            }

            if (campaign.status !== 'active') {
                alert(`❌ PROMOCIÓN VENCIDA O INACTIVA\n\nCampaña: ${campaign.title}\nEstado: ${campaign.status}`);
                setShowScanner(false);
                return;
            }

            // 2. Validate User
            const confirmRedeem = confirm(`✅ PROMOCIÓN VÁLIDA\n\nCampaña: ${campaign.title}\nUsuario: ${user}\n\n¿Registrar canje?`);

            if (confirmRedeem) {
                // Log usage
                // Try to find UUID from email if user is email
                let logUserId = user;
                // Simple regex to check if user is UUID or Email
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user);

                if (!isUuid) {
                    const { data: profile } = await supabase.from('profiles').select('id').eq('email', user).single();
                    if (profile) logUserId = profile.id;
                    // If not found, we might fail FK or insert with email if allowed? Assuming UUID required.
                }

                await supabase.from('transaction_logs').insert({
                    user_id: logUserId,
                    type: 'promo_redeem',
                    description: `Canje Promoción: ${campaign.title}`
                });

                alert('✅ Canje registrado exitosamente.');
                setScanCount(prev => prev + 1);
            }
            setShowScanner(false);
            return;
        }

        // --- NORMAL USER FLOW (STAMP) ---
        // Use targetUserId which is now the clean UUID

        // 1. Check current stamps first
        const { data: stampData } = await supabase.from('stamps').select('count').eq('user_id', targetUserId).single();
        const currentStamps = stampData?.count || 0;

        // 2. REWARD LOGIC: Dynamic from config
        const stampsNeeded = config.rules.stampsPerReward;
        if (currentStamps >= stampsNeeded) {
            const wantsToRedeem = confirm(`🎉 ¡PREMIO DISPONIBLE! 🎉\n\nEl cliente tiene ${currentStamps} sellos.\n¿Desea canjear el Café Gratis ahora?`);

            if (wantsToRedeem) {
                const pin = prompt('🔐 Autorización Requerida\nIngrese PIN de Admin para canjear:');
                const { data: verification } = await supabase.rpc('verify_shop_pin', { input_pin: pin, shop_code: config.code });

                if (verification?.valid && verification?.role === 'admin') {
                    const result = await handleRedemption(targetUserId);
                    if (result.success) {
                        alert('✅ ' + result.message);
                        setScanCount(prev => prev + 1); // Count as activity
                        setShowScanner(false);
                        return;
                    } else {
                        alert('❌ Error: ' + result.message);
                        return;
                    }
                } else {
                    alert('PIN Incorrecto o insuficientes permisos. Canje cancelado.');
                    return;
                }
            }
            // If they chose NO, we proceed to try adding a stamp (normal flow)? 
            const addStampInstead = confirm('¿Desea sumar un punto normal en su lugar?');
            if (!addStampInstead) {
                setShowScanner(false);
                return;
            }
        }

        // 3. Normal ADD STAMP Logic (Existing)
        const result = await handleScanOperation(targetUserId, false);

        if (result.success) {
            alert('¡Sello agregado correctamente!');
            setScanCount(prev => prev + 1);
            setShowScanner(false);
        } else if (result.code === 'COOLDOWN_ACTIVE') {
            const pin = prompt(`⚠️ BLOQUEADO POR REGLA 24HS.\nEste cliente ya sumó hoy.\n\nPara autorizar excepción, ingrese PIN de Admin:`);
            const { data: verification } = await supabase.rpc('verify_shop_pin', { input_pin: pin, shop_code: config.code });

            if (verification?.valid && verification?.role === 'admin') {
                const overrideResult = await handleScanOperation(targetUserId, true);
                if (overrideResult.success) {
                    alert('✅ Excepción Autorizada. Sello agregado.');
                    setScanCount(prev => prev + 1);
                    setShowScanner(false);
                } else {
                    alert('Error al forzar: ' + overrideResult.message);
                }
            } else {
                alert('PIN Incorrecto o insuficientes permisos.');
            }
        } else {
            alert('Error: ' + result.message);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;

    return (
        <main className="min-h-screen bg-gray-50 font-sans">
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {config.assets?.logo ? (
                        <img
                            src={config.assets.logo}
                            alt={config.name}
                            className="h-24 w-auto object-contain"
                        />
                    ) : (
                        <div className="bg-black text-white p-2 rounded-lg"><Coffee size={20} /></div>
                    )}
                    <span className="font-bold text-gray-800 text-lg">Staff Portal</span>
                </div>
                <div className="flex items-center gap-4">
                    {isAdmin && (
                        <button
                            onClick={() => router.push('/admin')}
                            className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                        >
                            Volver a Admin
                        </button>
                    )}
                    <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-red-600 transition">Cerrar Sesión</button>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto p-6 space-y-8">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-400 text-sm font-medium uppercase">Tus Escaneos (Hoy)</h3>
                        <p className="text-4xl font-bold mt-2">{scanCount}</p>
                    </div>


                    <button onClick={() => setShowScanner(true)} className="group relative overflow-hidden bg-brand-primary text-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-all">
                        <div><h3 className="text-white/90 font-medium text-lg font-brand">Escanear Cliente</h3><p className="text-white/60 text-sm font-brand">Cámara o ingreso manual</p></div>
                        <div className="bg-white/20 p-3 rounded-full group-hover:scale-110 transition-transform"><Scan size={32} /></div>
                    </button>
                </section>

                <section>
                    <h3 className="font-semibold text-gray-800 mb-4">Actividad Reciente</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                        {recentLogs.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Clock className="mx-auto mb-2 opacity-50" size={32} />
                                <p>No hay actividad reciente.</p>
                            </div>
                        ) : (
                            recentLogs.map((log) => (
                                <div key={log.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-800 text-sm">{log.description}</p>
                                        <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleTimeString()}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.type === 'add_stamp' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                                        {log.type === 'add_stamp' ? 'Sello' : 'Canje'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {showScanner && <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

            <div className="pb-6">
                <PoweredBy />
            </div>
        </main>
    );
}
