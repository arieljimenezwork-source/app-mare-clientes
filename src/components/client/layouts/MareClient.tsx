'use client';

/**
 * MareClient.tsx — Layout Premium para Mare Café
 * 
 * Diseño editorial inspirado en Kinfolk Magazine, Cereal Magazine, Aesop Stores.
 * Paleta: Royal Deep Blue (#1A3278) + Parchment Cream (#F2EDE3) + Espresso Gold (#C8A96E)
 * Tipografía: DM Serif Display (headings) + Plus Jakarta Sans (body) + JetBrains Mono (precios)
 * 
 * AISLAMIENTO: Este componente es 100% independiente. No modifica Perezoso ni componentes compartidos.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useClientConfig } from '@/context/ClientConfigContext';
import QRCode from 'react-qr-code';
import Image from 'next/image';
import PoweredBy from '@/components/PoweredBy';
import MarketingNotification from '@/components/client/marketing/MarketingNotification';

/* ─── Mare Design Tokens (inline constants) ─── */
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

/* ─── Inline SVG Icons (line-art 1.5px, estilo editorial del flyer) ─── */

/** Ícono de taza de café (para stamps activos) */
function CoffeeStampIcon({ filled = false, size = 20 }: { filled?: boolean; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {filled && <circle cx="12" cy="12" r="11" fill={MARE.primary} stroke="none" />}
            <path
                d={filled ? "M8 15c0 1.1.9 2 2 2h4a2 2 0 002-2v-4H8v4z" : "M6 17c0 1.1.9 2 2 2h8a2 2 0 002-2V9H6v8z"}
                stroke={filled ? MARE.canvas : MARE.gold}
            />
            <path
                d={filled ? "M16 11h1a2 2 0 010 4h-1" : "M18 9h1.5a2.5 2.5 0 010 5H18"}
                stroke={filled ? MARE.canvas : MARE.gold}
            />
            {!filled && (
                <>
                    <path d="M10 5c0-1 .5-2 1.5-2S13 4 13 5" stroke={MARE.gold} opacity="0.5" />
                    <path d="M7.5 5.5C7.5 4.5 8 3.5 9 3.5" stroke={MARE.gold} opacity="0.3" />
                </>
            )}
        </svg>
    );
}

/** Ícono de estrella con gradiente dorado (para recompensa final) */
function StarRewardIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <defs>
                <linearGradient id="mare-gold-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={MARE.gold} />
                    <stop offset="50%" stopColor={MARE.goldLight} />
                    <stop offset="100%" stopColor={MARE.gold} />
                </linearGradient>
            </defs>
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" fill="url(#mare-gold-grad)" stroke={MARE.gold} strokeWidth="1" />
        </svg>
    );
}

