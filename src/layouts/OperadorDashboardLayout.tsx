import { useState } from 'react';

import { OperadorSidebar } from '../components/OperadorSidebar';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';
import { useLoadingStore } from '../stores/useLoadingStore';
import { OperadorHeader } from '../components/OperadorHeader';

export const OperadorDashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const { setGlobalLoading } = useLoadingStore();

  useEffect(() => {
    setGlobalLoading(true);
    const timer = setTimeout(() => {
      setGlobalLoading(false);
    }, 400);
    
    return () => clearTimeout(timer);
  }, [location.pathname, setGlobalLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background text-text">
      <OperadorSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <OperadorHeader onMenuOpen={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
