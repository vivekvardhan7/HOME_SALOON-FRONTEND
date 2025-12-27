import React, { createContext, useContext, useEffect, useState } from 'react';

export type CookieCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';

export interface CookieConsent {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
}

interface CookieConsentContextType {
    consent: CookieConsent;
    hasConsented: boolean; // True if user has made a choice (even if rejected)
    isBannerOpen: boolean;
    isPreferencesOpen: boolean;
    acceptAll: () => void;
    rejectAll: () => void;
    savePreferences: (newConsent: CookieConsent) => void;
    openPreferences: () => void;
    closePreferences: () => void;
    resetConsent: () => void; // For testing or withdrawal
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const STORAGE_KEY = 'home_bonzenga_cookie_consent';
const EXPIRY_DAYS = 365;

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [consent, setConsent] = useState<CookieConsent>({
        necessary: true, // Always true
        functional: false,
        analytics: false,
        marketing: false,
    });
    const [hasConsented, setHasConsented] = useState(false);
    const [isBannerOpen, setIsBannerOpen] = useState(false);
    const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

    useEffect(() => {
        // 1. Check local storage on mount
        const storedData = localStorage.getItem(STORAGE_KEY);

        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                // Check expiration
                const now = new Date().getTime();
                const storedTime = parsed.timestamp;
                const daysDiff = (now - storedTime) / (1000 * 60 * 60 * 24);

                if (daysDiff < EXPIRY_DAYS && parsed.version === '1.0') {
                    setConsent(parsed.consent);
                    setHasConsented(true);
                    setIsBannerOpen(false);
                } else {
                    // Expired or old version
                    setIsBannerOpen(true);
                }
            } catch (e) {
                // Corrupt data
                setIsBannerOpen(true);
            }
        } else {
            // First time visitor
            setIsBannerOpen(true);
        }
    }, []);

    // 2. Logic to handle third-party scripts based on consent
    useEffect(() => {
        if (!hasConsented) return;

        // Example types of scripts to enable
        if (consent.analytics) {
            console.log('Enabling Analytics Cookies/Scripts...');
            // e.g., window.gtag('consent', 'update', { 'analytics_storage': 'granted' });
        }

        if (consent.marketing) {
            console.log('Enabling Marketing Cookies/Scripts...');
            // e.g., enable Facebook Pixel
        }

        if (consent.functional) {
            console.log('Enabling Functional Cookies...');
        }

    }, [consent, hasConsented]);


    const saveToStorage = (newConsent: CookieConsent) => {
        const data = {
            consent: newConsent,
            timestamp: new Date().getTime(),
            version: '1.0', // Useful for invalidating old consents if policy changes
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    const acceptAll = () => {
        const newConsent = {
            necessary: true,
            functional: true,
            analytics: true,
            marketing: true,
        };
        setConsent(newConsent);
        setHasConsented(true);
        setIsBannerOpen(false);
        setIsPreferencesOpen(false);
        saveToStorage(newConsent);
    };

    const rejectAll = () => {
        const newConsent = {
            necessary: true,
            functional: false,
            analytics: false,
            marketing: false,
        };
        setConsent(newConsent);
        setHasConsented(true);
        setIsBannerOpen(false);
        setIsPreferencesOpen(false);
        saveToStorage(newConsent);
    };

    const savePreferences = (newConsent: CookieConsent) => {
        // Ensure necessary is always true
        const validatedConsent = { ...newConsent, necessary: true };
        setConsent(validatedConsent);
        setHasConsented(true);
        setIsBannerOpen(false);
        setIsPreferencesOpen(false);
        saveToStorage(validatedConsent);
    };

    const openPreferences = () => setIsPreferencesOpen(true);
    const closePreferences = () => setIsPreferencesOpen(false);

    const resetConsent = () => {
        localStorage.removeItem(STORAGE_KEY);
        setHasConsented(false);
        setIsBannerOpen(true);
        setConsent({
            necessary: true,
            functional: false,
            analytics: false,
            marketing: false,
        });
    };

    return (
        <CookieConsentContext.Provider
            value={{
                consent,
                hasConsented,
                isBannerOpen,
                isPreferencesOpen,
                acceptAll,
                rejectAll,
                savePreferences,
                openPreferences,
                closePreferences,
                resetConsent,
            }}
        >
            {children}
        </CookieConsentContext.Provider>
    );
};

export const useCookieConsent = () => {
    const context = useContext(CookieConsentContext);
    if (context === undefined) {
        throw new Error('useCookieConsent must be used within a CookieConsentProvider');
    }
    return context;
};
