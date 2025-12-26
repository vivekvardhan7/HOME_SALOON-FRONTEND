import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { supabaseAuth } from '@/lib/supabaseAuth';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EmailConfirmationCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        console.log('🔍 Processing email confirmation callback...');
        
        // Supabase email confirmation typically happens via hash parameters in the URL
        // The confirmation link automatically confirms the email and may set a session
        
        // Wait a moment for Supabase to process the confirmation from URL hash
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Get the session (Supabase may have set it automatically from the confirmation link)
        const { data: sessionData, error: sessionError2 } = await supabase.auth.getSession();
        
        console.log('🔍 Session check result:', { 
          hasSession: !!sessionData?.session, 
          hasUser: !!sessionData?.session?.user,
          emailConfirmed: !!sessionData?.session?.user?.email_confirmed_at,
          error: sessionError2?.message 
        });

        // If we have a session with confirmed email, the confirmation was successful
        if (sessionData?.session && sessionData.session.user && sessionData.session.user.email_confirmed_at) {
          console.log('✅ Email confirmed and session established');
          
          // Ensure user profile exists in public.users
          const userId = sessionData.session.user.id;
          console.log('🔍 Ensuring user profile exists for:', userId);
          
          // Try to get user profile
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('❌ Error fetching user profile:', profileError);
          }

          // If profile doesn't exist, create it
          if (!userProfile) {
            console.log('🔍 Creating user profile...');
            const user = sessionData.session.user;
            const metadata = user.user_metadata || {};
            
            const { error: createError } = await supabase
              .from('users')
              .upsert({
                id: user.id,
                email: user.email,
                first_name: metadata.first_name || 'User',
                last_name: metadata.last_name || '',
                role: (metadata.role || 'CUSTOMER').toUpperCase(),
                status: 'ACTIVE',
                password: '' // Password is handled by Supabase Auth
              }, {
                onConflict: 'id'
              });

            if (createError) {
              console.error('❌ Error creating user profile:', createError);
              // Continue anyway - trigger might create it
            } else {
              console.log('✅ User profile created');
            }
          } else {
            console.log('✅ User profile already exists');
          }

          // If vendor, ensure vendor record exists
          if (userProfile?.role === 'VENDOR' || sessionData.session.user.user_metadata?.role === 'VENDOR') {
            const { data: vendorData } = await supabase
              .from('vendor')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();

            if (!vendorData) {
              console.log('🔍 Creating vendor record...');
              const { error: vendorError } = await supabase
                .from('vendor')
                .insert({
                  user_id: userId,
                  shopname: `${userProfile?.first_name || 'User'} ${userProfile?.last_name || ''}'s Shop`,
                  description: 'Please update your shop description',
                  address: '123 Main Street',
                  city: 'City',
                  state: 'State',
                  zipcode: '00000',
                  latitude: 0,
                  longitude: 0,
                  status: 'PENDING'
                });

              if (vendorError) {
                console.error('❌ Error creating vendor record:', vendorError);
              } else {
                console.log('✅ Vendor record created');
              }
            }
          }

          setStatus('success');
          setMessage('Email confirmed successfully! Redirecting to your dashboard...');
          toast.success('Email confirmed! Welcome!');
          
          // Redirect to appropriate dashboard
          const userRole = userProfile?.role || sessionData.session.user.user_metadata?.role || 'CUSTOMER';
          let dashboardPath = '/customer';
          switch (userRole.toUpperCase()) {
            case 'ADMIN':
              dashboardPath = '/admin';
              break;
            case 'MANAGER':
              dashboardPath = '/manager';
              break;
            case 'VENDOR':
              dashboardPath = '/vendor';
              break;
            default:
              dashboardPath = '/customer';
          }
          
          setTimeout(() => {
            window.location.href = dashboardPath; // Full reload to refresh auth state
          }, 2000);
        } else {
          // No active session - email was confirmed but user needs to sign in
          console.log('✅ Email confirmed but no active session - user should sign in');
          setStatus('success');
          setMessage('Email confirmed successfully! You can now sign in with your email and password.');
          toast.success('Email confirmed! You can now sign in.');
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        }
      } catch (err: any) {
        console.error('❌ Email confirmation error:', err);
        setStatus('error');
        setError(err.message || 'Failed to confirm email. Please try again.');
        setMessage('Failed to confirm email');
        toast.error(err.message || 'Failed to confirm email');
      }
    };

    handleEmailConfirmation();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] via-[#fffaf5] to-[#ffffff] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-[#4e342e] mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-2">
              Verifying Email
            </h2>
            <p className="text-[#6d4c41]">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-2">
              Email Confirmed!
            </h2>
            <p className="text-[#6d4c41] mb-6">{message}</p>
            <Button
              onClick={() => navigate('/login', { replace: true })}
              className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
            >
              Go to Login
            </Button>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-2">
              Confirmation Failed
            </h2>
            <p className="text-[#6d4c41] mb-2">{error}</p>
            <p className="text-sm text-[#6d4c41] mb-6">
              Your email may already be confirmed. Try signing in.
            </p>
            <Button
              onClick={() => navigate('/login', { replace: true })}
              className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
            >
              Go to Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailConfirmationCallback;

