import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import LandingPage from './pages/LandingPage';

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/app/*" element={<Dashboard />} />
                <Route path="/login" element={<Dashboard />} />
                {/* Catch all - redirect to Landing Page */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}