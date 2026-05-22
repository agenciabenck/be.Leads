import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import LandingPage from './pages/LandingPage';
import RegisterSession from './pages/RegisterSession';
import UpdatePassword from './pages/UpdatePassword';

import { AffiliateTracker } from './components/AffiliateTracker';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false, // Prevents excessive refetching on CRM
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1
        }
    }
});

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <Toaster position="top-right" richColors duration={4000} closeButton />
                <AffiliateTracker />
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/app/*" element={<Dashboard />} />
                    <Route path="/login" element={<Dashboard />} />
                    <Route path="/register" element={<RegisterSession />} />
                    <Route path="/update-password" element={<UpdatePassword />} />
                    {/* Catch all - redirect to Landing Page */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </QueryClientProvider>
    );
}