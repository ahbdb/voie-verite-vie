import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import AdminLoadingSpinner from './AdminLoadingSpinner';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminPageWrapperProps {
  children: ReactNode;
  title?: string;
  requiresPrincipal?: boolean;
}

export const AdminPageWrapper: React.FC<AdminPageWrapperProps> = ({ 
  children, 
  title,
  requiresPrincipal = false 
}) => {
  const navigate = useNavigate();
  const { user, isAdmin, adminRole, loading } = useAdmin();

  if (loading) {
    return <AdminLoadingSpinner />;
  }

  // If user is not admin at all, redirect
  if (!user || !isAdmin) {
    console.log('⛔ [AdminPageWrapper] User not admin, redirecting');
    navigate('/');
    return null;
  }

  // If page requires principal role but user doesn't have it
  if (requiresPrincipal && adminRole !== 'admin_principal') {
    return (
      <div className="min-h-screen flex flex-col bg-background items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-destructive/50 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <h1 className="text-lg font-bold">Accès refusé</h1>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Cette page est réservée à l'Admin Principal
          </p>
          
          <Button onClick={() => navigate('/admin')} className="w-full">
            Retour à l'administration
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminPageWrapper;
