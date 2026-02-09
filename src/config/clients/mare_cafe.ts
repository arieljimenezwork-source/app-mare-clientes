import { ClientConfig } from '../types';

/**
 * Mare Café — Configuración Premium
 * 
 * Design System: Neo-editorial, post-minimal, artesanal-digital
 * Paleta: Royal Deep Blue + Parchment Cream + Espresso Gold
 * Tipografía: DM Serif Display (headings) + Plus Jakarta Sans (body) + JetBrains Mono (precios)
 * Referentes: Kinfolk Magazine, Cereal Magazine, Aesop Stores, Blue Bottle Coffee
 */
export const mareCafeConfig: ClientConfig = {
    code: 'mare_cafe',
    name: 'Mare Cafe',
    theme: {
        primaryColor: '#1A3278',       // Royal Deep Blue (ajustado desde el design system)
        secondaryColor: '#F2EDE3',     // Parchment Cream
        accentColor: '#C8A96E',        // Espresso Gold — badges, recompensas, estados dorados
        fontFamily: 'var(--font-dm-serif)',       // Headlines: DM Serif Display
        bodyFontFamily: 'var(--font-jakarta)',    // Body/UI: Plus Jakarta Sans
        monoFontFamily: 'var(--font-jetbrains)', // Precios: JetBrains Mono
    },
    texts: {
        welcomeTitle: 'Mare',
        welcomeSubtitle: 'Pastelería y Café de Especialidad',
        stampCardTitle: 'Tu Tarjeta Mare',
        rewardsTitle: 'Tus Recompensas',
    },
    rules: {
        stampsPerReward: 7,
    },
    assets: {
        logo: '/logo-mare.png',
        menuGallery: [
            { src: '/assets/mare/menu/comidas.jpg', label: 'Comidas' },
            { src: '/assets/mare/menu/bebidas.jpg', label: 'Bebidas' },
            { src: '/assets/mare/menu/promociones.jpg', label: 'Promociones' },
        ],
    },
    features: {
        showBuyButton: true,
        externalMenuUrl: undefined,     // Ahora con menú nativo
        showNewsFeed: true,
        menuEnabled: true,
        showAboutUs: true,
        marketingEnabled: true,
        adminSettingsEnabled: true,
    },
};

