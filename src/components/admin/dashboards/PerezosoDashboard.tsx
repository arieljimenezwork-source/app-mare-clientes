'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientConfig } from '@/context/ClientConfigContext';
import { ClientConfig } from '@/config/types';
import PoweredBy from '@/components/PoweredBy';
import { Users, Scan, Gift, TrendingUp, LogOut, Mail, Settings, Bell, ChevronRight, Send, Save, CreditCard, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import EmailEditor from '@/components/admin/EmailEditor';
import { Plus } from 'lucide-react';
import ClientsTab from '@/components/admin/ClientsTab';

export default function PerezosoDashboard() {
    const router = useRouter();
    const config = useClientConfig();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'marketing' | 'settings' | 'activity'>('overview');

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
            // Note: We might want to pass campaignId to the action to generate the dynamic QR link
            // For now, let's append campaignId to FormData so the action can incorporate it
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('content', data.content);
            formData.append('html', data.html);
            formData.append('audience', data.audience);
            formData.append('campaignId', campaign.id); // Valid UUID

            const { sendCampaign } = await import('@/app/actions/marketing');
            const result = await sendCampaign(formData);

            if (result.success) {
                alert('✅ ' + result.message);
                setShowEditor(false); // Close editor on success
                fetchCampaigns(); // Refresh list
            } else {
                alert('❌ Error: ' + result.message);
                // Optional: rollback DB creation if email fails? Or just leave it as draft?
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

    // Keep legacy handle for the direct "Enviar Campaña" button if needed, 
    // or we can remove the old UI section. For now, let's keep the tool but disable the old button to force using the editor?
    // Actually the user wanted "que cuando se apreta 'usar' salga un editor".

    const handleSendCampaign = async () => {
        // This was the old direct send. Let's redirect to editor or keep as "Quick Send"
        // For now, let's just leave it but maybe we don't need it if we have the editor.
        // User said: "me gustaria que las 3 portadas... se puedan editar... o sale un editor"
        // So the main flow should be via templates.
        alert("Por favor selecciona un diseño para editar y enviar.");
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

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 text-blue-900 font-bold animate-pulse">Cargando Panel...</div>;

    return (
        <main className="min-h-screen bg-gray-50 font-sans flex flex-col md:flex-row pb-20 md:pb-0">


            {/* --- MOBILE HEADER (Dynamic Theming of Glassmorphism and Colors) --- */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md z-30 flex items-center justify-between px-6 rounded-b-3xl shadow-sm border-b border-white/20">
                <div className="flex items-center gap-3">
                    {config.assets?.logo ? (
                        <img src={config.assets.logo} alt="Logo" className="h-12 w-auto object-contain drop-shadow-sm" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-brand font-bold text-xl shadow-md">
                            {config.name.charAt(0)}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <h1 className="font-brand font-bold text-brand-primary text-xl tracking-tight leading-none">
                            {activeTab === 'overview' && 'Hola, Admin! 👋'}
                            {activeTab === 'clients' && 'Tus Clientes 👥'}
                            {activeTab === 'marketing' && 'Novedades ✨'}
                            {activeTab === 'settings' && 'Ajustes ⚙️'}
                            {activeTab === 'activity' && 'Actividad 🕒'}
                        </h1>
                        <p className="text-brand-secondary text-opacity-80 text-xs font-medium">{config.name}</p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/staff')}
                    className="relative p-2 rounded-2xl bg-orange-50 hover:bg-orange-100 transition shadow-sm border border-orange-200"
                >
                    <Scan size={20} className="text-brand-primary" />
                </button>
            </header>


            {/* --- SIDEBAR (Desktop Only - Dynamic) --- */}
            <aside
                className="hidden md:flex w-72 text-white flex-col h-screen sticky top-0 shadow-xl z-40 transition-all duration-300 bg-brand-primary"
            >
                <div className="h-24 flex items-center justify-center px-6 border-b border-white/10">
                    {config.assets?.logo ? (
                        <img
                            src={config.assets.logo}
                            alt="Logo"
                            className="h-16 w-auto object-contain transition-transform hover:scale-105 duration-500"
                        />
                    ) : (
                        <h1 className="font-brand font-bold text-2xl tracking-wide">{config.name}</h1>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavButton
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                        icon={<TrendingUp size={20} />}
                        label="Resumen de Negocio"
                        themeColor="var(--brand-primary)"
                    />
                    <NavButton
                        active={activeTab === 'clients'}
                        onClick={() => setActiveTab('clients')}
                        icon={<Users size={20} />}
                        label="Base de Clientes"
                        themeColor="var(--brand-primary)"
                    />
                    {config.features.marketingEnabled && (
                        <NavButton
                            active={activeTab === 'marketing'}
                            onClick={() => setActiveTab('marketing')}
                            icon={<Mail size={20} />}
                            label="Campañas & Novedades"
                            themeColor="var(--brand-primary)"
                        />
                    )}
                    <NavButton
                        active={activeTab === 'activity'}
                        onClick={() => setActiveTab('activity')}
                        icon={<Clock size={20} />}
                        label="Actividad Reciente"
                        themeColor="var(--brand-primary)"
                    />
                    {config.features.adminSettingsEnabled && (
                        <NavButton
                            active={activeTab === 'settings'}
                            onClick={() => setActiveTab('settings')}
                            icon={<Settings size={20} />}
                            label="Configuración"
                            themeColor="var(--brand-primary)"
                        />
                    )}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-2">
                    <button
                        onClick={() => router.push('/staff')}
                        className="flex items-center gap-3 w-full p-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all group"
                    >
                        <Scan size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="font-medium text-sm">Ir al Escáner</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full p-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all group"
                    >
                        <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="font-medium text-sm">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 min-h-screen bg-[#F8FAFC] pt-16 md:pt-0 overflow-y-auto w-full">

                {/* Desktop Header */}
                <header className="hidden md:flex bg-white/80 backdrop-blur-md sticky top-0 z-20 px-8 py-5 border-b border-slate-100 justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {activeTab === 'overview' && 'Hola, Admin 👋'}
                            {activeTab === 'clients' && 'Gestión de Clientes'}
                            {activeTab === 'marketing' && 'Marketing & Novedades'}
                            {activeTab === 'settings' && 'Ajustes de Tienda'}
                            {activeTab === 'activity' && 'Historial de Actividad'}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden lg:block">
                            <p className="text-sm font-bold text-slate-700">Cuenta Administrativa</p>
                            <p className="text-xs text-slate-400">{config.name}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shadow-sm">
                            <img src={`https://ui-avatars.com/api/?name=Admin&background=random`} alt="Admin" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto pb-28 md:pb-8 pt-24 md:pt-0"> {/* Added pt-24 for fixed header */}

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
                            {/* Key Metrics (Super Lindo Style) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                <MetricCard
                                    title="Clientes Totales"
                                    value={metrics.totalClients}
                                    icon={<Users size={24} />}
                                    color="bg-[#81D4FA] text-[#01579B]" // Pastel Blue
                                    bgStyle="bg-[#E1F5FE]"
                                    trend="+12% este mes"
                                    trendColor="text-[#0277BD] bg-[#B3E5FC]"
                                    isActive={activeChart === 'clients'}
                                    onClick={() => setActiveChart('clients')}
                                />
                                <MetricCard
                                    title="Visitas Hoy"
                                    value={metrics.scansToday}
                                    icon={<Scan size={24} />}
                                    color="bg-[#A5D6A7] text-[#1B5E20]" // Pastel Green
                                    bgStyle="bg-[#E8F5E9]"
                                    trend="En vivo"
                                    trendColor="text-[#2E7D32] bg-[#C8E6C9]"
                                    isActive={activeChart === 'scans'}
                                    onClick={() => setActiveChart('scans')}
                                />
                                <MetricCard
                                    title="Premios Dados"
                                    value={metrics.redemptionsTotal}
                                    icon={<Gift size={24} />}
                                    color="bg-[#CE93D8] text-[#4A148C]" // Pastel Purple
                                    bgStyle="bg-[#F3E5F5]"
                                    trend="Fidelidad alta"
                                    trendColor="text-[#7B1FA2] bg-[#E1BEE7]"
                                    isActive={activeChart === 'redemptions'}
                                    onClick={() => setActiveChart('redemptions')}
                                />
                            </div>

                            {/* Chart Section (Rounded & Soft) */}
                            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                                    <div>
                                        <h3 className="text-xl font-fredoka font-bold text-[#5D4037]">
                                            {activeChart === 'scans' && 'Tendencia de Escaneos'}
                                            {activeChart === 'clients' && 'Crecimiento de Clientes'}
                                            {activeChart === 'redemptions' && 'Historial de Canjes'}
                                        </h3>
                                        <p className="text-[#A1887F] text-sm mt-1">
                                            {activeChart === 'scans' && 'Actividad de visitas diarias.'}
                                            {activeChart === 'clients' && 'Nuevos registros en la plataforma.'}
                                            {activeChart === 'redemptions' && 'Premios entregados por el staff.'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 text-xs font-bold text-[#8D6E63] bg-[#EFEBE9] px-4 py-2 rounded-full border border-[#D7CCC8]">
                                        Últimos 7 días
                                    </div>
                                </div>
                                <div className="h-[250px] md:h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={activeChart === 'scans' ? '#A5D6A7' : activeChart === 'redemptions' ? '#CE93D8' : '#81D4FA'} stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor={activeChart === 'scans' ? '#A5D6A7' : activeChart === 'redemptions' ? '#CE93D8' : '#81D4FA'} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A1887F', fontSize: 12, fontFamily: 'Fredoka' }} dy={10} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '16px', fontFamily: 'Fredoka' }}
                                                itemStyle={{ fontSize: '14px', fontWeight: 600, color: '#5D4037' }}
                                                labelStyle={{ color: '#A1887F', marginBottom: '8px', fontSize: '12px' }}
                                                formatter={(value, name) => {
                                                    if (name === 'scans') return [value, 'Escaneos'];
                                                    if (name === 'redeems') return [value, 'Canjes'];
                                                    if (name === 'newClients') return [value, 'Nuevos Clientes'];
                                                    return [value, name];
                                                }}
                                                labelFormatter={(label) => `📅 ${label}`}
                                            />
                                            {activeChart === 'scans' && (
                                                <Area type="monotone" dataKey="scans" stroke="#4CAF50" strokeWidth={4} fillOpacity={1} fill="url(#colorMain)" animationDuration={1000} />
                                            )}
                                            {activeChart === 'redemptions' && (
                                                <Area type="monotone" dataKey="redeems" stroke="#9C27B0" strokeWidth={4} fillOpacity={1} fill="url(#colorMain)" animationDuration={1000} />
                                            )}
                                            {activeChart === 'clients' && (
                                                <Area type="monotone" dataKey="newClients" stroke="#2196F3" strokeWidth={4} fillOpacity={1} fill="url(#colorMain)" animationDuration={1000} />
                                            )}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CLIENTS TAB (NEW) */}
                    {activeTab === 'clients' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <ClientsTab />
                        </div>
                    )}

                    {/* MARKETING TAB */}
                    {activeTab === 'marketing' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">

                            {/* Campaign Creator */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">

                                <div className="xl:col-span-2 space-y-6">
                                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                                        <h3 className="text-xl font-fredoka font-bold text-[#5D4037] mb-6 flex items-center gap-2">
                                            <div className="p-2 bg-[#E1F5FE] rounded-xl text-[#0288D1]"><Send size={20} /></div> Nueva Campaña
                                        </h3>

                                        <div className="space-y-8">
                                            {/* Audience */}
                                            <div>
                                                <label className="text-xs font-bold text-[#A1887F] uppercase tracking-wider mb-3 block">1. Audiencia Objetivo</label>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {['Todos', 'Nivel 2+ (Frecuentes)', 'Nivel 3+ (VIP)'].map((label) => (
                                                        <button
                                                            key={label}
                                                            onClick={() => setActiveAudience(label)}
                                                            className={`py-3 px-4 rounded-xl border text-sm font-bold font-fredoka transition-all ${activeAudience === label ? 'bg-[#5D4037] border-[#5D4037] text-white shadow-lg shadow-orange-100' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Template Selection */}
                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-xs font-bold text-[#A1887F] uppercase tracking-wider block">2. Selecciona Diseño</label>
                                                    <label className="cursor-pointer text-xs font-bold text-[#5D4037] hover:bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 flex items-center gap-1 transition">
                                                        <Plus size={14} /> Subir Imagen
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {templates.map((src, idx) => (
                                                        <div key={idx} className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-all border border-slate-100">
                                                            <img src={src} alt={`Template ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                                <button
                                                                    onClick={() => openEditor(src)}
                                                                    className="bg-white text-slate-900 text-sm font-bold px-5 py-2 rounded-full hover:scale-105 transition shadow-lg font-fredoka"
                                                                >
                                                                    Usar Diseño
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleTestEmail}
                                                className="w-full bg-[#EFEBE9] text-[#5D4037] py-3 rounded-xl font-fredoka font-bold text-sm hover:bg-[#D7CCC8] transition border border-[#D7CCC8]"
                                            >
                                                🧪 Enviar Prueba Rápida
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* History & Metrics */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-full overflow-y-auto max-h-[800px]">
                                        <h3 className="font-bold text-[#5D4037] mb-6 flex items-center gap-2 font-fredoka">
                                            <Mail size={20} className="text-[#A1887F]" /> Historial de Envíos
                                        </h3>
                                        <div className="space-y-4">
                                            {campaigns.length === 0 && (
                                                <div className="text-center text-[#A1887F] text-sm py-10 border-2 border-dashed border-[#D7CCC8] rounded-2xl">
                                                    No hay campañas enviadas aún.
                                                </div>
                                            )}
                                            {campaigns.map((camp) => (
                                                <div key={camp.id} className="group p-3 rounded-2xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer">
                                                    <div className="flex gap-4">
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                                                            {camp.metadata?.imageUrl ? (
                                                                <img src={camp.metadata.imageUrl} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-300"><Mail size={20} /></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="font-bold text-[#5D4037] text-sm truncate pr-2 font-fredoka">{camp.title}</h4>
                                                                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 scale-75 origin-right">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={camp.status === 'active'}
                                                                        onChange={() => toggleCampaignStatus(camp.id, camp.status)}
                                                                        className="sr-only peer"
                                                                    />
                                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8D6E63]"></div>
                                                                </label>
                                                            </div>
                                                            <p className="text-xs text-[#A1887F] mt-1 line-clamp-1">{camp.content}</p>
                                                            <div className="flex justify-between items-center mt-2">
                                                                <span className="text-[10px] text-[#D7CCC8] font-medium">{new Date(camp.created_at).toLocaleDateString()}</span>
                                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${camp.status === 'active' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-slate-100 text-slate-500'}`}>
                                                                    {camp.status === 'active' ? 'Activa' : 'Inactiva'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* STAFF ACTIVITY TAB */}
                    {activeTab === 'activity' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                <h3 className="text-xl font-bold text-[#5D4037] mb-6 flex items-center gap-2 font-fredoka">
                                    <div className="p-2 bg-[#E8F5E9] rounded-lg text-[#2E7D32]"><Scan size={20} /></div> Registro de Actividad
                                </h3>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[#A1887F] text-xs font-bold uppercase tracking-wider">
                                                <th className="p-4">Fecha y Hora</th>
                                                <th className="p-4">Staff</th>
                                                <th className="p-4">Acción</th>
                                                <th className="p-4">Cliente</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-600 text-sm">
                                            {/* In a real app, map through 'logs' state */}
                                            <tr className="border-b border-slate-50 hover:bg-slate-50 transition font-medium">
                                                <td className="p-4 whitespace-nowrap text-[#5D4037]">Hoy, 10:42 AM</td>
                                                <td className="p-4 text-[#5D4037]">Camarero 1</td>
                                                <td className="p-4"><span className="bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full text-xs font-bold font-fredoka">Escaneo ✨</span></td>
                                                <td className="p-4 text-[#8D6E63]">juan.perez@gmail.com</td>
                                            </tr>
                                            <tr className="border-b border-slate-50 hover:bg-slate-50 transition font-medium">
                                                <td className="p-4 whitespace-nowrap text-[#5D4037]">Hoy, 09:15 AM</td>
                                                <td className="p-4 text-[#5D4037]">Admin (Tú)</td>
                                                <td className="p-4"><span className="bg-[#F3E5F5] text-[#7B1FA2] px-3 py-1 rounded-full text-xs font-bold font-fredoka">Canje Premio 🎁</span></td>
                                                <td className="p-4 text-[#8D6E63]">maria.gomez@hotmail.com</td>
                                            </tr>
                                            <tr className="border-b border-slate-50 hover:bg-slate-50 transition font-medium">
                                                <td className="p-4 whitespace-nowrap text-[#5D4037]">Ayer, 18:30 PM</td>
                                                <td className="p-4 text-[#5D4037]">Camarero 2</td>
                                                <td className="p-4"><span className="bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full text-xs font-bold font-fredoka">Escaneo ✨</span></td>
                                                <td className="p-4 text-[#8D6E63]">carlos.lopez@yahoo.com</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4 text-center">
                                    <button className="text-xs font-bold text-[#A1887F] hover:text-[#5D4037] transition font-fredoka">MOSTRAR MÁS</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                    <h3 className="text-lg font-bold text-[#5D4037] mb-6 border-b border-slate-50 pb-4 flex items-center gap-2 font-fredoka">
                                        <Settings size={20} className="text-[#A1887F]" /> Reglas de Negocio
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition">
                                            <div>
                                                <h4 className="font-bold text-[#5D4037] text-sm font-fredoka">Happy Hour (Puntos Dobles)</h4>
                                                <p className="text-xs text-[#A1887F] mt-1">Los clientes suman x2 sellos al escanear.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" value="" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8D6E63]"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition">
                                            <div>
                                                <h4 className="font-bold text-[#5D4037] text-sm font-fredoka">Solicitar PIN en Canjes</h4>
                                                <p className="text-xs text-[#A1887F] mt-1">Mayor seguridad al entregar premios.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8D6E63]"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>


                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                    <h3 className="text-lg font-bold text-[#5D4037] mb-6 border-b border-slate-50 pb-4 flex items-center gap-2 font-fredoka">
                                        <Users size={20} className="text-[#A1887F]" /> Credenciales Staff
                                    </h3>
                                    <div className="space-y-4">
                                        <p className="text-sm text-[#A1887F]">
                                            Desde aquí puedes regenerar los PINs de acceso para los camareros.
                                        </p>
                                        <button className="w-full py-4 rounded-xl bg-[#5D4037] text-white font-bold text-sm hover:bg-[#4E342E] transition shadow-lg shadow-orange-100 font-fredoka">
                                            Actualizar Credenciales Tienda
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                </div>
            </div>

            {/* --- MOBILE BOTTOM NAVIGATION (Super Lindo / Floating Dock) --- */}
            <nav className="md:hidden fixed bottom-6 left-4 right-4 h-[72px] bg-white/90 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex justify-between items-center px-2 z-40">
                <MobileNavItem
                    active={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                    icon={<TrendingUp size={24} />}
                    label="Inicio"
                    color="#5D4037"
                />
                <MobileNavItem
                    active={activeTab === 'clients'}
                    onClick={() => setActiveTab('clients')}
                    icon={<Users size={24} />}
                    label="Clientes"
                    color="#5D4037"
                />

                {/* Spacer for FAB */}
                <div className="w-12"></div>

                {/* FAB is now positioned absolutely relative to the viewport or nav, but here we can stick it in the middle visually */}
                <button
                    onClick={() => router.push('/staff')}
                    className="absolute left-1/2 -translate-x-1/2 -top-6 w-16 h-16 bg-brand-primary rounded-full shadow-[0_8px_20px_rgba(93,64,55,0.4)] flex items-center justify-center text-white border-4 border-[#F5F5F5] transition-transform active:scale-95"
                >
                    <Scan size={28} />
                </button>

                {config.features.marketingEnabled && (
                    <MobileNavItem
                        active={activeTab === 'marketing'}
                        onClick={() => setActiveTab('marketing')}
                        icon={<Mail size={24} />}
                        label="Promo"
                        color="var(--brand-primary)"
                    />
                )}
                {config.features.adminSettingsEnabled && (
                    <MobileNavItem
                        active={activeTab === 'settings'}
                        onClick={() => setActiveTab('settings')}
                        icon={<Settings size={24} />}
                        label="Ajustes"
                        color="var(--brand-primary)"
                    />
                )}
            </nav>


            {
                showEditor && (
                    <EmailEditor
                        initialData={editorInitialData}
                        onClose={() => setShowEditor(false)}
                        onSend={handleSendFromEditor}
                        audience={activeAudience}
                        isSending={isSending}
                    />
                )
            }
        </main >
    );
}

// --- Helper Components ---

function NavButton({ active, onClick, icon, label, themeColor }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-4 w-full p-3.5 rounded-xl transition-all duration-200 group ${active ? 'bg-white font-bold shadow-lg transform scale-105' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
            style={{ color: active ? themeColor : undefined }}
        >
            <div className={`${active ? '' : 'opacity-70 group-hover:opacity-100'}`}>{icon}</div>
            <span className="text-sm">{label}</span>
        </button>
    );
}


function MobileNavItem({ active, onClick, icon, label, color }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 h-full rounded-2xl ${active ? 'bg-orange-50 -translate-y-2 pb-2' : 'hover:bg-slate-50'}`}
        >
            <div className={`p-1.5 rounded-full transition-colors ${active ? 'bg-brand-primary text-white shadow-md' : 'text-brand-secondary text-opacity-60'}`}>
                {icon}
            </div>
            {active && <span className="text-[10px] font-bold text-brand-primary font-brand animate-in fade-in zoom-in duration-300">{label}</span>}
        </button>
    );
}

function MetricCard({ title, value, icon, color, bgStyle, trend, trendColor, isActive, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={`bg-white p-5 rounded-[2rem] shadow-sm border transition-all cursor-pointer flex items-center gap-4 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] ${isActive ? 'border-brand-primary ring-4 ring-orange-100' : 'border-slate-50'}`}
        >
            <div className={`p-4 rounded-2xl shadow-inner ${color} ${bgStyle}`}>
                {icon}
            </div>
            <div>
                <p className="text-brand-secondary text-opacity-60 text-[10px] font-bold uppercase tracking-wider font-brand">{title}</p>
                <h3 className="text-3xl font-black text-brand-primary leading-tight font-brand">{value}</h3>
                <p className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${trendColor ? trendColor : (trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500')}`}>
                    {trend}
                </p>
            </div>
        </div>
    );
}
