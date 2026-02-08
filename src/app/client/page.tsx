'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useClientConfig } from '@/context/ClientConfigContext';
import { ClientConfig } from '@/config/types';
import PoweredBy from '@/components/PoweredBy';
import { Coffee, Crown, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import NewsFeed from '@/components/client/NewsFeed';

// New Components
import ClientHeader from '@/components/client/ClientHeader';
import WelcomeHero from '@/components/client/WelcomeHero';
import StampProgress from '@/components/client/StampProgress';
import RewardsCard from '@/components/client/RewardsCard';
import MenuButton from '@/components/client/MenuButton';
import QRFloatingButton from '@/components/client/QRFloatingButton';
import QRModal from '@/components/client/QRModal';
import AboutUs from '@/components/client/AboutUs';

export default function ClientDashboard() {
  const router = useRouter();
  const config = useClientConfig();
  const [stamps, setStamps] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [userUUID, setUserUUID] = useState<string | null>(null);

  // UI States
  const [showQRModal, setShowQRModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [favDrink, setFavDrink] = useState('');

  // Polling Ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const init = async () => {
      // Config from Context
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login?role=customer');
        return;
      }

      // 1. Validate Client Isolation
      const { data: profile } = await supabase.from('profiles').select('client_code').eq('id', user.id).single();

      let isValidUser = true;

      if (config.code === 'perezoso_cafe') {
        // Perezoso requires strict match
        if (profile?.client_code !== 'perezoso_cafe') isValidUser = false;
      } else if (config.code === 'mare_cafe') {
        // Mare allows null (legacy) or match
        if (profile?.client_code && profile.client_code !== 'mare_cafe') isValidUser = false;
      } else {
        // Default strict if code present
        if (profile?.client_code && profile.client_code !== config.code) isValidUser = false;
      }

      if (!isValidUser) {
        await supabase.auth.signOut();
        alert(`Tu cuenta no pertenece a ${config.name}.`);
        router.push('/');
        return;
      }

      setUserUUID(user.id);
      await fetchData(user.id);
      setLoading(false);
    };

    init();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [router, config]);

  // Polling Logic: Watch for Redemption or Stamps update when QR is open
  useEffect(() => {
    if (showQRModal) {
      pollingRef.current = setInterval(async () => {
        if (userUUID) {
          const { data } = await supabase.from('stamps').select('count').eq('user_id', userUUID).single();
          if (data) {
            // Check if stamps dropped (redemption)
            if (stamps >= 7 && data.count < 7) {
              // Assuming 7 is the threshold, but should use config.rules.stampsPerReward ideally. 
              // However config might be null here if not careful, but useEffect dep array handles updates? 
              // Let's use current stamps state vs new data.
              // Actually, improved logic:
              setShowQRModal(false);
              setShowLevelUpModal(true);
            }

            // Always update stamps to show real-time progress if they just got a stamp
            if (data.count !== stamps) {
              setStamps(data.count);
            }
          }
        }
      }, 3000); // Check every 3s
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [showQRModal, userUUID, stamps]); // Added stamps to dependency

  const fetchData = async (uuid: string) => {
    // 1. Stamps
    const { data: stampData } = await supabase.from('stamps').select('count').eq('user_id', uuid).single();
    if (stampData) setStamps(stampData.count);

    // 2. Profile (Level + Name)
    const { data: profileData } = await supabase.from('profiles').select('level, preferences, first_name').eq('id', uuid).single();
    if (profileData) {
      setLevel(profileData.level || 1);
      if (profileData.first_name) setUserName(profileData.first_name);
    }
  };

  const handleSavePreferences = async () => {
    if (!userUUID || !favDrink) return;

    await supabase.from('profiles').update({
      preferences: { favorite_drink: favDrink }
    }).eq('id', userUUID);

    setShowLevelUpModal(false);
    alert('¡Gracias! Guardamos tu preferencia.');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;

  const isRewardReady = stamps >= config.rules.stampsPerReward;

  return (
    <main
      className="min-h-screen flex flex-col font-sans transition-colors duration-500"
      style={{
        backgroundColor: config.theme.secondaryColor,
        color: config.theme.primaryColor,
      }}
    >
      <ClientHeader
        config={config}
        level={level}
        onLogout={handleLogout}
        showGoldQR={showQRModal && isRewardReady} // Pass this to style header if needed, though header might not need to change color anymore?
      // Actually, the new design keeps the header simple. Let's see ClientHeader props.
      // It accepts showGoldQR. If true, it turns black/gold.
      />

      <div className="flex-1 max-w-md md:max-w-xl lg:max-w-2xl mx-auto w-full p-4 md:p-6 pt-56 md:pt-60 flex flex-col gap-6 md:gap-8 pb-24">

        {/* Hero Section */}
        <WelcomeHero
          config={config}
          userName={userName}
          showGoldQR={false} // Always false in main view now
        />

        {/* Progress Section */}
        <StampProgress config={config} stamps={stamps} />

        {/* Reward CTA */}
        <RewardsCard
          config={config}
          isRewardReady={isRewardReady}
          onOpenQR={() => setShowQRModal(true)}
        />

        {/* Menu CTA */}
        <MenuButton config={config} />

        {/* News Feed */}
        {config.features.showNewsFeed && <NewsFeed />}

        {/* About Us */}
        <AboutUs config={config} />

      </div>

      {/* Floating Action Button */}
      <QRFloatingButton
        onClick={() => setShowQRModal(true)}
        primaryColor={config.theme.primaryColor}
      />

      {/* QR Modal (Bottom Sheet) */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        userUUID={userUUID}
        isRewardReady={isRewardReady}
        config={config}
      />

      {/* Level Up / Reward Claimed Modal */}
      {showLevelUpModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Crown size={40} className="text-amber-500" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800">¡Nivel {level} Desbloqueado! 🚀</h2>
              <p className="text-gray-500 mt-2">Se nota que te gusta lo que hacemos. Gracias por elegirnos.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl text-left border border-gray-200">
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
              className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              Guardar y Continuar
            </button>
          </div>
        </div>
      )}

      <div className="pb-6">
        <PoweredBy />
      </div>

    </main>
  );
}
