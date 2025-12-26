import React from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, Mail, Phone, User, Building, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const PendingApproval = () => {
  const { user, vendor } = useSupabaseAuth();
  const { t } = useTranslation();

  // If vendor record exists, use its status. Otherwise fallback to user status.
  // This accounts for the case where a user is REJECTED (no vendor record) or PENDING_APPROVAL.
  const vendorStatus = vendor?.status || user?.status || 'PENDING_APPROVAL';
  const isRejected = vendorStatus === 'REJECTED';
  const isPending = vendorStatus === 'PENDING' || vendorStatus === 'PENDING_APPROVAL' || vendorStatus === 'PENDING_VERIFICATION';
  const rejectionReason = vendor?.rejectionReason;

  const headerTitle = isRejected
    ? t('vendor.pending.titleRejected')
    : t('vendor.pending.titlePending');

  const headerSubtitle = isRejected
    ? t('vendor.pending.subtitleRejected')
    : t('vendor.pending.subtitlePending');

  const applicationStatusBadge = isRejected
    ? t('vendor.pending.badgeRejected')
    : t('vendor.pending.badgePending');

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] via-[#fffaf5] to-[#ffffff] p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div {...fadeIn}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-[#4e342e] mb-2">
              {headerTitle}
            </h1>
            <p className="text-lg text-[#6d4c41]">
              {headerSubtitle}
            </p>
          </div>

          {/* Status Card */}
          <Card className="border-0 shadow-xl bg-white mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-[#4e342e]" />
                  <span>{t('vendor.pending.applicationStatus')}</span>
                </span>
                <Badge className={`${isRejected ? 'bg-red-500' : 'bg-yellow-500'} text-white`}>{applicationStatusBadge}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isPending && (
                  <>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 animate-pulse" />
                      <div>
                        <p className="text-[#4e342e] font-medium">{t('vendor.pending.steps.received.title')}</p>
                        <p className="text-sm text-[#6d4c41]">
                          {t('vendor.pending.steps.received.description')}
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-[#f5e6d3] to-transparent" />
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mt-2" />
                      <div>
                        <p className="text-[#4e342e] font-medium">{t('vendor.pending.steps.review.title')}</p>
                        <p className="text-sm text-[#6d4c41]">
                          {t('vendor.pending.steps.review.description')}
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-[#f5e6d3] to-transparent" />
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mt-2" />
                      <div>
                        <p className="text-[#4e342e] font-medium">{t('vendor.pending.steps.decision.title')}</p>
                        <p className="text-sm text-[#6d4c41]">
                          {t('vendor.pending.steps.decision.description')}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {isRejected && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                    <p className="text-[#b91c1c] font-semibold mb-2">{t('vendor.pending.rejectedNote')}</p>
                    {rejectionReason ? (
                      <p className="text-sm text-[#7f1d1d]">{rejectionReason}</p>
                    ) : (
                      <p className="text-sm text-[#7f1d1d]">{t('vendor.pending.rejectedDefault')}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* What Happens Next */}
          <Card className="border-0 shadow-xl bg-white mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-[#4e342e]" />
                <span>What Happens Next?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isPending ? (
                  <>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-[#4e342e]/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[#4e342e] font-semibold">1</span>
                      </div>
                      <div>
                        <p className="text-[#4e342e] font-medium mb-1">{t('vendor.pending.nextSteps.email.title')}</p>
                        <p className="text-sm text-[#6d4c41]">
                          {t('vendor.pending.nextSteps.email.description', { email: user?.email })}
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-[#f5e6d3] to-transparent" />
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-[#4e342e]/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[#4e342e] font-semibold">2</span>
                      </div>
                      <div>
                        <p className="text-[#4e342e] font-medium mb-1">{t('vendor.pending.nextSteps.access.title')}</p>
                        <p className="text-sm text-[#6d4c41]">
                          {t('vendor.pending.nextSteps.access.description')}
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-[#f5e6d3] to-transparent" />
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-[#4e342e]/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[#4e342e] font-semibold">3</span>
                      </div>
                      <div>
                        <p className="text-[#4e342e] font-medium mb-1">{t('vendor.pending.nextSteps.prepare.title')}</p>
                        <p className="text-sm text-[#6d4c41]">
                          {t('vendor.pending.nextSteps.prepare.description')}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-[#6d4c41] text-sm">
                    {t('vendor.pending.reapplyHint')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-[#4e342e]" />
                <span>Application Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-[#6d4c41] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#6d4c41]">Owner Name</p>
                      <p className="text-[#4e342e] font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-[#6d4c41] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#6d4c41]">Email Address</p>
                      <p className="text-[#4e342e] font-medium">{user?.email}</p>
                    </div>
                  </div>
                  {user?.phone && (
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-[#6d4c41] mt-0.5" />
                      <div>
                        <p className="text-sm text-[#6d4c41]">Phone Number</p>
                        <p className="text-[#4e342e] font-medium">{user.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Building className="w-5 h-5 text-[#6d4c41] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#6d4c41]">Shop Name</p>
                      <p className="text-[#4e342e] font-medium">{vendor?.shopName || 'N/A'}</p>
                    </div>
                  </div>
                  {vendor?.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-[#6d4c41] mt-0.5" />
                      <div>
                        <p className="text-sm text-[#6d4c41]">Business Address</p>
                        <p className="text-[#4e342e] font-medium">
                          {vendor.address}, {vendor.city}, {vendor.state} {vendor.zipCode}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start space-x-3">
                    <Badge className={`${isRejected ? 'bg-red-500' : 'bg-yellow-500'} text-white`}>{applicationStatusBadge}</Badge>
                  </div>
                </div>
              </div>
              {isRejected && rejectionReason && (
                <div className="mt-6 border border-red-200 bg-red-50 rounded-lg p-4 text-left">
                  <p className="text-sm text-red-700 font-semibold mb-2">{t('vendor.auth.rejectionReasonLabel')}</p>
                  <p className="text-sm text-red-600 whitespace-pre-wrap">{rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Section */}
          <div className="mt-8 text-center">
            <p className="text-[#6d4c41] mb-4">
              {t('vendor.pending.supportPrompt')}
            </p>
            <p className="text-[#4e342e] font-medium">
              support@homebonzenga.com
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PendingApproval;



