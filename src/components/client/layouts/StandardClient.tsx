'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useClientConfig } from '@/context/ClientConfigContext';
import { Coffee, Crown, Home, ClipboardList, Gift, User as UserIcon, Scan, Clock } from 'lucide-react';
import PoweredBy from '@/components/PoweredBy';

// We reuse some standard components but with Mare's configuration
import ClientHeader from '@/components/client/ClientHeader';
import PromoBanner from '@/components/client/PromoBanner';
import StampProgress from '@/components/client/StampProgress';
import NewsFeed from '@/components/client/NewsFeed';
import BottomNav from '@/components/client/BottomNav';
import QRSheet from '@/components/client/QRSheet';

export default function StandardClient() {
    const config = useClientConfig();
    const [stamps, setStamps] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [userUUID, setUserUUID] = useState('');
    const [userLevel, setUserLevel] = useState(1);
    const [showQRSheet, setShowQRSheet] = useState(false);
    const [showLevelUpModal, setShowLevelUpModal] = useState(false);
    const [favDrink, setFavDrink] = useState('');

    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/auth/login');
                return;
            }

            setUserUUID(session.user.id);

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, client_code, first_name, level, preferences')
                .eq('id', session.user.id)
                .single();

            if (profile?.role !== 'customer') {
                router.push('/unauthorized');
                return;
            }

            setUserName(profile?.first_name || 'Cliente');
            setUserLevel(profile?.level || 1);
            if (profile?.preferences?.favorite_drink) {
                setFavDrink(profile.preferences.favorite_drink);
            }

            fetchStamps(session.user.id);

            const channel = supabase
                .channel('stamps_subscription')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'stamps',
                        filter: `user_id=eq.${session.user.id}`,
                    },
                    () => {
                        fetchStamps(session.user.id);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        checkSession();
    }, [router, config.code]);

    const fetchStamps = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('stamps')
                .select('count')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching stamps:', error);
                return;
            }

            if (data) {
                if (stamps >= (config.rules.stampsPerReward || 10) && data.count < (config.rules.stampsPerReward || 10)) {
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
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab: string) => {
        if (tab === 'menu' && config.features.menuEnabled) router.push('/client/menu');
    };

    const handleSavePreferences = async () => {
        if (!userUUID || !favDrink) return;

        await supabase.from('profiles').update({
            preferences: { favorite_drink: favDrink }
        }).eq('id', userUUID);

        setShowLevelUpModal(false);
        alert('¡Gracias! Guardamos tu preferencia.');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: config.theme.primaryColor }}></div>
            </div>
        );
    }

    const isRewardAvailable = stamps >= (config.rules.stampsPerReward || 10);

    return (
        <div className="min-h-screen bg-slate-50 pb-[100px] relative overflow-hidden" style={{ fontFamily: config.theme.fontFamily }}>

            {/* Header Standard */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">Hola, {userName}</h2>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-0.5">Nivel {userLevel} • {config.name}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <UserIcon size={20} />
                </div>
            </header>

            <main className="pt-24 px-5 flex flex-col gap-6 max-w-lg mx-auto">

                <PromoBanner config={config} />

                <StampProgress
                    currentStamps={stamps}
                    config={config}
                />

                {config.features.showNewsFeed && (
                    <NewsFeed config={config} />
                )}

                <div className="mt-4 opacity-30 text-center">
                    <PoweredBy />
                </div>

            </main>

            <BottomNav
                config={config}
                onQRClick={() => setShowQRSheet(true)}
                onTabChange={handleTabChange}
            />

            <QRSheet
                isOpen={showQRSheet}
                onClose={() => setShowQRSheet(false)}
                config={config}
                userUUID={userUUID}
                isReward={isRewardAvailable}
            />

            {/* Level Up / Preference Modal (Standard Design) */}
            {showLevelUpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 w-full">
                            <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Gift size={32} className="text-brand-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Canje Exitoso!</h2>
                            <p className="text-slate-500 mb-6 text-sm">Has disfrutado tu premio. Cuéntanos, ¿cuál fue tu bebida de hoy?</p>

                            <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-200 mb-6">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tu bebida favorita</label>
                                <input
                                    type="text"
                                    value={favDrink}
                                    onChange={(e) => setFavDrink(e.target.value)}
                                    placeholder="Ej. Latte Vainilla"
                                    className="w-full bg-transparent border-b border-slate-300 focus:border-brand-primary outline-none py-1 text-slate-900 font-medium"
                                />
                            </div>

                            <button
                                onClick={handleSavePreferences}
                                className="w-full bg-brand-primary text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                            >
                                Guardar Preferencia
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
