'use client';

import { createContext, useContext, ReactNode } from 'react';
import { ClientConfig } from '@/config/types';

const ClientConfigContext = createContext<ClientConfig | null>(null);

export function ClientConfigProvider({
    config,
    children
}: {
    config: ClientConfig;
    children: ReactNode;
}) {
    return (
        <ClientConfigContext.Provider value={config}>
            {children}
        </ClientConfigContext.Provider>
    );
}

export function useClientConfig() {
    const context = useContext(ClientConfigContext);
    if (!context) {
        throw new Error('useClientConfig must be used within a ClientConfigProvider');
    }
    return context;
}
