import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const VerifyPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const handleVerification = async () => {
            const accessToken = searchParams.get('access_token');
            const refreshToken = searchParams.get('refresh_token');

            try {
                let session = null;
                if (accessToken && refreshToken) {
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });
                    if (error) throw error;
                    session = data.session;
                } else {
                    const { data: { session: existingSession } } = await supabase.auth.getSession();
                    session = existingSession;
                }

                if (session && session.user) {
                    const user = session.user;
                    const role = user.user_metadata?.role || 'CUSTOMER';

                    console.log(`Verifying user ${user.id} with role ${role}`);

                    // 1. Update users table status
                    // Vendors go to PENDING_APPROVAL, others to ACTIVE
                    const newStatus = role === 'VENDOR' ? 'PENDING_APPROVAL' : 'ACTIVE';

                    const { error: userUpdateError } = await supabase
                        .from('users')
                        .update({
                            status: newStatus,
                            email_verified: true,
                            verified_at: new Date().toISOString()
                        })
                        .eq('id', user.id);

                    if (userUpdateError) {
                        console.error('Error updating users status:', userUpdateError);
                    }

                    // Note: Vendor record is NOT created here. It is created by Manager Approval.

                    setStatus('success');
                    setMessage(role === 'VENDOR'
                        ? 'Email verified! Your application is now pending admin approval.'
                        : 'Email verified! You can now log in.');

                    setTimeout(() => {
                        navigate(role === 'VENDOR' ? '/vendor/pending-approval' : '/login');
                    }, 4000);
                } else {
                    setStatus('error');
                    setMessage('Invalid or expired verification link.');
                }
            } catch (err: any) {
                console.error('Verification error:', err);
                setStatus('error');
                setMessage(err.message || 'An error occurred during verification.');
            }
        };

        handleVerification();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-[#fdf6f0] flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#fdf6f0] to-[#f8e8e0] p-8">
                    <CardTitle className="text-2xl font-serif font-bold text-[#4e342e] text-center">
                        Email Verification
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center space-y-6">
                    {status === 'verifying' && (
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-[#6d4c41]" />
                            <p className="text-lg text-[#6d4c41] font-medium">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center space-y-4">
                            <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-300" />
                            <p className="text-xl font-semibold text-[#4e342e]">{message}</p>
                            <p className="text-[#6d4c41]">Redirecting you to login...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center space-y-4">
                            <XCircle className="w-16 h-16 text-red-500 animate-in zoom-in duration-300" />
                            <p className="text-xl font-semibold text-[#4e342e]">{message}</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="mt-4 bg-[#4e342e] text-white px-6 py-2 rounded-lg hover:bg-[#3b2c26] transition-colors"
                            >
                                Go to Login
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default VerifyPage;
