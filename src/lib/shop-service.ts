import { supabase } from '@/lib/supabase';
import { ClientConfig } from '@/config/types';

// Default config values to fallback if DB fails or is empty, 
// ensuring the app doesn't crash completely.
const DEFAULT_CONFIG: ClientConfig = {
    code: 'default',
    name: 'Loading...',
    theme: {
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        fontFamily: 'sans-serif'
    },
    texts: {
        welcomeTitle: 'Welcome',
        welcomeSubtitle: '',
        stampCardTitle: 'Rewards',
        rewardsTitle: 'My Rewards'
    },
    rules: { stampsPerReward: 10 },
    assets: { logo: '' },
    features: {
        showBuyButton: false,
        showNewsFeed: false,
        menuEnabled: false
    }
};

export async function getShopConfig(code: string): Promise<ClientConfig | null> {
    try {
        const { data, error } = await supabase
            .from('shops')
            .select('config, name')
            .eq('code', code)
            .single();

        if (error || !data) {
            console.error(`Error fetching config for ${code}:`, error);
            return null;
        }

        // Merge DB config with name and code
        const config = data.config as Partial<ClientConfig>;

        return {
            ...DEFAULT_CONFIG,
            ...config,
            code: code,
            name: data.name
        } as ClientConfig;

    } catch (e) {
        console.error('Unexpected error fetching shop config:', e);
        return null;
    }
}
