'use client';

/**
 * MareDashboard.tsx — Panel de Administración Premium para Mare Café
 * 
 * Diseño editorial: Royal Deep Blue + Parchment Cream + tipografía serif/sans pairing.
 * Sidebar con gradiente ocean, cards con bordes sutiles, charts con paleta Mare.
 * 
 * AISLAMIENTO: Componente 100% independiente. No modifica Perezoso ni StandardDashboard.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientConfig } from '@/context/ClientConfigContext';
import { ClientConfig } from '@/config/types';
import PoweredBy from '@/components/PoweredBy';
import {
    Users, Scan, Gift, TrendingUp, LogOut, Mail, Settings, Bell,
    Send, Clock, LayoutDashboard, Menu as MenuIcon, Plus, ChevronRight, Package, Award
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import EmailEditor from '@/components/admin/EmailEditor';
import ClientsTab from '@/components/admin/ClientsTab';
import ProductsTab from '@/components/admin/ProductsTab';
import LoyaltyTab from '@/components/admin/LoyaltyTab';
import CampaignsTab from '@/components/admin/CampaignsTab';

/* ─── Mare Design Tokens ─── */
const MARE = {
    primary: '#1A3278',
    primaryHover: '#243D8A',
    blueSoft: '#4A6BB5',
    surface: '#F2EDE3',
    canvas: '#FAF8F4',
    gold: '#C8A96E',
    goldLight: '#E8D5A0',
    ink: '#2A2A2E',
    stone: '#8C8B88',
    mist: '#E5E1D9',
    sage: '#5B8C6A',
    terracotta: '#C0574A',
} as const;

const FONTS = {
    serif: 'var(--font-dm-serif), Georgia, serif',
    sans: 'var(--font-jakarta), system-ui, sans-serif',
    mono: 'var(--font-jetbrains), monospace',
} as const;

/* ─── Helpers ─── */
function getTimeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `hace ${days}d`;
    return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — MareDashboard
   ═══════════════════════════════════════════════════════════════ */

