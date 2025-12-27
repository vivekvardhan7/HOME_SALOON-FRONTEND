import React from 'react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import Navigation from '@/components/Navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, Shield, Settings, Info, Globe, Lock } from 'lucide-react';

const CookiePolicy: React.FC = () => {
    const { openPreferences } = useCookieConsent();

    return (
        <div className="min-h-screen bg-[#fdf6f0]">
            <Navigation />

            {/* Hero Section */}
            <section className="pt-40 pb-16 bg-gradient-to-br from-[#4e342e] to-[#3b2c26] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-6">
                            Cookie Policy
                        </h1>
                        <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                            Transparency about how we use cookies and tracking technologies to improve your experience on HOME BONZENGA.
                        </p>
                        <div className="mt-8">
                            <Button
                                onClick={openPreferences}
                                className="bg-white text-[#4e342e] hover:bg-gray-100 font-bold px-8 py-6 text-lg shadow-xl"
                            >
                                Manage Cookie Preferences
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

                    {/* Introduction */}
                    <div className="prose max-w-none">
                        <p className="text-lg text-[#6d4c41] leading-relaxed">
                            This Cookie Policy explains how HOME BONZENGA ("we", "us", and "our") uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
                        </p>
                    </div>

                    {/* What are Cookies */}
                    <Card className="border-0 shadow-md bg-white overflow-hidden">
                        <div className="bg-[#4e342e]/5 p-6 border-b border-[#e7dacb]">
                            <div className="flex items-center gap-3">
                                <Cookie className="w-6 h-6 text-[#4e342e]" />
                                <h2 className="text-2xl font-serif font-bold text-[#4e342e]">What are Cookies?</h2>
                            </div>
                        </div>
                        <CardContent className="p-6 text-[#6d4c41] space-y-4">
                            <p>
                                Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
                            </p>
                            <p>
                                Cookies set by the website owner (in this case, HOME BONZENGA) are called "first-party cookies". Cookies set by parties other than the website owner are called "third-party cookies". Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics).
                            </p>
                        </CardContent>
                    </Card>

                    {/* Types of Cookies */}
                    <div className="space-y-6">
                        <h2 className="text-3xl font-serif font-bold text-[#4e342e] text-center">Types of Cookies We Use</h2>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="border-[#e7dacb] bg-white">
                                <CardContent className="p-6">
                                    <Shield className="w-8 h-8 text-[#4e342e] mb-4" />
                                    <h3 className="text-xl font-bold text-[#4e342e] mb-2">Strictly Necessary Cookies</h3>
                                    <p className="text-[#6d4c41] text-sm">
                                        These cookies are essential for you to browse the website and use its features, such as accessing secure areas of the site. Without these cookies, services like shopping baskets or e-billing cannot be provided.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-[#e7dacb] bg-white">
                                <CardContent className="p-6">
                                    <Settings className="w-8 h-8 text-[#4e342e] mb-4" />
                                    <h3 className="text-xl font-bold text-[#4e342e] mb-2">Functional Cookies</h3>
                                    <p className="text-[#6d4c41] text-sm">
                                        These cookies allow the website to remember choices you make (such as your username, language, or the region you are in) and provide enhanced, more personal features.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-[#e7dacb] bg-white">
                                <CardContent className="p-6">
                                    <Globe className="w-8 h-8 text-[#4e342e] mb-4" />
                                    <h3 className="text-xl font-bold text-[#4e342e] mb-2">Analytics Cookies</h3>
                                    <p className="text-[#6d4c41] text-sm">
                                        These cookies collect information about how you use a website, like which pages you visited and which links you clicked on. None of this information can be used to identify you. It is all aggregated and, therefore, anonymized.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-[#e7dacb] bg-white">
                                <CardContent className="p-6">
                                    <Info className="w-8 h-8 text-[#4e342e] mb-4" />
                                    <h3 className="text-xl font-bold text-[#4e342e] mb-2">Marketing Cookies</h3>
                                    <p className="text-[#6d4c41] text-sm">
                                        These cookies track your online activity to help advertisers deliver more relevant advertising or to limit how many times you see an ad. These cookies can share that information with other organizations or advertisers.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* How to Control */}
                    <Card className="border-0 shadow-md bg-white overflow-hidden">
                        <div className="bg-[#4e342e]/5 p-6 border-b border-[#e7dacb]">
                            <div className="flex items-center gap-3">
                                <Lock className="w-6 h-6 text-[#4e342e]" />
                                <h2 className="text-2xl font-serif font-bold text-[#4e342e]">How to Control Cookies</h2>
                            </div>
                        </div>
                        <CardContent className="p-6 text-[#6d4c41] space-y-4">
                            <p>
                                You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.
                            </p>
                            <p>
                                The Cookie Consent Manager can be found in the notification banner and on our website. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.
                            </p>
                            <div className="pt-4">
                                <Button onClick={openPreferences} variant="outline" className="border-[#4e342e] text-[#4e342e]">
                                    Open Cookie Settings
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact */}
                    <div className="text-center pt-8 border-t border-[#e7dacb]">
                        <h3 className="text-xl font-bold text-[#4e342e] mb-4">Questions about this policy?</h3>
                        <p className="text-[#6d4c41] mb-6">
                            If you have any questions about our use of cookies or other technologies, please email us.
                        </p>
                        <div className="inline-flex items-center justify-center px-6 py-3 bg-[#fdf6f0] rounded-full text-[#4e342e] border border-[#e7dacb] font-medium">
                            homebonzenga@outlook.com
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default CookiePolicy;
