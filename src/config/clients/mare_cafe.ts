import { ClientConfig } from '../types';

export const mareCafeConfig: ClientConfig = {
    code: 'mare_cafe',
    name: 'Mare Cafe',
    theme: {
        primaryColor: '#1E3A8A', // Royal Deep Blue
        secondaryColor: '#F5F5DC', // Beige/Cream
        fontFamily: 'var(--font-playfair)',
    },
    texts: {
        welcomeTitle: 'Mare', // Just "Mare" usually looks cleaner if using the logo font
        welcomeSubtitle: 'Pastelería y Café de Especialidad',
        stampCardTitle: 'Tu Tarjeta de Fidelidad',
        rewardsTitle: 'Tus Recompensas',
    },
    rules: {
        stampsPerReward: 7,
    },
    assets: {
        logo: '/logo-mare.png',
    },
    features: {
        showBuyButton: false,
        externalMenuUrl: 'https://instagram.com/marecafe',
        showNewsFeed: true,
        menuEnabled: false,
    },
};

