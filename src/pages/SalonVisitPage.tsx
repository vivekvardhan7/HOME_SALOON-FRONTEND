import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import {
  Building,
  UserCheck,
  Star,
  Shield,
  Clock,
  CreditCard,
  CheckCircle,
  Sparkles,
  Heart,
  Users,
  Calendar,
  ArrowRight,
  Scissors,
  Palette,
  Award,
  MapPin,
  Phone,
  Mail,
  Package,
  Settings,
  Brush,
  Droplets,
  Search
} from 'lucide-react';

// Assets
import hero3 from '@/assets/hero3.jpg';

interface Vendor {
  id: string;
  shopName: string;
  description: string;
  address: string;
  city: string;
  state: string;
  status: string;
}

const Pagination = ({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) => {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <Button
        variant="outline"
        className="border-[#4e342e] text-[#4e342e]"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </Button>
      {pages.map((p) => (
        <button
          key={p}
          className={`px-3 py-1 rounded-md text-sm ${p === page ? 'bg-[#4e342e] text-white' : 'bg-white text-[#4e342e] border border-[#d7ccc8]'
            }`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <Button
        variant="outline"
        className="border-[#4e342e] text-[#4e342e]"
        disabled={page === total}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
};

const SalonVisitPage = () => {
  const { t } = useTranslation();
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [salonPage, setSalonPage] = useState(1);
  const pageSize = 6;

  // No default salons or placeholders allowed as per strict policy

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

  useEffect(() => {
    fetchVendors('', true); // Initial load
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchInputValue.trim();
    setSalonPage(1);
    fetchVendors(query);
  };

  const fetchVendors = async (search: string = '', isInitial: boolean = false) => {
    try {
      if (isInitial) setLoading(true);
      else setIsSearching(true);

      const url = new URL('http://localhost:3001/api/vendors');
      url.searchParams.append('status', 'APPROVED');
      if (search) {
        url.searchParams.append('search', search);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }

      const data = await response.json();

      // Transform the data to match our strict interface
      // Frontend must trust backend 100%
      const transformedVendors = (data.vendors || [])
        .map((vendor: any) => ({
          id: vendor.id,
          shopName: vendor.shopName, // Strictly mapping shopName from backend
          description: vendor.description || '',
          address: vendor.address || '',
          city: vendor.city || '',
          state: vendor.state || '',
          status: vendor.status
        }));

      setVendors(transformedVendors);
      setError(null);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Unable to load verified salons. Please try again later.');
      setVendors([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const totalSalonPages = Math.max(1, Math.ceil(vendors.length / pageSize));

  // Fix: Ensure salonPage is clamped to totalSalonPages when vendors list changes
  useEffect(() => {
    if (salonPage > totalSalonPages && totalSalonPages > 0) {
      setSalonPage(totalSalonPages);
    }
  }, [vendors.length, totalSalonPages, salonPage]);

  // Fix: Reset page when search changes to avoid Page 2 bug on new results
  useEffect(() => {
    setSalonPage(1);
  }, [searchInputValue]);

  const paginatedVendors = vendors.slice((salonPage - 1) * pageSize, salonPage * pageSize);

  const handleBookAppointment = (vendorId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/vendor/${vendorId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf6f0]">
        <Navigation />
        <div className="pt-20 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4e342e] mx-auto mb-4"></div>
            <p className="text-[#6d4c41]">{t('common.loading')}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf6f0]">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-[#fdf6f0] to-[#f8f4f0] pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="inline-flex items-center px-4 py-2 rounded-full bg-[#f8d7da]/20 text-[#4e342e] text-sm font-medium mb-6"
                variants={fadeInUp}
              >
                <Building className="w-4 h-4 mr-2" />
                {t('salon.title')}
              </motion.div>

              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#4e342e] mb-6 leading-tight"
                variants={fadeInUp}
              >
                Visit Our
                <span className="block text-[#6d4c41]">{t('salon.findSalon')}</span>
              </motion.h1>

              <motion.p
                className="text-lg text-[#6d4c41] leading-relaxed max-w-lg font-sans mb-8"
                variants={fadeInUp}
              >
                {t('salon.subtitle')}
              </motion.p>
            </motion.div>

            {/* Right Content - Hero Image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={hero3}
                  alt="Salon Beauty Services"
                  className="w-full h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/20" />

                {/* Floating Badge */}
                <motion.div
                  className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-[#4e342e] rounded-xl flex items-center justify-center">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#4e342e]">Verified Salons</p>
                      <p className="text-sm text-[#6d4c41]">Professional & Safe</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#4e342e] mb-6">
              {t('salon.viewDetails')}
            </h2>
            <p className="text-lg text-[#6d4c41] max-w-2xl mx-auto">
              We partner with the finest salons to bring you exceptional beauty services in a professional environment.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Shield,
                title: "Verified & Safe",
                description: "All our partner salons are thoroughly vetted for safety and quality standards."
              },
              {
                icon: Star,
                title: "Premium Quality",
                description: "Experience top-tier beauty services with professional-grade products and equipment."
              },
              {
                icon: Clock,
                title: "Flexible Booking",
                description: "Book appointments that fit your schedule with our easy online booking system."
              }
            ].map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="text-center p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#fdf6f0]">
                  <CardContent className="p-0">
                    <div className="w-16 h-16 bg-[#4e342e] rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-[#4e342e] mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-[#6d4c41] leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Partner Salons Section */}
      <section className="py-20 bg-[#fdf6f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#4e342e] mb-6">
              {t('salon.findSalon')}
            </h2>
            <p className="text-lg text-[#6d4c41] max-w-2xl mx-auto mb-10">
              Discover our network of premium salons offering exceptional beauty services.
            </p>

            {/* Premium Redesigned Compact Search Bar */}
            <div className="max-w-xl mx-auto mb-12 px-4">
              <form
                onSubmit={handleSearch}
                className="relative group flex items-center bg-white rounded-full border border-[#d7ccc8]/40 shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:border-[#4e342e]/30 transition-all duration-300"
              >
                <div className="flex items-center flex-grow pl-6">
                  <Search className={`w-4 h-4 mr-3 ${isSearching ? 'text-[#4e342e] animate-pulse' : 'text-[#6d4c41]/50'}`} />
                  <input
                    type="text"
                    placeholder={t('search.searchPlaceholder')}
                    className="w-full py-3.5 bg-transparent outline-none text-[#4e342e] placeholder:text-[#6d4c41]/40 font-sans text-sm"
                    value={searchInputValue}
                    onChange={(e) => setSearchInputValue(e.target.value)}
                  />
                </div>

                <div className="p-1 px-1.5 flex items-center">
                  <Button
                    type="submit"
                    disabled={isSearching}
                    className="bg-[#4e342e] hover:bg-[#3b2c26] text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full transition-all duration-300 flex items-center min-w-[100px] justify-center"
                  >
                    {isSearching ? (
                      <div className="w-4 h-4 rounded-full border-2 border-t-white border-white/20 animate-spin" />
                    ) : (
                      t('common.search')
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {vendors.length === 0 && !loading && (
            <div className="text-center py-16">
              <Building className="w-16 h-16 text-[#6d4c41] mx-auto mb-4 opacity-10" />
              <p className="text-xl text-[#4e342e] font-semibold mb-2">{t('salon.findSalon')}</p>
              <p className="text-[#6d4c41]">Try searching for a different keyword or city.</p>
              {searchInputValue.trim() !== '' && (
                <Button
                  variant="link"
                  className="text-[#4e342e] mt-4 font-semibold hover:no-underline opacity-70 hover:opacity-100"
                  onClick={() => {
                    setSearchInputValue('');
                    setSalonPage(1);
                    fetchVendors('');
                  }}
                >
                  Clear search & Reset
                </Button>
              )}
            </div>
          )}

          <motion.div
            key={`grid-${searchInputValue}-${salonPage}`}
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-300 ${isSearching ? 'opacity-40' : 'opacity-100'}`}
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {paginatedVendors.map((salon) => (
              <motion.div key={salon.id} variants={fadeInUp} className="h-full">
                <Card className="group h-full flex flex-col hover:shadow-xl transition-all duration-300 border-0 bg-white rounded-2xl p-8 relative isolate">
                  <div className="flex-grow flex flex-col">
                    {/* Header: Shop Name & Status */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-serif font-bold text-[#4e342e] leading-tight">
                        {salon.shopName}
                      </h3>
                      {salon.status === 'APPROVED' && (
                        <div className="flex-shrink-0 ml-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-100">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Body: Location */}
                    <div className="flex items-center text-[#6d4c41]/80 mb-8">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-[#4e342e]/40" />
                      <span className="text-sm font-medium">
                        {salon.address}, {salon.city}
                      </span>
                    </div>

                    {/* Footer: CTA Button */}
                    <div className="mt-auto">
                      <Button
                        className="w-full h-12 bg-[#4e342e] hover:bg-[#3b2c26] text-white text-xs font-bold tracking-widest uppercase rounded-xl shadow-lg transition-all duration-300"
                        onClick={() => handleBookAppointment(salon.id)}
                      >
                        {t('salon.bookNow')}
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          <Pagination page={salonPage} total={totalSalonPages} onChange={(p) => setSalonPage(p)} />
        </div>
      </section >

      {/* CTA Section */}
      < section className="py-20 bg-[#4e342e]" >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              Ready to Experience Premium Salon Services?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust our partner salons for their beauty needs.
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button className="bg-white text-[#4e342e] hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    Get Started Today
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-[#4e342e] px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section >
    </div >
  );
};

export default SalonVisitPage;
