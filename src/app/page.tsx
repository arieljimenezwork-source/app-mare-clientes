'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useClientConfig } from '@/context/ClientConfigContext';
import { User, Store, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const router = useRouter();
  const config = useClientConfig();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch profile to know role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          if (profile.role === 'customer') router.push('/client');
          else if (profile.role === 'admin') router.push('/admin');
          else router.push('/staff');
          return;
        }
      }
      setLoading(false);
    };
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4" style={{ backgroundColor: config.theme.primaryColor }}>
        {/* INCREASED LOADING SIZE: w-44 h-44 */}
        <div className="w-44 h-44 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
          {config.assets?.logo && (
            <Image src={config.assets.logo} alt="Loading" width={120} height={120} className="object-contain opacity-80" />
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-between p-6 text-center"
      style={{ backgroundColor: config.theme.primaryColor, color: 'white' }}>

      {/* Main Content Centered */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md space-y-10">

        <div className="space-y-6 animate-in fade-in zoom-in duration-700 mt-12">
          {/* REDUCED SIZE: w-72 h-72 (10% smaller than w-80) */}
          <div className="w-72 h-72 flex items-center justify-center mx-auto relative">
            <div className="relative w-full h-full">
              {config.assets?.logo && (
                <Image
                  src={config.assets.logo}
                  alt={config.name}
                  fill
                  className="object-contain scale-150"
                  priority
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{config.name}</h1>
            <p className="text-lg text-white/70 max-w-xs mx-auto leading-relaxed font-light">
              {config.texts.welcomeSubtitle}
            </p>
          </div>
        </div>

        {/* Actions - Modernized & Cleaner */}
        <div className="w-full space-y-4 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
          <Link
            href="/auth/login?role=customer"
            className="group relative w-full flex items-center justify-center gap-3 p-5 bg-white text-black rounded-full shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all font-bold text-xl overflow-hidden"
          >
            <User className="w-6 h-6 text-gray-900" />
            <span>Soy Cliente</span>
          </Link>

          <Link
            href="/auth/login?role=staff"
            className="w-full flex items-center justify-center gap-3 p-4 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all font-medium text-sm backdrop-blur-md"
          >
            <Store className="w-4 h-4" />
            <span>Acceso Staff</span>
          </Link>
        </div>
      </div>

      {/* Footer - Pinned Bottom */}
      <footer className="w-full pt-6 pb-2 text-[10px] text-white/30 font-medium tracking-[0.2em] uppercase">
        Desarrollado por <span className="font-bold text-white/50">BRANDIA</span>
      </footer>
    </main>
  );
}
