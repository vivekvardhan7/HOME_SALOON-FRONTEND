import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import {
    Shield,
    Eye,
    Lock,
    Share2,
    FileCheck,
    UserCheck,
    Cookie
} from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
    const { t } = useTranslation();

    const sections = [
        {
            id: 1,
            title: "Information We Collect",
            icon: Eye,
            content: "We collect personal information that you provide to us, such as your name, email address, phone number, and location when you register or book a service."
        },
        {
            id: 2,
            title: "How We Use Your Information",
            icon: UserCheck,
            content: "Your information is used to facilitate bookings, process payments, provide customer support, and improve our services to enhance your experience."
        },
        {
            id: 3,
            title: "Data Protection & Security",
            icon: Lock,
            content: "We implement robust security measures, including encryption and secure servers, to protect your personal data from unauthorized access or disclosure."
        },
        {
            id: 4,
            title: "Third-Party Sharing",
            icon: Share2,
            content: "We do not sell your personal information. We only share data with verified partners (like beauticians or payment processors) necessary to fulfill your requests."
        },
        {
            id: 5,
            title: "Cookies Policy",
            icon: Cookie,
            content: (
                <span>
                    We use cookies to improve site functionality, remember your preferences, and analyze our traffic.
                    For more details, please see our <Link to="/cookie-policy" className="text-[#4e342e] font-bold underline hover:text-[#3b2c26]">Cookie Policy</Link>.
                </span>
            )
        },
        {
            id: 6,
            title: "Your Privacy Rights",
            icon: Shield,
            content: "You have the right to access, correct, or delete your personal information. You can manage your privacy settings through your account dashboard."
        },
        {
            id: 7,
            title: "Compliance with Laws",
            icon: FileCheck,
            content: "We comply with applicable data protection laws and cooperate with regulatory authorities to ensure your privacy is always respected."
        }
    ];

    return (
        <div className="min-h-screen bg-[#fdf6f0]">
            <Navigation />

            {/* Hero Section */}
            <section className="pt-40 pb-16 bg-gradient-to-br from-[#4e342e] to-[#3b2c26] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-6">
                            Privacy Policy – HOME BONZENGA
                        </h1>
                        <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                            Your privacy is important to us. This policy outlines how we collect,
                            use, and protect your personal information on our platform.
                        </p>
                    </div>
                </div>
            </section>

            {/* Policy Sections */}
            <section className="py-20 bg-[#fdf6f0]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-8">
                        {sections.map((section) => (
                            <Card key={section.id} className="hover:shadow-lg transition-all duration-300 border-0 bg-white rounded-2xl">
                                <CardContent className="p-8">
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-[#4e342e] rounded-xl flex items-center justify-center flex-shrink-0">
                                            <section.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-serif font-bold text-[#4e342e] mb-4">
                                                {section.title}
                                            </h3>
                                            <p className="text-[#6d4c41] leading-relaxed">
                                                {section.content}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
