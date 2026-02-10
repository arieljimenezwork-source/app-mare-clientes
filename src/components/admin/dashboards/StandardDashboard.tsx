'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientConfig } from '@/context/ClientConfigContext';
import { ClientConfig } from '@/config/types';
import PoweredBy from '@/components/PoweredBy';
import { Users, Scan, Gift, TrendingUp, LogOut, Mail, Settings, Bell, ChevronRight, Send, Save, CreditCard, Clock, LayoutDashboard, Menu as MenuIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import EmailEditor from '@/components/admin/EmailEditor';
import { Plus } from 'lucide-react';
import ClientsTab from '@/components/admin/ClientsTab';

export default function StandardDashboard() {
    const router = useRouter();
    const config = useClientConfig();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'marketing' | 'settings' | 'activity'>('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Metrics State
    const [metrics, setMetrics] = useState({
        totalClients: 0,
        scansToday: 0,
        redemptionsTotal: 0
    });

    const [chartData, setChartData] = useState<any[]>([]);
    const [activeChart, setActiveChart] = useState<'scans' | 'clients' | 'redemptions'>('scans');

    useEffect(() => {
        const init = async () => {
            // Config is already active via Context

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/auth/login?role=staff'); return; }

            const { data: profile } = await supabase.from('profiles').select('role, client_code').eq('id', user.id).single();
            if (!profile || profile.role !== 'admin') {
                router.push('/staff');
                return;
            }

            // Client Isolation Check
            let isValidUser = true;
            if (config.code === 'perezoso_cafe') {
                if (profile.client_code !== 'perezoso_cafe') isValidUser = false;
            } else if (config.code === 'mare_cafe') {
                if (profile.client_code && profile.client_code !== 'mare_cafe') isValidUser = false;
            } else {
                if (profile.client_code && profile.client_code !== config.code) isValidUser = false;
            }

            if (!isValidUser) {
                alert(`Esta cuenta de administrador no pertenece a ${config.name}.`);
                await supabase.auth.signOut();
                router.push('/');
                return;
            }

            const fetchMetrics = async (cfg: ClientConfig) => {
                // 1. Clients
                let clientQuery = supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer');
                if (cfg.code === 'mare_cafe') {
                    clientQuery = clientQuery.or('client_code.eq.mare_cafe,client_code.is.null');
                } else {
                    clientQuery = clientQuery.eq('client_code', cfg.code);
                }
                const { count: clientCount } = await clientQuery;

                // 2. Scans (Joined with Profiles)
                const today = new Date().toISOString().split('T')[0];
                let scansQuery = supabase.from('transaction_logs')
                    .select('id, profiles!transaction_logs_user_id_fkey!inner(client_code)', { count: 'exact', head: true })
                    .eq('type', 'add_stamp')
                    .gte('created_at', today);

                if (cfg.code === 'mare_cafe') {
                    scansQuery = scansQuery.or('client_code.eq.mare_cafe,client_code.is.null', { foreignTable: 'profiles' });
                } else {
                    scansQuery = scansQuery.eq('profiles.client_code', cfg.code);
                }
                const { count: dailyScans } = await scansQuery;

                // 3. Redemptions
                let redeemsQuery = supabase.from('transaction_logs')
                    .select('id, profiles!transaction_logs_user_id_fkey!inner(client_code)', { count: 'exact', head: true })
                    .eq('type', 'redeem_reward');

                if (cfg.code === 'mare_cafe') {
                    redeemsQuery = redeemsQuery.or('client_code.eq.mare_cafe,client_code.is.null', { foreignTable: 'profiles' });
                } else {
                    redeemsQuery = redeemsQuery.eq('profiles.client_code', cfg.code);
                }
                const { count: redemptions } = await redeemsQuery;

                setMetrics({
                    totalClients: clientCount || 0,
                    scansToday: dailyScans || 0,
                    redemptionsTotal: redemptions || 0
                });
            };

            const fetchChartData = async (cfg: ClientConfig) => {
                const today = new Date();
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(today.getDate() - (6 - i));
                    return d.toISOString().split('T')[0];
                });

                // Fetch logs for the last 7 days
                let logsQuery = supabase
                    .from('transaction_logs')
                    .select('created_at, type, metadata, profiles!transaction_logs_user_id_fkey!inner(client_code)')
                    .gte('created_at', last7Days[0]);

                if (cfg.code === 'mare_cafe') {
                    logsQuery = logsQuery.or('client_code.eq.mare_cafe,client_code.is.null', { foreignTable: 'profiles' });
                } else {
                    logsQuery = logsQuery.eq('profiles.client_code', cfg.code);
                }
                const { data: logs } = await logsQuery;

                let clientsQuery = supabase
                    .from('profiles')
                    .select('created_at')
                    .eq('role', 'customer')
                    .gte('created_at', last7Days[0]);

                if (cfg.code === 'mare_cafe') {
                    clientsQuery = clientsQuery.or('client_code.eq.mare_cafe,client_code.is.null');
                } else {
                    clientsQuery = clientsQuery.eq('client_code', cfg.code);
                }

                const { data: newClients } = await clientsQuery;

                const chartDataMap = last7Days.reduce((acc: any, date) => {
                    const dayName = new Date(date).toLocaleDateString('es-ES', { weekday: 'short' });
                    acc[date] = {
                        name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
                        scans: 0,
                        redeems: 0,
                        newClients: 0
                    };
                    return acc;
                }, {});

                logs?.forEach(log => {
                    const date = log.created_at.split('T')[0];
                    if (chartDataMap[date]) {
                        if (log.type === 'add_stamp') chartDataMap[date].scans += 1;
                        if (log.type === 'redeem_reward') chartDataMap[date].redeems += 1;
                    }
                });

                newClients?.forEach(client => {
                    const date = client.created_at.split('T')[0];
                    if (chartDataMap[date]) {
                        chartDataMap[date].newClients += 1;
                    }
                });

                setChartData(Object.values(chartDataMap));
            };

            await fetchMetrics(config);
            await fetchCampaigns();
            await fetchChartData(config);
            setLoading(false);

            // Realtime Subscriptions
            const changes = supabase
                .channel('admin-dashboard-realtime')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'transaction_logs' },
                    (payload) => {
                        console.log('New transaction:', payload);
                        fetchMetrics(config);
                        fetchChartData(config);
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'profiles' },
                    (payload) => {
                        console.log('New profile:', payload);
                        fetchMetrics(config);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(changes);
            };
        };
        init();
    }, [router, config]);

    const [isSending, setIsSending] = useState(false);
    const [activeAudience, setActiveAudience] = useState('Todos');
    const [showEditor, setShowEditor] = useState(false);
    const [editorInitialData, setEditorInitialData] = useState<any>({});

    // Templates State
    const [templates, setTemplates] = useState<string[]>([
        '/clients/mare_cafe/flyer_template_1_1769954037447.png',
        '/clients/mare_cafe/flyer_template_2_1769954052827.png',
        '/clients/mare_cafe/flyer_template_3_1769954068639.png'
    ]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setTemplates(prev => [...prev, result]);
            };
            reader.readAsDataURL(file);
        }
    };

    const openEditor = (templateUrl: string) => {
        setEditorInitialData({
            imageUrl: templateUrl,
            title: '¡Novedades en Mare Cafe! ☕️',
            content: 'Tenemos nuevas promociones esperándote. Ven y disfruta de un momento especial.'
        });
        setShowEditor(true);
    };

    // Campaigns State
    const [campaigns, setCampaigns] = useState<any[]>([]);

    const fetchCampaigns = async () => {
        const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
        if (data) setCampaigns(data);
    };

    const handleSendFromEditor = async (data: { title: string; content: string; html: string; audience: string; imageUrl?: string }) => {
        if (!confirm('¿Estás seguro de enviar esta campaña a ' + data.audience + '?')) return;

        setIsSending(true);

        try {
            // 1. Create Campaign in DB
            const { data: campaign, error } = await supabase.from('campaigns').insert({
                title: data.title,
                content: data.content,
                audience: data.audience,
                status: 'active',
                metadata: { imageUrl: data.imageUrl || '' } // Store image URL reference
            }).select().single();

            if (error) throw error;

            // 2. Send via Resend (Server Action)
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('content', data.content);
            formData.append('html', data.html);
            formData.append('audience', data.audience);
            formData.append('campaignId', campaign.id);

            const { sendCampaign } = await import('@/app/actions/marketing');
            const result = await sendCampaign(formData);

            if (result.success) {
                alert('✅ ' + result.message);
                setShowEditor(false); // Close editor on success
                fetchCampaigns(); // Refresh list
            } else {
                alert('❌ Error: ' + result.message);
            }
        } catch (e: any) {
            alert('Error inesperado: ' + e.message);
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    const toggleCampaignStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const { error } = await supabase.from('campaigns').update({ status: newStatus }).eq('id', id);

        if (error) {
            alert('Error cambiando estado');
        } else {
            // Optimistic update
            setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
        }
    };

    const handleTestEmail = async () => {
        const email = prompt('Ingresa tu email para la prueba:', 'tu@email.com');
        if (!email) return;

        setIsSending(true);
        const formData = new FormData();
        formData.append('title', '[TEST] Vista Previa Mare Cafe');
        formData.append('content', 'Esta es una PRUEBA de visualización del flyer.');
        formData.append('audience', 'Test');
        formData.append('testEmail', email);

        try {
            const { sendCampaign } = await import('@/app/actions/marketing');
            const result = await sendCampaign(formData);
            alert(result.success ? '✅ ' + result.message : '❌ ' + result.message);
        } catch (e: any) {
            alert('Error: ' + e.message);
        } finally {
            setIsSending(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 text-slate-900 font-medium">Cargando...</div>;

    const tabs = [
        { id: 'overview', label: 'Resumen', icon: <LayoutDashboard size={20} />, enabled: true },
        { id: 'clients', label: 'Clientes', icon: <Users size={20} />, enabled: true },
        { id: 'marketing', label: 'Marketing', icon: <Mail size={20} />, enabled: config.features.marketingEnabled },
        { id: 'activity', label: 'Actividad', icon: <Clock size={20} />, enabled: true },
        { id: 'settings', label: 'Ajustes', icon: <Settings size={20} />, enabled: config.features.adminSettingsEnabled },
    ].filter(tab => tab.enabled);

    // Filter tabs based on Feature Flags? (Can be added later or now)
    // For now we assume standard has them all.

    return (
        <main className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row text-slate-900">

            {/* --- MOBILE HEADER (Standard) --- */}
            <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 h-16">
                <div className="flex items-center gap-3">
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -ml-2 text-slate-600">
                        <MenuIcon size={24} />
                    </button>
                    <span className="font-bold text-lg">{config.name}</span>
                </div>
                <button
                    onClick={() => router.push('/staff')}
                    className="p-2 bg-brand-primary text-white rounded-lg shadow-sm"
                >
                    <Scan size={20} />
                </button>
            </header>

            {/* --- MOBILE MENU OVERLAY --- */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
                    <div className="bg-white w-64 h-full p-4 shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-6 px-2">{config.name}</h2>
                        <nav className="flex-1 space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id as any); setMobileMenuOpen(false); }}
                                    className={`flex items-center gap-3 w-full p-3 rounded-lg text-left ${activeTab === tab.id ? 'bg-slate-100 font-bold text-brand-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 text-slate-500 hover:text-red-600">
                            <LogOut size={20} /> Logout
                        </button>
                    </div>
                </div>
            )}


            {/* --- SIDEBAR (Desktop - Corporate Standard) --- */}
            <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col h-screen sticky top-0 z-40">
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <h1 className="font-bold text-lg truncate text-brand-primary">{config.name}</h1>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-brand-primary text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 space-y-2">
                    <button
                        onClick={() => router.push('/staff')}
                        className="flex items-center gap-3 w-full p-3 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium"
                    >
                        <Scan size={18} />
                        Escáner Staff
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full p-3 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-700 text-sm font-medium"
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 min-h-screen pt-4 md:pt-0 overflow-y-auto w-full px-4 md:px-8 bg-slate-50">

                <header className="hidden md:flex py-8 justify-between items-end border-b border-slate-200 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                        <p className="text-slate-500 mt-1">Gestión administrativa</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <p className="text-sm font-medium">{config.name}</p>
                            <p className="text-xs text-slate-400">Admin</p>
                        </div>
                    </div>
                </header>

                <div className="pb-10 md:pb-8 max-w-6xl mx-auto space-y-8">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Standard Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Clientes Totales</p>
                                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{metrics.totalClients}</h3>
                                        </div>
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <span className="text-green-600 font-medium">Activo</span>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Visitas Hoy</p>
                                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{metrics.scansToday}</h3>
                                        </div>
                                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Scan size={24} /></div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <span className="text-slate-500">Registradas en tiempo real</span>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Premios Canjeados</p>
                                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{metrics.redemptionsTotal}</h3>
                                        </div>
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Gift size={24} /></div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <span className="text-slate-500">Total acumulado</span>
                                    </div>
                                </div>
                            </div>

                            {/* Standard Charts */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-lg text-slate-900 mb-6">Métricas de Rendimiento</h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="scans" stroke="#0ea5e9" fill="#e0f2fe" strokeWidth={2} name="Escaneos" />
                                            <Area type="monotone" dataKey="redeems" stroke="#8b5cf6" fill="#ede9fe" strokeWidth={2} name="Canjes" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CLIENTS TAB */}
                    {activeTab === 'clients' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1">
                            <ClientsTab />
                        </div>
                    )}

                    {/* MARKETING TAB */}
                    {activeTab === 'marketing' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-lg mb-4">Nueva Campaña</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Audiencia</label>
                                            <select
                                                className="w-full border border-slate-300 rounded-lg p-2.5"
                                                value={activeAudience}
                                                onChange={(e) => setActiveAudience(e.target.value)}
                                            >
                                                <option>Todos</option>
                                                <option>Nivel 2+ (Frecuentes)</option>
                                                <option>Nivel 3+ (VIP)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {templates.map((src, idx) => (
                                            <div key={idx} onClick={() => openEditor(src)} className="cursor-pointer border border-slate-200 rounded-lg overflow-hidden hover:border-brand-primary transition">
                                                <img src={src} className="w-full aspect-[3/4] object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* OTHER TABS same as above but simpler container */}
                    {activeTab === 'activity' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center text-slate-500">
                            Activity Log Placeholder (Standard)
                        </div>
                    )}
                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                            <h3 className="font-bold">Ajustes Generales</h3>
                            <p className="text-sm text-slate-500">Configuración estándar para {config.name}</p>
                        </div>
                    )}

                </div>
            </div>


            {
                showEditor && (
                    <EmailEditor
                        initialData={editorInitialData}
                        onClose={() => setShowEditor(false)}
                        onSend={handleSendFromEditor}
                        onSave={async () => { setShowEditor(false); }}
                        audience={activeAudience}
                        isSending={isSending}
                    />
                )
            }
        </main >
    );
}
