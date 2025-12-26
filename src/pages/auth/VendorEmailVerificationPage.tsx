import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Hourglass, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '@/config/env';

const VendorEmailVerificationPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>('');
  const [status, setStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setIsError(true);
      setMessage(t('auth.verifyEmail.missingToken'));
      setLoading(false);
      return;
    }

    const navigate = useNavigate();
    
    const verifyEmail = async () => {
      try {
        setLoading(true);
        // Use generic auth verification endpoint (POST) that works for both customers and vendors
        const response = await fetch(getApiUrl('/auth/verify-email'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          setIsError(false);
          setStatus('VERIFIED');
          setMessage(t('auth.verifyEmail.success') || 'Email verified successfully! Redirecting to login...');
          
          // Auto-redirect to login after 2 seconds
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setIsError(true);
          // Check if already verified (backend might return 400 with message)
          if (data.message === 'Email already verified' || data.message?.includes('verified')) {
             setIsError(false);
             setMessage('Email already verified. Redirecting to login...');
             setTimeout(() => {
               navigate('/login');
             }, 2000);
          } else {
             setStatus(null);
             setReason(null);
             setMessage(data.message || t('auth.verifyEmail.error'));
          }
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setIsError(true);
        setMessage(t('auth.verifyEmail.error'));
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, t]);

  const renderStatusIcon = () => {
    if (loading) {
      return <Loader2 className="h-10 w-10 animate-spin text-primary" />;
    }

    if (isError) {
      return <AlertTriangle className="h-10 w-10 text-red-500" />;
    }

    if (status === 'PENDING_APPROVAL') {
      return <Hourglass className="h-10 w-10 text-amber-500" />;
    }

    return <CheckCircle2 className="h-10 w-10 text-green-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] via-[#fffaf5] to-[#ffffff] flex items-center justify-center px-4 py-16">
      <Card className="max-w-xl w-full border-0 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center">{renderStatusIcon()}</div>
          <CardTitle className="text-3xl font-serif text-[#4e342e]">
            {loading
              ? t('auth.verifyEmail.verifying')
              : isError
                ? t('auth.verifyEmail.titleError')
                : status === 'PENDING_APPROVAL'
                  ? t('auth.verifyEmail.titlePending')
                  : t('auth.verifyEmail.titleSuccess')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          {loading ? (
            <p className="text-[#6d4c41]">{t('auth.verifyEmail.pleaseWait')}</p>
          ) : (
            <>
              <p className="text-[#6d4c41] leading-relaxed">{message}</p>
              {reason && (
                <div className="bg-red-50 border border-red-200 text-left rounded-lg p-4">
                  <p className="font-semibold text-red-700 mb-2">{t('vendor.auth.rejectionReasonLabel')}</p>
                  <p className="text-red-600 text-sm">{reason}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild className="min-w-[180px] bg-[#4e342e] hover:bg-[#3b2c26] text-white">
                  <Link to="/login">{t('auth.verifyEmail.goToLogin')}</Link>
                </Button>
                <Button asChild variant="outline" className="min-w-[180px] border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white">
                  <a href="mailto:support@homebonzenga.com">{t('auth.verifyEmail.contactSupport')}</a>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorEmailVerificationPage;
