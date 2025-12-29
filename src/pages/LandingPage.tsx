import { Helmet } from 'react-helmet-async';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from "react-router-dom";
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import LanguageToggle from '@/components/LanguageToggle';
import HeroCarousel from '@/components/HeroCarousel';

// Assets
import hero3 from '@/assets/hero3.jpg';
import hair4 from '@/assets/hair4.jpg';
import makeup5 from '@/assets/makeup5.jpg';
import spa1 from '@/assets/spa1.jpg';
import nail from '@/assets/nail.jpg';
import hero1 from "../assets/hero1.jpg";
import hero2 from "../assets/hero2.jpg";
import spa_product from "../assets/spa_product.jpg";

// Icons
import {
  Calendar,
  MapPin,
  Clock,
  Mail,
  Phone,
  Shield,
  Award,
  CheckCircle,
  Users,
  Sparkles,
  UserCheck,
  Star,
  ArrowRight,
  Scissors,
  Palette,
  Heart,
  Search,
  Home,
  HelpCircle,
  Building,
  Bell,
  CreditCard
} from 'lucide-react';

const LandingPage = () => {
  const { t, ready } = useTranslation();
  const [email, setEmail] = useState('');

  // Wait for i18n to be ready
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#4e342e]">Loading...</div>
      </div>
    );
  }

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
      <Helmet>
        <title>Home Bonzenga | At-Home & Salon Beauty Services</title>
        <meta
          name="description"
          content="Home Bonzenga provides professional at-home and salon beauty services. Book trusted beauticians near you easily and safely."
        />
      </Helmet>

      <Navigation />

      {/* SEO Internal Linking (Visually Hidden but Crawlable) */}
      <div className="sr-only">
        <a href="/login">Login</a>
        <a href="/register">Register</a>
        <a href="/at-home-services">At-Home Beauty Services</a>
        <a href="/salon-visit">Salon Visits</a>
      </div>

      {/* Hero Carousel Section */}
      <section id="home" className="relative">
        <HeroCarousel
          autoplayDelay={3000}
          showNavigation={false}
          showPagination={true}
        />
      </section>

      {/* ... rest of the component ... */}
    </div>
  );
};

export default LandingPage;
