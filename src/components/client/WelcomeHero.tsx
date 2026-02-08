import { ClientConfig } from '@/config/types';

interface WelcomeHeroProps {
    config: ClientConfig;
    userName: string;
    showGoldQR: boolean;
}

export default function WelcomeHero({ config, userName, showGoldQR }: WelcomeHeroProps) {
    return (
        <div className="text-center space-y-2">
            {showGoldQR ? (
                <div className="animate-pulse">
                    <h2 className="text-3xl font-bold text-amber-400">¡Momento Mágico! ✨</h2>
                    <p className="text-amber-200">Muestrale este código al barista</p>
                </div>
            ) : (
                <>
                    <h2 className="text-2xl font-bold">Hola, {userName || 'Cliente'} 👋</h2>
                    <p className="opacity-80">{config.texts.welcomeSubtitle}</p>
                </>
            )}
        </div>
    );
}
