'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useClientConfig } from '@/context/ClientConfigContext';
import { Coffee, Crown } from 'lucide-react';

// Coffeinopia Components
import ClientHeader from '@/components/client/ClientHeader';
import PromoBanner from '@/components/client/PromoBanner';
import StampProgress from '@/components/client/StampProgress';
import NewsFeed from '@/components/client/NewsFeed';
import BottomNav from '@/components/client/BottomNav';
import QRSheet from '@/components/client/QRSheet';
import PoweredBy from '@/components/PoweredBy';

export default function PerezosoClient() {
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
        if (tab === 'menu') router.push('/client/menu');
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
        <div className="min-h-screen bg-[#FAFAFA] pb-[100px] relative overflow-hidden" style={{ fontFamily: config.theme.fontFamily }}>

            <ClientHeader config={config} userName={userName} level={userLevel} />

            <main className="pt-36 px-5 flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-700">

                <PromoBanner config={config} />

                <StampProgress
                    currentStamps={stamps}
                    config={config}
                />

                {config.features.showNewsFeed && (
                    <NewsFeed config={config} />
                )}

                <div className="mt-4 opacity-50">
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

            {showLevelUpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-yellow-50 opacity-50"></div>
                        <div className="relative z-10 w-full">
                            <div className="text-6xl mb-4 animate-bounce">🎉</div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">¡Canje Exitoso!</h2>
                            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 mt-4">
                                <Crown size={40} className="text-amber-500" />
                            </div>
                            <p className="text-gray-500 mb-6">Has disfrutado tu premio. ¡Sigue acumulando para el próximo!</p>

                            <div className="bg-white/80 p-4 rounded-xl text-left border border-gray-200 mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Coffee size={16} /> ¿Cuál es tu bebida favorita?
                                </label>
                                <input
                                    type="text"
                                    value={favDrink}
                                    onChange={(e) => setFavDrink(e.target.value)}
                                    placeholder="Ej. Latte Vainilla"
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 px-3 py-2 text-gray-900 border"
                                />
                            </div>

                            <button
                                onClick={handleSavePreferences}
                                className="w-full bg-gray-900 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:scale-105 transition-transform"
                            >
                                ¡Genial!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