/** Animación de olas del mar (pull-to-refresh / loader) */
function WaveLoader() {
    return (
        <svg width="48" height="20" viewBox="0 0 48 20">
            <path
                d="M0 12 Q6 6 12 12 Q18 18 24 12 Q30 6 36 12 Q42 18 48 12"
                fill="none" stroke={MARE.primary} strokeWidth="1.5" strokeLinecap="round" opacity="0.7"
                style={{ animation: 'mare-wave1 2s ease-in-out infinite' }}
            />
            <path
                d="M0 14 Q6 8 12 14 Q18 20 24 14 Q30 8 36 14 Q42 20 48 14"
                fill="none" stroke={MARE.blueSoft} strokeWidth="1.2" strokeLinecap="round" opacity="0.4"
                style={{ animation: 'mare-wave2 2s ease-in-out infinite 0.3s' }}
            />
        </svg>
    );
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — MareClient
   ═══════════════════════════════════════════════════════════════ */

export default function MareClient() {
    const config = useClientConfig();
    const router = useRouter();

    /* ─── Estado de usuario y stamps ─── */
    const [stamps, setStamps] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [userUUID, setUserUUID] = useState('');
    const [userLevel, setUserLevel] = useState(1);
    const [showQRSheet, setShowQRSheet] = useState(false);
    const [showLevelUpModal, setShowLevelUpModal] = useState(false);
    const [favDrink, setFavDrink] = useState('');
    const [activeTab, setActiveTab] = useState('home');

    /* ─── Autenticación y carga de datos ─── */
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/auth/login'); return; }

            setUserUUID(session.user.id);

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, client_code, first_name, level, preferences')
                .eq('id', session.user.id)
                .single();

            if (profile?.role !== 'customer') { router.push('/unauthorized'); return; }

            setUserName(profile?.first_name || 'Cliente');
            setUserLevel(profile?.level || 1);
            if (profile?.preferences?.favorite_drink) setFavDrink(profile.preferences.favorite_drink);

            fetchStamps(session.user.id);

            // Realtime subscription
            const channel = supabase
                .channel('mare_stamps_sub')
                .on('postgres_changes', {
                    event: '*', schema: 'public', table: 'stamps',
                    filter: `user_id=eq.${session.user.id}`,
                }, () => fetchStamps(session.user.id))
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        };
        checkSession();
    }, [router, config.code]);

    const fetchStamps = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('stamps').select('count').eq('user_id', userId).single();

            if (error && error.code !== 'PGRST116') { console.error('Error:', error); return; }

            if (data) {
                if (stamps >= (config.rules.stampsPerReward || 7) && data.count < (config.rules.stampsPerReward || 7)) {
                    setShowQRSheet(false);
                    setShowLevelUpModal(true);
                }
                setStamps(data.count);
            } else {
                const { error: insertError } = await supabase
                    .from('stamps')
                    .insert([{ user_id: userId, count: 0, client_code: config.code }]);
                if (!insertError) setStamps(0);
            }
        } catch (err) { console.error('Unexpected:', err); }
        finally { setLoading(false); }
    };

    const handleSavePreferences = async () => {
        if (!userUUID || !favDrink) return;
        await supabase.from('profiles').update({ preferences: { favorite_drink: favDrink } }).eq('id', userUUID);
        setShowLevelUpModal(false);
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        if (tab === 'menu' && config.features.menuEnabled) router.push('/client/menu');
    };

    /* ─── Loading State ─── */
    if (loading) {
        return (
            <div className="mare-theme" style={{ minHeight: '100vh', background: MARE.canvas, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                <WaveLoader />
                <span style={{ fontFamily: FONTS.sans, fontSize: 13, color: MARE.stone, letterSpacing: '0.05em' }}>Cargando...</span>
            </div>
        );
    }

    const total = config.rules.stampsPerReward || 7;
    const isRewardAvailable = stamps >= total;
    const stampPct = Math.min((stamps / total) * 100, 100);

    /* ─── Datos de ejemplo para el News Feed ─── */
    const newsItems = [
        { id: '1', cat: 'Novedad', title: 'Cold Brew de Temporada', desc: 'Infusión en frío con notas tropicales', icon: '☕' },
        { id: '2', cat: 'Evento', title: 'Taller de Latte Art', desc: 'Aprende arte en tu taza este sábado', icon: '🎨' },
        { id: '3', cat: 'Eco', title: 'Descuento Eco-Friendly', desc: '15% OFF con tu vaso reutilizable', icon: '🌱' },
        { id: '4', cat: 'Nuevo', title: 'Pastelería Artesanal', desc: 'Nuevos croissants de masa madre', icon: '🧁' },
    ];

    /* ─── QR Data ─── */
    const qrData = JSON.stringify({ uid: userUUID, action: isRewardAvailable ? 'redeem' : 'scan', shop: config.code });

    return (
        <div className="mare-theme" style={{ minHeight: '100vh', background: MARE.canvas, fontFamily: FONTS.sans, color: MARE.ink, paddingBottom: 100 }}>

            {/* ═══ HEADER — Ocean Gradient Hero ═══ */}
            <header style={{
                background: 'linear-gradient(175deg, #1A3278 0%, #243D8A 45%, #2E4F9E 100%)',
                padding: '0 0 32px 0', color: MARE.surface, position: 'relative',
            }}>
                {/* Top Bar (sticky feel) */}
                <div style={{ padding: '48px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontFamily: FONTS.serif, fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Mare</h1>
                        <span style={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
                            Pastelería y Café
                        </span>
                    </div>
                    <button
                        onClick={() => setShowQRSheet(true)}
                        style={{
                            width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={MARE.surface} strokeWidth="1.5">
                            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                        </svg>
                    </button>
                </div>

                {/* Welcome Message */}
                <div style={{ padding: '20px 20px 0' }}>
                    <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Hola, {userName} 👋</p>
                    <p style={{ fontSize: 13, opacity: 0.7 }}>
                        {isRewardAvailable
                            ? '¡Tu premio está listo para canjear!'
                            : `Te faltan ${total - stamps} cafés para tu recompensa`
                        }
                    </p>
                </div>
            </header>

            {/* ═══ MAIN CONTENT ═══ */}
            <main style={{ padding: '0 16px', maxWidth: 480, margin: '0 auto' }} className="mare-fade-up">

                {/* ─── Tarjeta de Fidelidad (Mini, sobresale del header) ─── */}
                <div style={{ marginTop: -16 }}>
                    <div style={{
                        background: MARE.canvas, borderRadius: 16, padding: '16px 20px',
                        border: `1px solid ${MARE.mist}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontFamily: FONTS.serif, fontSize: 14, color: MARE.primary }}>{config.texts.stampCardTitle}</span>
                            <span style={{ fontSize: 11, fontFamily: FONTS.mono, color: MARE.stone }}>{stamps}/{total}</span>
                        </div>
                        <div className="mare-stagger" style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                            {Array.from({ length: total }).map((_, i) => {
                                const filled = i < stamps;
                                const isLast = i === total - 1;
                                return (
                                    <div key={i} className={filled ? 'mare-stamp-bounce' : ''} style={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: isLast && isRewardAvailable
                                            ? `linear-gradient(135deg, ${MARE.gold}, ${MARE.goldLight}, ${MARE.gold})`
                                            : filled ? MARE.primary : 'transparent',
                                        border: filled ? 'none' : `1.5px dashed ${MARE.gold}`,
                                        transition: 'all 300ms ease',
                                    }}>
                                        {isLast ? <StarRewardIcon size={16} /> : filled ? <CoffeeStampIcon filled size={16} /> : <CoffeeStampIcon size={14} />}
                                    </div>
                                );
                            })}
                        </div>
                        {/* Progress Bar */}
                        <div style={{ height: 3, borderRadius: 2, background: MARE.mist, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 2, background: MARE.primary, width: `${stampPct}%`, transition: 'width 500ms ease' }} />
                        </div>
                    </div>
                </div>

                {/* ─── Acceso Rápido ─── */}
                <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 11, color: MARE.stone, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Acceso rápido</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <button
                            onClick={() => handleTabChange('menu')}
                            style={{
                                padding: '14px 16px', borderRadius: 12, border: `1px solid ${MARE.mist}`,
                                display: 'flex', alignItems: 'center', gap: 10, background: MARE.canvas,
                                cursor: 'pointer', fontFamily: FONTS.sans, fontSize: 13, fontWeight: 500, color: MARE.ink,
                            }}
                        >
                            <span style={{ fontSize: 18 }}>📖</span> Ver Menú
                        </button>
                        <button
                            onClick={() => setShowQRSheet(true)}
                            style={{
                                padding: '14px 16px', borderRadius: 12, border: `1px solid ${MARE.mist}`,
                                display: 'flex', alignItems: 'center', gap: 10, background: MARE.canvas,
                                cursor: 'pointer', fontFamily: FONTS.sans, fontSize: 13, fontWeight: 500, color: MARE.ink,
                            }}
                        >
                            <span style={{ fontSize: 18 }}>📱</span> Mi QR
                        </button>
                    </div>
                </div>

                {/* ─── Banner Promocional (estilo editorial) ─── */}
                <div style={{ marginTop: 24 }}>
                    <div style={{
                        background: `linear-gradient(135deg, ${MARE.surface}, ${MARE.canvas})`,
                        borderRadius: 20, padding: 24, border: `1.5px solid ${MARE.primary}`,
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', top: -20, right: -20, width: 100, height: 100,
                            borderRadius: '50%', background: `${MARE.gold}15`,
                        }} />
                        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: MARE.gold, marginBottom: 8 }}>
                            Café de Especialidad
                        </p>
                        <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, color: MARE.primary, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 8 }}>
                            Descubrí nuestros nuevos blends
                        </h3>
                        <p style={{ fontSize: 13, color: MARE.stone, lineHeight: 1.5, marginBottom: 16 }}>
                            Microlotes seleccionados de Huila, Colombia y Sidama, Etiopía.
                        </p>
                        <button style={{
                            background: MARE.primary, color: MARE.surface, border: 'none',
                            padding: '12px 24px', borderRadius: 12, fontFamily: FONTS.sans,
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            transition: 'all 200ms ease',
                        }}>
                            Explorar →
                        </button>
                    </div>
                </div>

                {/* ─── Novedades (News Feed editorial) ─── */}
                {config.features.showNewsFeed && (
                    <div style={{ marginTop: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
                            <span style={{ fontFamily: FONTS.serif, fontSize: 18, color: MARE.primary, letterSpacing: '-0.01em' }}>Novedades</span>
                            <span style={{ fontSize: 12, color: MARE.blueSoft, fontWeight: 500, cursor: 'pointer' }}>Ver todos →</span>
                        </div>
                        <div className="scrollbar-hide" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}>
                            {newsItems.map((item, i) => (
                                <div key={item.id} className="mare-fade-up" style={{
                                    minWidth: 160, borderRadius: 16, border: `1px solid ${MARE.mist}`,
                                    overflow: 'hidden', background: MARE.canvas, flexShrink: 0,
                                    transition: 'all 200ms ease', cursor: 'pointer',
                                    animationDelay: `${i * 50}ms`,
                                }}>
                                    <div style={{
                                        height: 80,
                                        background: `linear-gradient(${135 + i * 30}deg, ${MARE.primary}, ${MARE.blueSoft})`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 32,
                                    }}>
                                        {item.icon}
                                    </div>
                                    <div style={{ padding: '10px 12px' }}>
                                        <span style={{
                                            fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                                            color: MARE.gold, background: `${MARE.gold}15`, padding: '2px 6px', borderRadius: 4,
                                        }}>
                                            {item.cat}
                                        </span>
                                        <h4 style={{ fontFamily: FONTS.serif, fontSize: 13, color: MARE.ink, marginTop: 6, lineHeight: 1.3 }}>{item.title}</h4>
                                        <p style={{ fontSize: 11, color: MARE.stone, marginTop: 4, lineHeight: 1.4 }}>{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── Powered By ─── */}
                <div style={{ marginTop: 32, opacity: 0.3, textAlign: 'center' }}>
                    <PoweredBy />
                </div>
            </main>

            {/* ═══ BOTTOM NAVIGATION — Glass Bar, 4 Tabs ═══ */}
            <nav style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
                background: 'rgba(250,248,244,0.9)', backdropFilter: 'blur(20px) saturate(1.4)',
                borderTop: `0.5px solid ${MARE.mist}`,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 0 12px', maxWidth: 400, margin: '0 auto' }}>
                    {[
                        { id: 'home', icon: '⌂', label: 'INICIO' },
                        { id: 'menu', icon: '☕', label: 'MENÚ' },
                        { id: 'qr', icon: '◎', label: 'LEALTAD' },
                        { id: 'profile', icon: '◯', label: 'PERFIL' },
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (tab.id === 'qr') { setShowQRSheet(true); return; }
                                    handleTabChange(tab.id);
                                }}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                    padding: '4px 12px',
                                }}
                            >
                                <span style={{ fontSize: 20, color: MARE.primary, opacity: isActive ? 1 : 0.35, transition: 'opacity 200ms' }}>
                                    {tab.icon}
                                </span>
                                <span style={{
                                    fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
                                    color: isActive ? MARE.primary : MARE.stone,
                                    fontFamily: FONTS.sans,
                                }}>
                                    {tab.label}
                                </span>
                                {/* Dot indicator */}
                                <div style={{
                                    width: 4, height: 4, borderRadius: '50%',
                                    background: isActive ? MARE.primary : 'transparent',
                                    transition: 'background 200ms',
                                }} />
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* ═══ QR SHEET — Bottom Sheet (spring animation) ═══ */}
            {showQRSheet && (
                <>
                    {/* Overlay */}
                    <div
                        onClick={() => setShowQRSheet(false)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 40,
                            background: 'rgba(26, 50, 120, 0.4)',
                            backdropFilter: 'blur(8px)',
                            transition: 'opacity 300ms',
                        }}
                    />
                    {/* Sheet */}
                    <div className="mare-slide-up" style={{
                        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
                    }}>
                        <div style={{
                            background: MARE.canvas, borderRadius: '24px 24px 0 0',
                            maxWidth: 420, margin: '0 auto', width: '100%',
                            padding: '12px 24px 40px',
                            boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
                        }}>
                            {/* Drag Handle */}
                            <div style={{ width: 48, height: 5, borderRadius: 3, background: MARE.mist, margin: '0 auto 20px', opacity: 0.5 }} />

                            {/* Status Badge */}
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '6px 16px', borderRadius: 20,
                                    fontSize: 12, fontWeight: 600,
                                    background: isRewardAvailable ? `${MARE.gold}20` : `${MARE.primary}08`,
                                    color: isRewardAvailable ? MARE.gold : MARE.primary,
                                    fontFamily: FONTS.sans,
                                }}>
                                    {isRewardAvailable ? '★ ¡Premio disponible!' : '☕ Muestra al barista'}
                                </span>
                            </div>

                            {/* QR Code */}
                            <div style={{
                                borderRadius: 24, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                maxWidth: 280, margin: '0 auto',
                                background: isRewardAvailable ? MARE.primary : MARE.surface,
                                border: isRewardAvailable ? 'none' : `1.5px solid ${MARE.mist}`,
                                transition: 'all 300ms ease',
                            }}>
                                <div style={{ background: '#fff', padding: 16, borderRadius: 16 }}>
                                    <QRCode
                                        value={qrData}
                                        size={176}
                                        fgColor={MARE.primary}
                                        bgColor="#FFFFFF"
                                    />
                                </div>
                            </div>

                            <p style={{
                                textAlign: 'center', fontSize: 12, color: MARE.stone, marginTop: 20,
                                maxWidth: 220, margin: '20px auto 0', lineHeight: 1.5, fontFamily: FONTS.sans,
                            }}>
                                {isRewardAvailable
                                    ? 'El barista escaneará este código para canjear tu premio.'
                                    : 'Acumula sellos con cada compra presentando este código.'}
                            </p>

                            {/* Close Button */}
                            <button
                                onClick={() => setShowQRSheet(false)}
                                style={{
                                    width: '100%', marginTop: 24, padding: '14px 0', borderRadius: 12,
                                    background: MARE.mist, border: 'none', cursor: 'pointer',
                                    fontFamily: FONTS.sans, fontSize: 14, fontWeight: 600, color: MARE.stone,
                                    transition: 'all 200ms ease',
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ═══ MODAL — Canje Exitoso / Preferencia ═══ */}
            {showLevelUpModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(26, 50, 120, 0.5)', backdropFilter: 'blur(8px)', padding: 16,
                }}>
                    <div className="mare-fade-up" style={{
                        background: MARE.canvas, borderRadius: 24, padding: 32, maxWidth: 360, width: '100%',
                        textAlign: 'center', position: 'relative', overflow: 'hidden',
                    }}>
                        {/* Gold accent circle */}
                        <div style={{
                            position: 'absolute', top: -30, right: -30, width: 120, height: 120,
                            borderRadius: '50%', background: `${MARE.gold}15`,
                        }} />
                        <div style={{
                            position: 'absolute', bottom: -20, left: -20, width: 80, height: 80,
                            borderRadius: '50%', background: `${MARE.primary}08`,
                        }} />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: '50%',
                                background: `linear-gradient(135deg, ${MARE.gold}, ${MARE.goldLight}, ${MARE.gold})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}>
                                <StarRewardIcon size={32} />
                            </div>

                            <h2 style={{ fontFamily: FONTS.serif, fontSize: 24, color: MARE.primary, marginBottom: 8, letterSpacing: '-0.02em' }}>
                                ¡Canje Exitoso!
                            </h2>
                            <p style={{ fontSize: 14, color: MARE.stone, marginBottom: 24, lineHeight: 1.5 }}>
                                Has disfrutado tu premio. Cuéntanos, ¿cuál fue tu bebida de hoy?
                            </p>

                            <div style={{
                                background: MARE.surface, padding: 16, borderRadius: 16, textAlign: 'left',
                                border: `1px solid ${MARE.mist}`, marginBottom: 20,
                            }}>
                                <label style={{
                                    display: 'block', fontSize: 11, fontWeight: 600, color: MARE.stone,
                                    letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8,
                                }}>
                                    Tu bebida favorita
                                </label>
                                <input
                                    type="text"
                                    value={favDrink}
                                    onChange={(e) => setFavDrink(e.target.value)}
                                    placeholder="Ej. Cappuccino, Latte Vainilla..."
                                    style={{
                                        width: '100%', padding: '12px 14px', borderRadius: 12,
                                        border: `1.5px solid ${MARE.mist}`, fontFamily: FONTS.sans,
                                        fontSize: 14, outline: 'none', background: MARE.canvas, color: MARE.ink,
                                        transition: 'border-color 200ms ease',
                                    }}
                                    onFocus={e => e.target.style.borderColor = MARE.primary}
                                    onBlur={e => e.target.style.borderColor = MARE.mist}
                                />
                            </div>

                            <button
                                onClick={handleSavePreferences}
                                style={{
                                    width: '100%', padding: '14px 0', borderRadius: 12,
                                    background: MARE.primary, color: MARE.surface, border: 'none',
                                    fontFamily: FONTS.sans, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                    transition: 'all 200ms ease',
                                }}
                            >
                                Guardar Preferencia
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MarketingNotification userLevel={userLevel} clientCode={config.code} />
        </div>
    );
}
