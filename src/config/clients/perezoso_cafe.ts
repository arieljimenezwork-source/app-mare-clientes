import { ClientConfig } from '../types';

export const perezosoCafeConfig: ClientConfig = {
    code: 'perezoso_cafe',
    name: 'Perezoso Cafe',
    theme: {
        primaryColor: '#2E2333', // Perezoso Dark Purple
        secondaryColor: '#FFF5E1', // Perezoso Cream
        accentColor: '#F5A623', // Perezoso Orange
        fontFamily: 'var(--font-fredoka)',
    },
    texts: {
        welcomeTitle: 'Perezoso',
        welcomeSubtitle: 'Café para ir con calma 🦥',
        stampCardTitle: 'Tu Tarjeta de Recompensas',
        rewardsTitle: 'Mis Regalos',
    },
    rules: {
        stampsPerReward: 10,
    },
    assets: {
        logo: '/assets/perezoso/LogoPerezoso.png',
        gallery: [
            '/assets/perezoso/image-1.png',
            '/assets/perezoso/image-2.png',
            '/assets/perezoso/image-3.png',
            '/assets/perezoso/image-4.png',
            '/assets/perezoso/image-5.png',
            '/assets/perezoso/image-6.png',
            '/assets/perezoso/image-7.png',
            '/assets/perezoso/image-8.png',
        ],
    },
    social: {
        instagram: 'https://www.instagram.com/perezoso.cafe/',
    },
    features: {
        showBuyButton: true,
        externalMenuUrl: 'https://perezosocafe.com/menu',
        showNewsFeed: true,
        menuEnabled: true,
        showAboutUs: true,
    },
};
