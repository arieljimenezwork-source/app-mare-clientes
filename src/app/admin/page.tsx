
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

export default function AdminDashboard() {
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

            const { sendCampaign } = await import('../actions/marketing');
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
            const { sendCampaign } = await import('../actions/marketing');
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
        <main className="min-h-screen bg-gray-50 font-sans flex flex-col md:flex-row">

            {/* Sidebar Desktop / Mobile Header */}
            <aside className="md:w-64 bg-[#1E3A8A] text-white flex flex-col md:min-h-screen shadow-2xl z-20">
                <div className="p-6 flex items-center justify-center md:justify-start gap-4 border-b border-blue-800/50">
                    {config.assets?.logo ? (
                        <img
                            src={config.assets.logo}
                            alt="Logo"
                            className="h-56 w-auto object-contain"
                        />
                    ) : (
                        <>
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                <TrendingUp size={18} className="text-[#1E3A8A]" />
                            </div>
                            <div>
                                <h1 className="font-playfair font-bold text-lg tracking-wide">MARE CAFE</h1>
                                <p className="text-xs text-blue-200">Admin Control</p>
                            </div>
                        </>
                    )}
                </div>

                <nav className="flex-1 p-4 grid grid-cols-2 md:flex md:flex-col gap-2 md:gap-3 overflow-y-auto content-start">
                    <button onClick={() => setActiveTab('overview')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 w-full p-2 md:p-3 rounded-xl transition-all duration-300 ${activeTab === 'overview' ? 'bg-white text-[#1E3A8A] font-bold shadow-lg' : 'text-blue-200 hover:bg-blue-800/50'}`}>
                        <TrendingUp size={18} /> <span className="whitespace-nowrap text-[10px] md:text-base">Resumen</span>
                    </button>
                    <button onClick={() => setActiveTab('clients')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 w-full p-2 md:p-3 rounded-xl transition-all duration-300 ${activeTab === 'clients' ? 'bg-white text-[#1E3A8A] font-bold shadow-lg' : 'text-blue-200 hover:bg-blue-800/50'}`}>
                        <Users size={18} /> <span className="whitespace-nowrap text-[10px] md:text-base">Clientes</span>
                    </button>
                    <button onClick={() => setActiveTab('marketing')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 w-full p-2 md:p-3 rounded-xl transition-all duration-300 ${activeTab === 'marketing' ? 'bg-white text-[#1E3A8A] font-bold shadow-lg' : 'text-blue-200 hover:bg-blue-800/50'}`}>
                        <Mail size={18} /> <span className="whitespace-nowrap text-[10px] md:text-base">Novedades</span>
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 w-full p-2 md:p-3 rounded-xl transition-all duration-300 ${activeTab === 'settings' ? 'bg-white text-[#1E3A8A] font-bold shadow-lg' : 'text-blue-200 hover:bg-blue-800/50'}`}>
                        <Settings size={18} /> <span className="whitespace-nowrap text-[10px] md:text-base">Ajustes</span>
                    </button>
                    <button onClick={() => router.push('/staff')} className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 w-full p-2 md:p-3 rounded-xl text-emerald-300 hover:bg-emerald-900/20 transition-all font-semibold">
                        <Scan size={18} /> <span className="whitespace-nowrap text-[10px] md:text-base">Escáner</span>
                    </button>
                    <button onClick={handleLogout} className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 w-full p-2 md:p-3 rounded-xl text-red-300 hover:bg-red-900/20 transition-all">
                        <LogOut size={18} /> <span className="whitespace-nowrap text-[10px] md:text-base">Salir</span>
                    </button>

                    {/* Activity tab - only visible on desktop */}
                    <button onClick={() => setActiveTab('activity')} className={`hidden md:flex flex-row items-center justify-start gap-3 w-full p-3 rounded-xl transition-all duration-300 ${activeTab === 'activity' ? 'bg-white text-[#1E3A8A] font-bold shadow-lg' : 'text-blue-200 hover:bg-blue-800/50'}`}>
                        <Clock size={20} /> <span className="whitespace-nowrap text-base">Actividad</span>
                    </button>

                    <div className="hidden md:block mt-auto pb-4">
                        <PoweredBy />
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto h-[calc(100vh-80px)] md:h-screen bg-[#F8FAFC]">
                <header className="bg-white p-6 shadow-sm flex justify-between items-center sticky top-0 z-10 backdrop-blur-md bg-white/80">
                    <h2 className="text-2xl font-bold text-slate-800">
                        {activeTab === 'overview' && 'Hola, Admin 👋'}
                        {activeTab === 'clients' && 'Base de Datos de Clientes 👥'}
                        {activeTab === 'marketing' && 'Novedades y Eventos 📨'}
                        {activeTab === 'settings' && 'Configuración del Local ⚙️'}
                    </h2>
                    <div className="flex gap-4">
                        <button className="relative p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                            <Bell size={20} className="text-slate-600" />
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <MetricCard
                                    title="Clientes Totales"
                                    value={metrics.totalClients}
                                    icon={<Users size={24} />}
                                    color="bg-blue-500"
                                    trend="+12% este mes"
                                    isActive={activeChart === 'clients'}
                                    onClick={() => setActiveChart('clients')}
                                />
                                <MetricCard
                                    title="Visitas Hoy"
                                    value={metrics.scansToday}
                                    icon={<Scan size={24} />}
                                    color="bg-emerald-500"
                                    trend="En vivo"
                                    isActive={activeChart === 'scans'}
                                    onClick={() => setActiveChart('scans')}
                                />
                                <MetricCard
                                    title="Premios Dados"
                                    value={metrics.redemptionsTotal}
                                    icon={<Gift size={24} />}
                                    color="bg-purple-500"
                                    trend="Fidelidad alta"
                                    isActive={activeChart === 'redemptions'}
                                    onClick={() => setActiveChart('redemptions')}
                                />
                            </div>

                            {/* Chart Section */}
                            <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 transition-all">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">
                                            {activeChart === 'scans' && 'Tendencia de Escaneos'}
                                            {activeChart === 'clients' && 'Crecimiento de Clientes'}
                                            {activeChart === 'redemptions' && 'Historial de Canjes'}
                                        </h3>
                                        <p className="text-slate-400 text-sm">
                                            {activeChart === 'scans' && 'Actividad de visitas diarias.'}
                                            {activeChart === 'clients' && 'Nuevos registros en la plataforma.'}
                                            {activeChart === 'redemptions' && 'Premios entregados por el staff.'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 text-sm">
                                        <span className="font-semibold text-slate-500 px-3 py-1 bg-slate-100 rounded-full">Últimos 7 días</span>
                                    </div>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={activeChart === 'scans' ? '#1E3A8A' : activeChart === 'redemptions' ? '#8B5CF6' : '#3B82F6'} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={activeChart === 'scans' ? '#1E3A8A' : activeChart === 'redemptions' ? '#8B5CF6' : '#3B82F6'} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8' }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                formatter={(value, name) => {
                                                    if (name === 'scans') return [value, 'Escaneos'];
                                                    if (name === 'redeems') return [value, 'Canjes'];
                                                    if (name === 'newClients') return [value, 'Nuevos Clientes'];
                                                    return [value, name];
                                                }}
                                                labelFormatter={(label) => `📅 ${label}`}
                                            />
                                            {/* Conditionally render Areas based on activeChart */}
                                            {activeChart === 'scans' && (
                                                <Area type="monotone" dataKey="scans" stroke="#1E3A8A" strokeWidth={3} fillOpacity={1} fill="url(#colorMain)" animationDuration={1000} />
                                            )}
                                            {activeChart === 'redemptions' && (
                                                <Area type="monotone" dataKey="redeems" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorMain)" animationDuration={1000} />
                                            )}
                                            {activeChart === 'clients' && (
                                                <Area type="monotone" dataKey="newClients" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorMain)" animationDuration={1000} />
                                            )}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CLIENTS TAB (NEW) */}
                    {activeTab === 'clients' && (
                        <ClientsTab />
                    )}

                    {/* MARKETING TAB */}
                    {activeTab === 'marketing' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">

                            {/* Campaign Creator */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                                <div className="xl:col-span-2 space-y-6">
                                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
                                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                            <Send size={24} className="text-blue-600" /> Nueva Campaña
                                        </h3>

                                        <div className="space-y-6">
                                            {/* Audience */}
                                            <div>
                                                <label className="text-sm font-semibold text-slate-600 mb-2 block">Audiencia Objetivo</label>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {['Todos', 'Nivel 2+ (Frecuentes)', 'Nivel 3+ (VIP)'].map((label) => (
                                                        <button
                                                            key={label}
                                                            onClick={() => setActiveAudience(label)}
                                                            className={`py-2 px-4 rounded-xl border text-sm font-medium transition-all ${activeAudience === label ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Template Selection */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-sm font-semibold text-slate-600 block">Selecciona un Diseño (Flyer)</label>
                                                    <label className="cursor-pointer text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1 transition">
                                                        <Plus size={14} /> Subir Propia
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                                    </label>
                                                </div>
                                                {/* Use key to force re-render if needed, but here simple mapping is fine. */}
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {templates.map((src, idx) => (
                                                        <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group border-2 border-transparent hover:border-blue-500 transition-all">
                                                            <img src={src} alt={`Template ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <button
                                                                    onClick={() => openEditor(src)}
                                                                    className="bg-white text-blue-900 text-xs font-bold px-3 py-1 rounded-full hover:scale-105 transition"
                                                                >
                                                                    Usar / Editar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* AI Smart Edit - Keeping as placeholder/beta */}
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 opacity-60 pointer-events-none">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">✨ Agente de Marketing (Próximamente)</h4>
                                                </div>
                                                <p className="text-xs text-slate-400">La IA generará textos y ofertas automáticamente en la próxima versión.</p>
                                            </div>

                                            <button
                                                onClick={handleTestEmail}
                                                className="w-full bg-slate-100 text-slate-600 py-2 rounded-xl font-semibold text-sm hover:bg-slate-200 transition"
                                            >
                                                🧪 Enviar Prueba Rápida (Sin Editor)
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* History & Metrics */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 h-full overflow-y-auto max-h-[800px]">
                                        <h3 className="font-bold text-slate-800 mb-6">Historial de Envíos</h3>
                                        <div className="space-y-6">
                                            {campaigns.length === 0 && (
                                                <div className="text-center text-slate-400 text-sm py-4">No hay campañas enviadas aún.</div>
                                            )}
                                            {campaigns.map((camp) => (
                                                <div key={camp.id} className="group border-b border-slate-50 pb-4 last:border-0">
                                                    <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-gray-100 flex items-center justify-center border border-slate-100">
                                                        {/* We can store image URL in metadata if we want to show it here later. For now placeholder or generic icon */}
                                                        {camp.metadata?.imageUrl ? (
                                                            <img src={camp.metadata.imageUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Mail className="text-slate-300" size={32} />
                                                        )}
                                                        <div className="absolute top-2 right-2">
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${camp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                {camp.status === 'active' ? 'Activa' : 'Inactiva'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 text-sm truncate">{camp.title}</h4>
                                                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                                                        <span>{new Date(camp.created_at).toLocaleDateString()}</span>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={camp.status === 'active'}
                                                                onChange={() => toggleCampaignStatus(camp.id, camp.status)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
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
                            <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Scan size={24} className="text-blue-600" /> Registro de Actividad
                                </h3>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                                <th className="p-4 font-semibold">Fecha y Hora</th>
                                                <th className="p-4 font-semibold">Staff (Simulado)</th>
                                                <th className="p-4 font-semibold">Acción</th>
                                                <th className="p-4 font-semibold">Cliente</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-600 text-sm">
                                            {/* In a real app, map through 'logs' state */}
                                            <tr className="border-b border-slate-50 hover:bg-slate-50 transition">
                                                <td className="p-4">Hoy, 10:42 AM</td>
                                                <td className="p-4 font-medium text-slate-800">Camarero 1</td>
                                                <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">Escaneo</span></td>
                                                <td className="p-4">juan.perez@gmail.com</td>
                                            </tr>
                                            <tr className="border-b border-slate-50 hover:bg-slate-50 transition">
                                                <td className="p-4">Hoy, 09:15 AM</td>
                                                <td className="p-4 font-medium text-slate-800">Admin (Tú)</td>
                                                <td className="p-4"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">Canje Premio</span></td>
                                                <td className="p-4">maria.gomez@hotmail.com</td>
                                            </tr>
                                            <tr className="border-b border-slate-50 hover:bg-slate-50 transition">
                                                <td className="p-4">Ayer, 18:30 PM</td>
                                                <td className="p-4 font-medium text-slate-800">Camarero 2</td>
                                                <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">Escaneo</span></td>
                                                <td className="p-4">carlos.lopez@yahoo.com</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4 text-center">
                                    <p className="text-xs text-slate-400">Mostrando últimos 3 movimientos.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">Reglas de Negocio</h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold text-slate-700">Happy Hour (Puntos Dobles)</h4>
                                                <p className="text-xs text-slate-400">Los clientes suman x2 sellos al escanear.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" value="" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold text-slate-700">Solicitar PIN en Canjes</h4>
                                                <p className="text-xs text-slate-400">Mayor seguridad al entregar premios.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>


                                <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">Credenciales</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-semibold text-slate-600">PIN Maestro (Admin)</label>
                                            <div className="flex gap-2">
                                                <input type="password" value="MARE-ADMIN-2024" disabled className="w-full mt-1 p-2 bg-slate-50 text-slate-500 rounded-lg border border-slate-200" />
                                            </div>
                                            <p className="text-xs text-orange-500 mt-1">Este PIN permite crear nuevos administradores.</p>
                                        </div>
                                        <button className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition">
                                            Actualizar Credenciales
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
            {showEditor && (
                <EmailEditor
                    initialData={editorInitialData}
                    onClose={() => setShowEditor(false)}
                    onSend={handleSendFromEditor}
                    audience={activeAudience}
                    isSending={isSending}
                />
            )}
        </main>
    );
}

function MetricCard({ title, value, icon, color, trend, isActive, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={`bg-white p-5 rounded-3xl shadow-lg border transition-all cursor-pointer flex items-center gap-4 hover:scale-[1.02] ${isActive ? 'border-blue-500 ring-4 ring-blue-50/50' : 'border-slate-50'}`}
        >
            <div className={`p-4 rounded-2xl text-white shadow-md ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-slate-800">{value}</h3>
                </div>
                <p className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">
                    {trend}
                </p>
            </div>
            {isActive && <div className="ml-auto w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>}
        </div>
    );
}
