import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { Button } from "@/components/ui/button";
import { Cookie } from 'lucide-react';

const CookieBanner: React.FC = () => {
    const { isBannerOpen, acceptAll, openPreferences, rejectAll } = useCookieConsent();

    return (
        <AnimatePresence>
            {isBannerOpen && (
                <>
                    {/* Backdrop for mobile focus */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 z-[99] md:hidden"
                    />

                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ duration: 0.5, type: 'spring', damping: 20 }}
                        className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
                    >
                        <div className="max-w-7xl mx-auto">
                            <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-[#e7dacb] p-6 md:flex items-center justify-between gap-6">

                                <div className="flex-1 mb-6 md:mb-0">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-[#fdf6f0] rounded-lg">
                                            <Cookie className="w-6 h-6 text-[#4e342e]" />
                                        </div>
                                        <h3 className="font-serif font-bold text-lg text-[#4e342e]">
                                            We Value Your Privacy
                                        </h3>
                                    </div>
                                    <p className="text-[#6d4c41] text-sm leading-relaxed max-w-2xl">
                                        We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                                        By clicking "Accept All", you consent to our use of cookies.
                                        Strictly necessary cookies are always enabled to ensure the website functions properly.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                                    <Button
                                        variant="outline"
                                        onClick={openPreferences}
                                        className="w-full sm:w-auto border-[#4e342e] text-[#4e342e] hover:bg-[#fdf6f0]"
                                    >
                                        Customize
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={rejectAll}
                                        className="w-full sm:w-auto border-[#e7dacb] text-[#8d6e63] hover:text-[#4e342e] hover:bg-[#fdf6f0]"
                                    >
                                        Reject All
                                    </Button>
                                    <Button
                                        onClick={acceptAll}
                                        className="w-full sm:w-auto bg-[#4e342e] hover:bg-[#3b2c26] text-white shadow-lg shadow-[#4e342e]/20"
                                    >
                                        Accept All
                                    </Button>
                                </div>

                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CookieBanner;
