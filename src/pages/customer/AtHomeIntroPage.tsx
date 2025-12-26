import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import {
    Home,
    UserCheck,
    Star,
    Shield,
    Clock,
    Sparkles,
    ArrowRight,
    Settings,
    CheckCircle,
    Package
} from 'lucide-react';

const AtHomeIntroPage = () => {
    const fadeInUp = {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const stagger = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#fdf6f0]">
            <Navigation />

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center bg-gradient-to-br from-[#fdf6f0] via-[#fcf2e8] to-[#f8d7da]/20 pt-20 overflow-hidden">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 text-center">
                    <motion.div
                        className="space-y-6"
                        initial="initial"
                        animate="animate"
                        variants={stagger}
                    >
                        <motion.div variants={fadeInUp}>
                            <div className="inline-flex items-center bg-gradient-to-r from-[#f8d7da] to-[#f0c8cc] rounded-full px-8 py-4 mb-8 shadow-lg border border-[#f8d7da]/30">
                                <Sparkles className="w-6 h-6 text-[#4e342e] mr-3" />
                                <span className="text-sm font-bold text-[#4e342e] uppercase tracking-wide">PREMIUM AT-HOME SERVICES</span>
                            </div>
                        </motion.div>

                        <motion.h1
                            className="text-4xl lg:text-5xl xl:text-6xl font-serif font-bold text-[#4e342e] leading-tight"
                            variants={fadeInUp}
                        >
                            Salon Luxury,
                            <span className="block text-transparent bg-gradient-to-r from-[#4e342e] to-[#6d4c41] bg-clip-text relative">
                                Right at Your Home
                                <span className="absolute -right-3 -top-3 text-3xl">✨</span>
                            </span>
                        </motion.h1>

                        <motion.p
                            className="text-xl lg:text-2xl text-[#6d4c41] leading-relaxed font-sans max-w-3xl mx-auto"
                            variants={fadeInUp}
                        >
                            Verified beauticians, with or without products — all managed by our trusted professional team.
                        </motion.p>

                        <motion.div
                            className="pt-8"
                            variants={fadeInUp}
                        >
                            <Link to="/customer/at-home-services/select-option">
                                <Button className="bg-gradient-to-r from-[#4e342e] to-[#6d4c41] hover:from-[#3b2c26] hover:to-[#5a3520] text-white px-10 py-5 text-xl font-bold rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 group transform hover:scale-105">
                                    <Home className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                                    Book At-Home Services
                                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-20"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center bg-[#f8d7da]/30 rounded-full px-6 py-3 mb-8">
                            <Clock className="w-5 h-5 text-[#4e342e] mr-3" />
                            <span className="text-sm font-bold text-[#4e342e] uppercase tracking-wide">HOW IT WORKS</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-serif font-bold text-[#4e342e] mb-8 leading-tight">
                            Professional 4-Step Process
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'User Books Service',
                                description: 'Choose your service category and decide whether you need products brought by our stylist.',
                                icon: Star,
                                color: 'from-[#4e342e] to-[#6d4c41]'
                            },
                            {
                                step: '02',
                                title: 'Quality Check',
                                description: 'Our professional manager reviews your request and service requirements for quality control.',
                                icon: Settings,
                                color: 'from-[#4e342e] to-[#6d4c41]'
                            },
                            {
                                step: '03',
                                title: 'Smart Assignment',
                                description: 'Our manager assigns the best certified beautician based on your specific needs.',
                                icon: UserCheck,
                                color: 'from-[#4e342e] to-[#6d4c41]'
                            },
                            {
                                step: '04',
                                title: 'Home Delivery',
                                description: 'Professional service delivery at your doorstep - secure, hygienic, and reliable.',
                                icon: Home,
                                color: 'from-[#4e342e] to-[#6d4c41]'
                            }
                        ].map((step, index) => (
                            <Card key={index} className="text-center hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-[#fdf6f0] to-white rounded-3xl h-full overflow-hidden group">
                                <CardContent className="p-8">
                                    <div className="mb-8">
                                        <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                                            <step.icon className="w-10 h-10 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-serif font-bold mb-4 text-[#4e342e]">
                                        {step.title}
                                    </h3>
                                    <p className="text-[#6d4c41] leading-relaxed font-sans text-sm">
                                        {step.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="py-24 bg-gradient-to-br from-[#fdf6f0] to-[#f8e8e0]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: Shield,
                                title: 'Verified Professionals',
                                description: 'All beauticians are professionally certified and background-verified.'
                            },
                            {
                                icon: CheckCircle,
                                title: 'Quality Managed',
                                description: 'Every service is supervised by our management team for reliability.'
                            },
                            {
                                icon: Package,
                                title: 'Flexible Options',
                                description: 'Book services with products or bring your own brand favorites.'
                            },
                            {
                                icon: Home,
                                title: 'Home Comfort',
                                description: 'Experience professional salon results in the safety of your home.'
                            }
                        ].map((feature, index) => (
                            <div key={index} className="text-center">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                                    <feature.icon className="w-8 h-8 text-[#4e342e]" />
                                </div>
                                <h3 className="text-lg font-serif font-bold text-[#4e342e] mb-2">{feature.title}</h3>
                                <p className="text-sm text-[#6d4c41]">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AtHomeIntroPage;