export default function MareDashboard() {
    const router = useRouter();
    const config = useClientConfig();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'products' | 'marketing' | 'settings' | 'activity' | 'loyalty'>('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    /* ─── Metrics State ─── */
    const [metrics, setMetrics] = useState({ totalClients: 0, scansToday: 0, redemptionsTotal: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [activeChart, setActiveChart] = useState<'scans' | 'clients' | 'redemptions'>('scans');

    /* ─── Marketing State ─── */
    const [isSending, setIsSending] = useState(false);
    const [activeAudience, setActiveAudience] = useState('Todos');
    const [showEditor, setShowEditor] = useState(false);
    const [editorInitialData, setEditorInitialData] = useState<any>({});
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [templates, setTemplates] = useState<string[]>([
        '/assets/mare/marketing/mesa-2-1.png',
        '/assets/mare/marketing/mesa-25.jpg',
        '/assets/mare/marketing/mesa-9.png',
        '/assets/mare/marketing/mesa-5.png',
        '/assets/mare/marketing/mesa-15.png',
    ]);

    /* ─── Activity State ─── */
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [activityFilter, setActivityFilter] = useState<'all' | 'add_stamp' | 'redeem_reward'>('all');

    /* ─── Settings State ─── */
    const [stampsPerReward, setStampsPerReward] = useState(config.rules.stampsPerReward);
    const [savingStamps, setSavingStamps] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinForm, setPinForm] = useState({ current: '', newPin: '', confirm: '' });
    const [pinError, setPinError] = useState('');
    const [savingPin, setSavingPin] = useState(false);

    /* ─── Init & Auth ─── */
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/auth/login?role=staff'); return; }

            const { data: profile } = await supabase.from('profiles').select('role, client_code').eq('id', user.id).single();
            if (!profile || profile.role !== 'admin') { router.push('/staff'); return; }

            // Client Isolation
            let isValidUser = true;
            if (config.code === 'mare_cafe') {
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

            await Promise.all([fetchMetrics(config), fetchCampaigns(), fetchChartData(config), fetchActivity(config)]);

            // Load stampsPerReward from DB
            const { data: shopData } = await supabase.from('shops').select('config').eq('code', 'mare_cafe').single();
            if (shopData?.config?.rules?.stampsPerReward) setStampsPerReward(shopData.config.rules.stampsPerReward);
            setLoading(false);

            // Realtime
            const changes = supabase
                .channel('mare-admin-rt')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transaction_logs' }, () => {
                    fetchMetrics(config); fetchChartData(config);
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
                    fetchMetrics(config);
                })
                .subscribe();

            return () => { supabase.removeChannel(changes); };
        };
        init();
    }, [router, config]);

    /* ─── Data Fetchers ─── */
    const fetchMetrics = async (cfg: ClientConfig) => {
        let clientQuery = supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer');
        if (cfg.code === 'mare_cafe') {
            clientQuery = clientQuery.or('client_code.eq.mare_cafe,client_code.is.null');
        } else {
            clientQuery = clientQuery.eq('client_code', cfg.code);
        }
        const { count: clientCount } = await clientQuery;

        const today = new Date().toISOString().split('T')[0];
        let scansQuery = supabase.from('transaction_logs')
            .select('id, profiles!transaction_logs_user_id_fkey!inner(client_code)', { count: 'exact', head: true })
            .eq('type', 'add_stamp').gte('created_at', today);
        if (cfg.code === 'mare_cafe') {
            scansQuery = scansQuery.or('client_code.eq.mare_cafe,client_code.is.null', { foreignTable: 'profiles' });
        } else {
            scansQuery = scansQuery.eq('profiles.client_code', cfg.code);
        }
        const { count: dailyScans } = await scansQuery;

        let redeemsQuery = supabase.from('transaction_logs')
            .select('id, profiles!transaction_logs_user_id_fkey!inner(client_code)', { count: 'exact', head: true })
            .eq('type', 'redeem_reward');
        if (cfg.code === 'mare_cafe') {
            redeemsQuery = redeemsQuery.or('client_code.eq.mare_cafe,client_code.is.null', { foreignTable: 'profiles' });
        } else {
            redeemsQuery = redeemsQuery.eq('profiles.client_code', cfg.code);
        }
        const { count: redemptions } = await redeemsQuery;

        setMetrics({ totalClients: clientCount || 0, scansToday: dailyScans || 0, redemptionsTotal: redemptions || 0 });
    };

    const fetchChartData = async (cfg: ClientConfig) => {
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(today.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        let logsQuery = supabase.from('transaction_logs')
            .select('created_at, type, metadata, profiles!transaction_logs_user_id_fkey!inner(client_code)')
            .gte('created_at', last7Days[0]);
        if (cfg.code === 'mare_cafe') {
            logsQuery = logsQuery.or('client_code.eq.mare_cafe,client_code.is.null', { foreignTable: 'profiles' });
        } else {
            logsQuery = logsQuery.eq('profiles.client_code', cfg.code);
        }
        const { data: logs } = await logsQuery;

        let clientsQuery = supabase.from('profiles').select('created_at').eq('role', 'customer').gte('created_at', last7Days[0]);
        if (cfg.code === 'mare_cafe') {
            clientsQuery = clientsQuery.or('client_code.eq.mare_cafe,client_code.is.null');
        } else {
            clientsQuery = clientsQuery.eq('client_code', cfg.code);
        }
        const { data: newClients } = await clientsQuery;

        const chartMap = last7Days.reduce((acc: any, date) => {
            const dayName = new Date(date).toLocaleDateString('es-ES', { weekday: 'short' });
            acc[date] = { name: dayName.charAt(0).toUpperCase() + dayName.slice(1), scans: 0, redeems: 0, newClients: 0 };
            return acc;
        }, {});

        logs?.forEach(log => {
            const d = log.created_at.split('T')[0];
            if (chartMap[d]) {
                if (log.type === 'add_stamp') chartMap[d].scans += 1;
                if (log.type === 'redeem_reward') chartMap[d].redeems += 1;
            }
        });
        newClients?.forEach(c => {
            const d = c.created_at.split('T')[0];
            if (chartMap[d]) chartMap[d].newClients += 1;
        });

        setChartData(Object.values(chartMap));
    };

    const fetchCampaigns = async () => {
        const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
        if (data) setCampaigns(data);
    };

    const fetchActivity = async (cfg: ClientConfig) => {
        let query = supabase.from('transaction_logs')
            .select(`
                id, type, created_at, metadata,
                staff:profiles!transaction_logs_staff_id_fkey(full_name, email),
                customer:profiles!transaction_logs_user_id_fkey(full_name, email, client_code)
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (cfg.code === 'mare_cafe') {
            // We filter client-side for activity because the join makes it complex
        }

        const { data } = await query;
        if (data) {
            const filtered = cfg.code === 'mare_cafe'
                ? data.filter((log: any) => !log.customer?.client_code || log.customer.client_code === 'mare_cafe')
                : data.filter((log: any) => log.customer?.client_code === cfg.code);
            setActivityLogs(filtered);
        }
    };

    /* ─── Marketing Handlers ─── */
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => { setTemplates(prev => [...prev, ev.target?.result as string]); };
            reader.readAsDataURL(file);
        }
    };

    const openEditor = (templateUrl: string) => {
        setEditorInitialData({ imageUrl: templateUrl, title: '¡Novedades en Mare Cafe! ☕️', content: 'Tenemos nuevas promociones esperándote.' });
        setShowEditor(true);
    };

    const handleSendFromEditor = async (data: { title: string; content: string; html: string; audience: string; imageUrl?: string }) => {
        if (!confirm('¿Estás seguro de enviar esta campaña a ' + data.audience + '?')) return;
        setIsSending(true);
        try {
            const { data: campaign, error } = await supabase.from('campaigns').insert({
                title: data.title, content: data.content, audience: data.audience, status: 'active',
                metadata: { imageUrl: data.imageUrl || '', client_code: 'mare_cafe' }
            }).select().single();
            if (error) throw error;

            const formData = new FormData();
            formData.append('title', data.title); formData.append('content', data.content);
            formData.append('html', data.html); formData.append('audience', data.audience);
            formData.append('campaignId', campaign.id);
            formData.append('clientCode', 'mare_cafe');

            const { sendCampaign } = await import('@/app/actions/marketing');
            const result = await sendCampaign(formData);
            if (result.success) { alert('✅ ' + result.message); setShowEditor(false); fetchCampaigns(); }
            else alert('❌ Error: ' + result.message);
        } catch (e: any) { alert('Error: ' + e.message); }
        finally { setIsSending(false); }
    };

    const toggleCampaignStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const { error } = await supabase.from('campaigns').update({ status: newStatus }).eq('id', id);
        if (!error) setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    };

    const handleTestEmail = async () => {
        const email = prompt('Ingresa tu email para la prueba:', 'tu@email.com');
        if (!email) return;
        setIsSending(true);
        const formData = new FormData();
        formData.append('title', '[TEST] Mare Cafe Preview');
        formData.append('content', 'Prueba de visualización.');
        formData.append('audience', 'Test'); formData.append('testEmail', email);
        try {
            const { sendCampaign } = await import('@/app/actions/marketing');
            const result = await sendCampaign(formData);
            alert(result.success ? '✅ ' + result.message : '❌ ' + result.message);
        } catch (e: any) { alert('Error: ' + e.message); }
        finally { setIsSending(false); }
    };

    const handleLogout = async () => { await supabase.auth.signOut(); router.push('/'); };

    /* ─── Settings Handlers ─── */
    const handleSaveStamps = async () => {
        setSavingStamps(true);
        try {
            const { data: shopData } = await supabase.from('shops').select('config').eq('code', 'mare_cafe').single();
            const currentConfig = shopData?.config || {};
            const updatedConfig = {
                ...currentConfig,
                rules: { ...currentConfig.rules, stampsPerReward }
            };
            const { error } = await supabase.from('shops').update({ config: updatedConfig }).eq('code', 'mare_cafe');
            if (error) throw error;
            alert('✅ Sellos para recompensa actualizados a ' + stampsPerReward);
        } catch (e: any) {
            alert('❌ Error: ' + e.message);
        } finally {
            setSavingStamps(false);
        }
    };

    const handleChangePin = async () => {
        setPinError('');
        if (pinForm.newPin.length < 4) { setPinError('El PIN debe tener al menos 4 dígitos.'); return; }
        if (pinForm.newPin !== pinForm.confirm) { setPinError('Los PINs nuevos no coinciden.'); return; }
        setSavingPin(true);
        try {
            // Verify current PIN
            const { data: verified, error: verifyError } = await supabase.rpc('verify_shop_pin', {
                shop_code_input: 'mare_cafe',
                pin_input: pinForm.current
            });
            if (verifyError || !verified) { setPinError('El PIN actual es incorrecto.'); setSavingPin(false); return; }

            // Update PIN (hash it)
            const { error } = await supabase.rpc('update_shop_pin', {
                shop_code_input: 'mare_cafe',
                new_pin: pinForm.newPin
            });
            if (error) throw error;
            alert('✅ PIN actualizado correctamente.');
            setShowPinModal(false);
            setPinForm({ current: '', newPin: '', confirm: '' });
        } catch (e: any) {
            setPinError('Error: ' + e.message);
        } finally {
            setSavingPin(false);
        }
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="mare-theme" style={{
                minHeight: '100vh', background: MARE.canvas, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontFamily: FONTS.sans, color: MARE.primary, fontWeight: 500,
            }}>
                Cargando Panel Mare...
            </div>
        );
    }

    /* ─── Tab Config (filtered by feature flags) ─── */
    const tabs = [
        { id: 'overview', label: 'Resumen', icon: <LayoutDashboard size={20} />, enabled: true },
        { id: 'clients', label: 'Clientes', icon: <Users size={20} />, enabled: true },
        { id: 'products', label: 'Productos', icon: <Package size={20} />, enabled: true },
        { id: 'marketing', label: 'Marketing', icon: <Mail size={20} />, enabled: config.features.marketingEnabled },
        { id: 'loyalty', label: 'Lealtad', icon: <Award size={20} />, enabled: true },
        { id: 'activity', label: 'Actividad', icon: <Clock size={20} />, enabled: true },
        { id: 'settings', label: 'Ajustes', icon: <Settings size={20} />, enabled: config.features.adminSettingsEnabled },
    ].filter(t => t.enabled);

    return (
        <main className="mare-theme" style={{ minHeight: '100vh', fontFamily: FONTS.sans, display: 'flex', flexDirection: 'row' as const, color: MARE.ink }}>

            {/* ═══ MOBILE HEADER ═══ */}
            <header className="md:hidden" style={{
                position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 30,
                background: 'rgba(250,248,244,0.92)', backdropFilter: 'blur(20px) saturate(1.4)',
                borderBottom: `0.5px solid ${MARE.mist}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: MARE.ink }}>
                        <MenuIcon size={24} />
                    </button>
                    <span style={{ fontFamily: FONTS.serif, fontSize: 20, color: MARE.primary, letterSpacing: '-0.02em' }}>Mare</span>
                </div>
                <button
                    onClick={() => router.push('/staff')}
                    style={{
                        padding: 8, borderRadius: 10, background: MARE.primary, color: MARE.surface,
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    }}
                >
                    <Scan size={20} />
                </button>
            </header>

            {/* ═══ MOBILE MENU OVERLAY ═══ */}
            {mobileMenuOpen && (
                <div className="md:hidden" onClick={() => setMobileMenuOpen(false)} style={{
                    position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(26,50,120,0.3)', backdropFilter: 'blur(4px)',
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: MARE.canvas, width: 264, height: '100%', padding: 20,
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
                    }}>
                        <h2 style={{ fontFamily: FONTS.serif, fontSize: 22, color: MARE.primary, marginBottom: 24, letterSpacing: '-0.02em' }}>
                            Mare Café
                        </h2>
                        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {tabs.map(tab => (
                                <button key={tab.id}
                                    onClick={() => { setActiveTab(tab.id as any); setMobileMenuOpen(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                                        padding: '12px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                        fontFamily: FONTS.sans, fontSize: 14, fontWeight: activeTab === tab.id ? 700 : 500,
                                        background: activeTab === tab.id ? `${MARE.primary}10` : 'transparent',
                                        color: activeTab === tab.id ? MARE.primary : MARE.stone,
                                        transition: 'all 200ms ease',
                                    }}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </nav>
                        <button onClick={handleLogout} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                            background: 'none', border: 'none', cursor: 'pointer', color: MARE.stone, fontFamily: FONTS.sans, fontSize: 14,
                        }}>
                            <LogOut size={20} /> Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ DESKTOP SIDEBAR — Ocean Gradient ═══ */}
            <aside className="hidden md:flex" style={{
                width: 260, background: 'linear-gradient(175deg, #1A3278 0%, #243D8A 60%, #2E4F9E 100%)',
                color: MARE.surface, flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, zIndex: 40,
            }}>
                {/* Brand */}
                <div style={{ height: 72, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div>
                        <h1 style={{ fontFamily: FONTS.serif, fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Mare</h1>
                        <span style={{ fontSize: 10, opacity: 0.6, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>Administración</span>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                                    padding: '12px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                    fontFamily: FONTS.sans, fontSize: 14, fontWeight: isActive ? 700 : 500,
                                    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                                    color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                                    transition: 'all 200ms ease',
                                }}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button onClick={() => router.push('/staff')} style={{
                        display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px',
                        borderRadius: 12, background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.6)', fontFamily: FONTS.sans, fontSize: 13,
                    }}>
                        <Scan size={18} /> Escáner Staff
                    </button>
                    <button onClick={handleLogout} style={{
                        display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px',
                        borderRadius: 12, background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.6)', fontFamily: FONTS.sans, fontSize: 13,
                    }}>
                        <LogOut size={18} /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* ═══ MAIN CONTENT AREA ═══ */}
            <div style={{ flex: 1, minHeight: '100vh', background: MARE.canvas, overflowY: 'auto' }}>

                {/* Desktop Header */}
                <header className="hidden md:flex" style={{
                    padding: '24px 32px', borderBottom: `0.5px solid ${MARE.mist}`,
                    justifyContent: 'space-between', alignItems: 'flex-end',
                    background: 'rgba(250,248,244,0.8)', backdropFilter: 'blur(12px)',
                    position: 'sticky', top: 0, zIndex: 20,
                }}>
                    <div>
                        <h2 style={{ fontFamily: FONTS.serif, fontSize: 28, color: MARE.primary, letterSpacing: '-0.02em' }}>
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                        <p style={{ fontSize: 13, color: MARE.stone, marginTop: 4 }}>
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: MARE.ink }}>{config.name}</p>
                            <p style={{ fontSize: 11, color: MARE.stone }}>Administración</p>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div style={{ padding: '24px 16px 40px', maxWidth: 1080, margin: '0 auto' }} className="md:px-8 md:pt-8">

                    {/* OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="mare-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Metric Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                                <MareMetricCard label="Clientes Totales" value={metrics.totalClients} icon={<Users size={22} />} color={MARE.blueSoft} />
                                <MareMetricCard label="Visitas Hoy" value={metrics.scansToday} icon={<Scan size={22} />} color={MARE.sage} />
                                <MareMetricCard label="Premios Canjeados" value={metrics.redemptionsTotal} icon={<Gift size={22} />} color={MARE.gold} />
                            </div>

                            {/* Chart */}
                            <div style={{
                                background: '#fff', borderRadius: 20, padding: 24,
                                border: `1px solid ${MARE.mist}`,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                                    <div>
                                        <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, color: MARE.primary, letterSpacing: '-0.02em' }}>
                                            Métricas de Rendimiento
                                        </h3>
                                        <p style={{ fontSize: 12, color: MARE.stone, marginTop: 4 }}>Últimos 7 días</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {[
                                            { id: 'scans', label: 'Visitas' },
                                            { id: 'clients', label: 'Clientes' },
                                            { id: 'redemptions', label: 'Canjes' },
                                        ].map(opt => (
                                            <button key={opt.id}
                                                onClick={() => setActiveChart(opt.id as any)}
                                                style={{
                                                    padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                                    fontSize: 12, fontWeight: 600, fontFamily: FONTS.sans,
                                                    background: activeChart === opt.id ? MARE.primary : 'transparent',
                                                    color: activeChart === opt.id ? MARE.surface : MARE.stone,
                                                    transition: 'all 200ms ease',
                                                }}
                                            >{opt.label}</button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ height: 280, width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="mare-chart-fill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={MARE.primary} stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor={MARE.primary} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={MARE.mist} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: MARE.stone, fontSize: 12 }} dy={10} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: 12, border: `1px solid ${MARE.mist}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', fontFamily: FONTS.sans }}
                                                formatter={(value: any, name?: string) => {
                                                    const labels: Record<string, string> = { scans: 'Escaneos', redeems: 'Canjes', newClients: 'Nuevos' };
                                                    return [value, name ? (labels[name] || name) : ''];
                                                }}
                                            />
                                            {activeChart === 'scans' && <Area type="monotone" dataKey="scans" stroke={MARE.primary} strokeWidth={2.5} fill="url(#mare-chart-fill)" />}
                                            {activeChart === 'redemptions' && <Area type="monotone" dataKey="redeems" stroke={MARE.gold} strokeWidth={2.5} fill="url(#mare-chart-fill)" />}
                                            {activeChart === 'clients' && <Area type="monotone" dataKey="newClients" stroke={MARE.blueSoft} strokeWidth={2.5} fill="url(#mare-chart-fill)" />}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CLIENTS */}
                    {activeTab === 'clients' && (
                        <div className="mare-fade-up" style={{
                            background: '#fff', borderRadius: 20, border: `1px solid ${MARE.mist}`, padding: 4,
                        }}>
                            <ClientsTab />
                        </div>
                    )}

                    {/* PRODUCTS */}
                    {activeTab === 'products' && (
                        <div className="mare-fade-up">
                            <ProductsTab shopCode={config.code} />
                        </div>
                    )}

                    {/* LOYALTY */}
                    {activeTab === 'loyalty' && (
                        <div className="mare-fade-up">
                            <LoyaltyTab />
                        </div>
                    )}

                    {/* MARKETING */}
                    {activeTab === 'marketing' && (
                        <div className="mare-fade-up">
                            <CampaignsTab />
                        </div>
                    )}

                    {/* ACTIVITY */}
                    {
                        activeTab === 'activity' && (
                            <div className="mare-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Filter */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[
                                        { id: 'all', label: 'Todo' },
                                        { id: 'add_stamp', label: 'Sellos' },
                                        { id: 'redeem_reward', label: 'Canjes' },
                                    ].map(f => (
                                        <button key={f.id}
                                            onClick={() => setActivityFilter(f.id as any)}
                                            style={{
                                                padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                                fontSize: 13, fontWeight: 600, fontFamily: FONTS.sans,
                                                background: activityFilter === f.id ? MARE.primary : '#fff',
                                                color: activityFilter === f.id ? MARE.surface : MARE.stone,
                                                transition: 'all 200ms ease',
                                            }}
                                        >{f.label}</button>
                                    ))}
                                </div>

                                {/* Log List */}
                                <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${MARE.mist}`, overflow: 'hidden' }}>
                                    {activityLogs
                                        .filter(log => activityFilter === 'all' || log.type === activityFilter)
                                        .length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: 32, color: MARE.stone, fontSize: 13 }}>
                                            No hay actividad reciente.
                                        </div>
                                    ) : (
                                        activityLogs
                                            .filter(log => activityFilter === 'all' || log.type === activityFilter)
                                            .map((log, idx) => {
                                                const isStamp = log.type === 'add_stamp';
                                                const staffName = log.staff?.full_name || log.staff?.email?.split('@')[0] || 'Staff';
                                                const customerName = log.customer?.full_name || log.customer?.email?.split('@')[0] || 'Cliente';
                                                const timeAgo = getTimeAgo(log.created_at);
                                                return (
                                                    <div key={log.id} style={{
                                                        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                                                        borderBottom: `0.5px solid ${MARE.mist}`,
                                                    }}>
                                                        <div style={{
                                                            width: 36, height: 36, borderRadius: 10, display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center',
                                                            background: isStamp ? `${MARE.sage}15` : `${MARE.gold}15`,
                                                            color: isStamp ? MARE.sage : MARE.gold,
                                                            flexShrink: 0,
                                                        }}>
                                                            {isStamp ? <Scan size={18} /> : <Gift size={18} />}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ fontSize: 13, fontWeight: 500, color: MARE.ink }}>
                                                                <strong>{staffName}</strong>
                                                                {isStamp ? ' dio sello a ' : ' canjeó premio para '}
                                                                <strong>{customerName}</strong>
                                                            </p>
                                                        </div>
                                                        <span style={{ fontSize: 11, color: MARE.stone, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                            {timeAgo}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                    )}
                                </div>
                            </div>
                        )
                    }

                    {/* SETTINGS */}
                    {
                        activeTab === 'settings' && (
                            <div className="mare-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Stamps Per Reward */}
                                <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: `1px solid ${MARE.mist}` }}>
                                    <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, color: MARE.primary, marginBottom: 8, letterSpacing: '-0.02em' }}>
                                        Programa de Lealtad
                                    </h3>
                                    <p style={{ fontSize: 13, color: MARE.stone, marginBottom: 20 }}>
                                        Configurá cuántos sellos necesita un cliente para ganar su recompensa.
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <label style={{ fontSize: 14, fontWeight: 600, color: MARE.ink, minWidth: 180 }}>
                                            Sellos para recompensa
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={50}
                                            value={stampsPerReward}
                                            onChange={e => setStampsPerReward(Number(e.target.value))}
                                            style={{
                                                width: 80, padding: '10px 14px', borderRadius: 12,
                                                border: `1.5px solid ${MARE.mist}`, fontSize: 16, fontWeight: 700,
                                                fontFamily: FONTS.mono, textAlign: 'center', color: MARE.primary,
                                                outline: 'none',
                                            }}
                                        />
                                        <button
                                            onClick={handleSaveStamps}
                                            disabled={savingStamps}
                                            style={{
                                                padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                                background: MARE.primary, color: MARE.surface,
                                                fontFamily: FONTS.sans, fontSize: 13, fontWeight: 600,
                                                opacity: savingStamps ? 0.6 : 1,
                                            }}
                                        >
                                            {savingStamps ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>

                                {/* Business Rules */}
                                <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: `1px solid ${MARE.mist}` }}>
                                    <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, color: MARE.primary, marginBottom: 16, letterSpacing: '-0.02em' }}>
                                        Reglas de Negocio
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <MareSettingRow label="Happy Hour (Puntos Dobles)" desc="Los clientes suman x2 sellos al escanear." />
                                        <MareSettingRow label="Solicitar PIN en Canjes" desc="Mayor seguridad al entregar premios." defaultOn />
                                    </div>
                                </div>

                                {/* Security */}
                                <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: `1px solid ${MARE.mist}` }}>
                                    <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, color: MARE.primary, marginBottom: 8, letterSpacing: '-0.02em' }}>
                                        Seguridad
                                    </h3>
                                    <p style={{ fontSize: 13, color: MARE.stone, marginBottom: 16 }}>
                                        Cambiar el PIN de administración de tu local.
                                    </p>
                                    <button
                                        onClick={() => setShowPinModal(true)}
                                        style={{
                                            padding: '12px 24px', borderRadius: 12, border: `1.5px solid ${MARE.mist}`,
                                            background: 'transparent', color: MARE.primary,
                                            fontFamily: FONTS.sans, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                        }}
                                    >
                                        🔒 Cambiar PIN
                                    </button>
                                </div>
                            </div>
                        )
                    }

                    {/* PIN Change Modal */}
                    {
                        showPinModal && (
                            <div style={{
                                position: 'fixed', inset: 0, zIndex: 100,
                                background: 'rgba(26,50,120,0.3)', backdropFilter: 'blur(6px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                            }} onClick={() => setShowPinModal(false)}>
                                <div onClick={e => e.stopPropagation()} style={{
                                    background: '#fff', borderRadius: 24, padding: 32, maxWidth: 400, width: '100%',
                                    boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                                }}>
                                    <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, color: MARE.primary, marginBottom: 20 }}>Cambiar PIN</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: MARE.stone, display: 'block', marginBottom: 6 }}>PIN Actual</label>
                                            <input type="password" value={pinForm.current} onChange={e => setPinForm(p => ({ ...p, current: e.target.value }))}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${MARE.mist}`, fontSize: 16, fontFamily: FONTS.mono, outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: MARE.stone, display: 'block', marginBottom: 6 }}>PIN Nuevo</label>
                                            <input type="password" value={pinForm.newPin} onChange={e => setPinForm(p => ({ ...p, newPin: e.target.value }))}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${MARE.mist}`, fontSize: 16, fontFamily: FONTS.mono, outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: MARE.stone, display: 'block', marginBottom: 6 }}>Confirmar PIN Nuevo</label>
                                            <input type="password" value={pinForm.confirm} onChange={e => setPinForm(p => ({ ...p, confirm: e.target.value }))}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${MARE.mist}`, fontSize: 16, fontFamily: FONTS.mono, outline: 'none', boxSizing: 'border-box' }} />
                                        </div>
                                        {pinError && <p style={{ fontSize: 13, color: MARE.terracotta, fontWeight: 500 }}>{pinError}</p>}
                                        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                            <button onClick={() => setShowPinModal(false)} style={{
                                                flex: 1, padding: '12px 0', borderRadius: 12, border: `1px solid ${MARE.mist}`,
                                                background: 'transparent', color: MARE.stone, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans,
                                            }}>Cancelar</button>
                                            <button onClick={handleChangePin} disabled={savingPin} style={{
                                                flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                                                background: MARE.primary, color: MARE.surface, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans,
                                                opacity: savingPin ? 0.6 : 1,
                                            }}>{savingPin ? 'Guardando...' : 'Cambiar PIN'}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div >
            </div >

            {/* ═══ Email Editor Modal ═══ */}
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

/* ─── Sub-Components (Mare-scoped) ─── */

/** Tarjeta de métrica con estilo editorial Mare */
function MareMetricCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
    return (
        <div style={{
            background: '#fff', borderRadius: 16, padding: '20px 24px',
            border: `1px solid ${MARE.mist}`, display: 'flex', alignItems: 'center', gap: 16,
            transition: 'all 200ms ease',
        }}>
            <div style={{
                width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${color}15`, color: color,
            }}>
                {icon}
            </div>
            <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: MARE.stone, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>{label}</p>
                <h3 style={{ fontFamily: FONTS.mono, fontSize: 28, fontWeight: 700, color: MARE.ink, lineHeight: 1.1, marginTop: 2 }}>{value}</h3>
            </div>
        </div>
    );
}

/** Fila de ajuste toggle con estilo Mare */
function MareSettingRow({ label, desc, defaultOn = false }: { label: string; desc: string; defaultOn?: boolean }) {
    const [on, setOn] = useState(defaultOn);
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderBottom: `0.5px solid ${MARE.mist}`,
        }}>
            <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: MARE.ink }}>{label}</h4>
                <p style={{ fontSize: 12, color: MARE.stone, marginTop: 2 }}>{desc}</p>
            </div>
            <button
                onClick={() => setOn(!on)}
                style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: on ? MARE.primary : MARE.mist, position: 'relative', transition: 'background 200ms ease',
                    flexShrink: 0,
                }}
            >
                <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: on ? 22 : 2, transition: 'left 200ms ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }} />
            </button>
        </div>
    );
}
