import { ClientConfig } from '../config/types';
import { mareCafeConfig } from '../config/clients/mare_cafe';
import { perezosoCafeConfig } from '../config/clients/perezoso_cafe';

// Map of client codes to their configurations
const clients: Record<string, ClientConfig> = {
    mare_cafe: mareCafeConfig,
    perezoso_cafe: perezosoCafeConfig,
};

// Default to mare_cafe if not specified or found (for safety in MVP)
const DEFAULT_CLIENT = mareCafeConfig;

export function getClientConfig(): ClientConfig {
    const clientCode = process.env.NEXT_PUBLIC_CLIENT_CODE;

    if (!clientCode) {
        console.warn('NEXT_PUBLIC_CLIENT_CODE is not set, using default client.');
        return DEFAULT_CLIENT;
    }

    const config = clients[clientCode];

    if (!config) {
        console.error(`Configuration for client "${clientCode}" not found, using default.`);
        return DEFAULT_CLIENT;
    }

    return config;
}
