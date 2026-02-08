import { MetadataRoute } from 'next';
import { getShopConfig } from '@/lib/shop-service';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const config = await getShopConfig(process.env.NEXT_PUBLIC_CLIENT_CODE || 'mare_cafe');

    if (!config) {
        return {
            name: 'Loyalty App',
            short_name: 'Loyalty',
            start_url: '/',
            display: 'standalone',
            icons: []
        }
    }

    const iconPath = config.assets.favicon || config.assets.logo;

    return {
        name: config.name,
        short_name: config.name,
        description: config.texts.welcomeSubtitle,
        start_url: '/',
        display: 'standalone',
        background_color: config.theme.secondaryColor, // Improved contrast usually
        theme_color: config.theme.primaryColor,
        icons: [
            {
                src: iconPath,
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: iconPath,
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
