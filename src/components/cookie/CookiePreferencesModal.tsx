import React, { useEffect, useState } from 'react';
import { useCookieConsent, CookieConsent } from '@/contexts/CookieConsentContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, BarChart3, Radio, Monitor, Info } from 'lucide-react';

const CookiePreferencesModal: React.FC = () => {
    const { isPreferencesOpen, closePreferences, savePreferences, consent } = useCookieConsent();
    const [localConsent, setLocalConsent] = useState<CookieConsent>(consent);

    // Sync local state with global state when modal opens
    useEffect(() => {
        if (isPreferencesOpen) {
            setLocalConsent(consent);
        }
    }, [isPreferencesOpen, consent]);

    const handleToggle = (key: keyof CookieConsent) => {
        if (key === 'necessary') return; // Cannot toggle necessary
        setLocalConsent(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = () => {
        savePreferences(localConsent);
    };

    return (
        <Dialog open={isPreferencesOpen} onOpenChange={(open) => !open && closePreferences()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden bg-[#fdf6f0] border-[#e7dacb]">
                <DialogHeader className="p-6 pb-4 border-b border-[#e7dacb] bg-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-[#4e342e] flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-serif text-[#4e342e]">Cookie Preferences</DialogTitle>
                    </div>
                    <DialogDescription className="text-[#6d4c41]">
                        Manage your cookie settings. You can enable or disable different types of cookies below.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">

                        {/* Strictly Necessary */}
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-[#e7dacb]">
                            <div className="mt-1">
                                <Shield className="w-6 h-6 text-[#4e342e]" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-serif font-bold text-[#4e342e]">Strictly Necessary</h4>
                                    <Switch checked={true} disabled aria-label="Strictly Necessary Cookies" />
                                </div>
                                <p className="text-sm text-[#8d6e63]">
                                    These cookies are essential for the website to function properly. They ensure basic functionalities and security features of the website.
                                </p>
                            </div>
                        </div>

                        {/* Functional */}
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-[#e7dacb]">
                            <div className="mt-1">
                                <Monitor className="w-6 h-6 text-[#6d4c41]" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-serif font-bold text-[#4e342e]">Functional Cookies</h4>
                                    <Switch
                                        checked={localConsent.functional}
                                        onCheckedChange={() => handleToggle('functional')}
                                        className="data-[state=checked]:bg-[#4e342e]"
                                    />
                                </div>
                                <p className="text-sm text-[#8d6e63]">
                                    These cookies allow the website to remember choices you make (such as your user name, language, or the region you are in) and provide enhanced, more personal features.
                                </p>
                            </div>
                        </div>

                        {/* Analytics */}
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-[#e7dacb]">
                            <div className="mt-1">
                                <BarChart3 className="w-6 h-6 text-[#6d4c41]" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-serif font-bold text-[#4e342e]">Analytics Cookies</h4>
                                    <Switch
                                        checked={localConsent.analytics}
                                        onCheckedChange={() => handleToggle('analytics')}
                                        className="data-[state=checked]:bg-[#4e342e]"
                                    />
                                </div>
                                <p className="text-sm text-[#8d6e63]">
                                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                                </p>
                            </div>
                        </div>

                        {/* Marketing */}
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-[#e7dacb]">
                            <div className="mt-1">
                                <Radio className="w-6 h-6 text-[#6d4c41]" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-serif font-bold text-[#4e342e]">Marketing Cookies</h4>
                                    <Switch
                                        checked={localConsent.marketing}
                                        onCheckedChange={() => handleToggle('marketing')}
                                        className="data-[state=checked]:bg-[#4e342e]"
                                    />
                                </div>
                                <p className="text-sm text-[#8d6e63]">
                                    These cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user.
                                </p>
                            </div>
                        </div>

                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-4 border-t border-[#e7dacb] bg-white">
                    <Button variant="outline" onClick={closePreferences} className="border-[#4e342e] text-[#4e342e] hover:bg-[#fdf6f0]">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-[#4e342e] hover:bg-[#3b2c26] text-white">
                        Save Preferences
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CookiePreferencesModal;
