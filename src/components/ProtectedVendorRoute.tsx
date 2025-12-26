import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import PendingApproval from '@/pages/vendor/PendingApproval';

interface ProtectedVendorRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route for vendor pages that checks if vendor is approved
 * Redirects to pending approval page if vendor status is not 'APPROVED'
 */
const ProtectedVendorRoute: React.FC<ProtectedVendorRouteProps> = ({ children }) => {
  const { user, vendor, refreshVendorData } = useSupabaseAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [vendorStatus, setVendorStatus] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrateVendor = async () => {
      if (user?.role === 'VENDOR' && user?.id) {
        await refreshVendorData();
      } else if (isMounted) {
        setVendorStatus(null);
      }

      if (isMounted) {
        setIsChecking(false);
      }
    };

    hydrateVendor();

    if (user?.role === 'VENDOR') {
      const interval = setInterval(() => {
        refreshVendorData();
      }, 5000);

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.role, refreshVendorData]);

  useEffect(() => {
    if (vendor?.status) {
      setVendorStatus(vendor.status);
    }
  }, [vendor?.status]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4e342e]"></div>
      </div>
    );
  }

  if (user?.role !== 'VENDOR') {
    return <>{children}</>;
  }

  if (vendorStatus === 'APPROVED') {
    return <>{children}</>;
  }

  if (vendorStatus === 'PENDING' || vendorStatus === 'PENDING_APPROVAL' || vendorStatus === 'EMAIL_VERIFIED') {
    if (location.pathname === '/vendor/pending-approval') {
      return <>{children}</>;
    }
    return <Navigate to="/vendor/pending-approval" replace />;
  }

  return <PendingApproval />;
};

export default ProtectedVendorRoute;


