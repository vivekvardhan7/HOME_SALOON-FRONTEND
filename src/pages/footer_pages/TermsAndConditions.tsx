import React from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield,
  FileText,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const TermsAndConditions: React.FC = () => {
  const { t } = useTranslation();

  const sections = [
    {
      id: 1,
      title: "Accurate Business Information",
      icon: CheckCircle,
      content: "The salon must provide and maintain accurate, complete, and up-to-date information regarding their salon, services, pricing, availability, and contact details."
    },
    {
      id: 2,
      title: "Membership Fees & Commission",
      icon: Users,
      content: "The salon agrees to a monthly membership fee of USD 10 and a commission of 15% on total monthly sales volume generated through the platform. "
    },
    {
      id: 3,
      title: " Account Suspension & Termination",
      icon: Shield,
      content: "HOME BONZENGA reserves the right to suspend or terminate a salon’s membership with immediate effect, without prior notice, in case of suspicious activities or unacceptable behavior. And alert local authorities for immediate actions. "
    },
    {
      id: 4,
      title: "Payout Schedule",
      icon: CreditCard,
      content: "All salons’ revenues are paid once at the end of each calendar month, after deduction of applicable fees and commissions."
    },
    {
      id: 5,
      title: "False Advertising",
      icon: AlertCircle,
      content: "Any form of false advertising, misleading information, or misrepresentation of services is strictly prohibited and may result in legal action and permanent termination."
    },
    {
      id: 6,
      title: "Service Quality & Non-Discrimination",
      icon: FileText,
      content: "The salon agrees to respect booked time slots, provide quality services, and treat all customers without discrimination."
    },
    {
      id: 7,
      title: "Hygiene Standards",
      icon: AlertCircle,
      content: "The salon commits to maintaining excellent hygiene and cleanliness standards within their establishment."
    },
    {
      id: 8,
      title: "Operational Compliance",
      icon: FileText,
      content: "Failure to respect schedules, manage appointments, or maintain a clean and hygienic establishment may result in immediate termination of the salon’s subscription, without refund."
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
              Terms & Service Standards – HOME BONZENGA
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              By registering a business on the HOME BONZENGA platform,
              the seller expressly agrees to the following terms and obligations.
            </p>
          </div>
        </div>
      </section>

      {/* Terms Sections */}
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

export default TermsAndConditions;
