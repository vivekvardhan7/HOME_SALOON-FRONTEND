import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

interface PlatformConfig {
    platformName: string;
    platformDescription: string;
    supportEmail: string;
    supportPhone: string;
    platformAddress: string;
}

interface PlatformSettingsContextType {
    config: PlatformConfig;
    loading: boolean;
    refreshConfig: () => Promise<void>;
}

const defaultConfig: PlatformConfig = {
    platformName: 'Home Bonzenga',
    platformDescription: 'Premium Beauty Services',
    supportEmail: 'support@homebonzenga.com',
    supportPhone: '+243 123 456 789',
    platformAddress: 'Kinshasa, DR Congo',
};

const PlatformSettingsContext = createContext<PlatformSettingsContextType>({
    config: defaultConfig,
    loading: true,
    refreshConfig: async () => { },
});

export const PlatformSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<PlatformConfig>(defaultConfig);
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        try {
            // Use the centralized API client which handles the correct Base URL
            const response = await api.get('/config');
            if ((response.data as any).success && (response.data as any).config) {
                setConfig((response.data as any).config);
            }
        } catch (error) {
            console.error('Failed to fetch platform config:', error);
            // Fallback is already set
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    return (
        <PlatformSettingsContext.Provider value={{ config, loading, refreshConfig: fetchConfig }}>
            {children}
        </PlatformSettingsContext.Provider>
    );
};

export const usePlatformSettings = () => useContext(PlatformSettingsContext);
