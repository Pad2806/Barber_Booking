import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './providers/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';

// Import pages
import HomePage from './pages/index/index';
import SalonListPage from './pages/salons';
import SalonDetailPage from './pages/salon-detail';
import BookingPage from './pages/booking';
import BookingConfirmPage from './pages/booking-confirm';
import BookingDetailPage from './pages/booking-detail';
import PaymentPage from './pages/payment';
import MyBookingsPage from './pages/my-bookings';
import ProfilePage from './pages/profile';
import LoginPage from './pages/login';
import Layout from './pages/layout';

import RequireAuth from './components/auth/RequireAuth';
import AuthEventListener from './components/auth/AuthEventListener';

const MyApp: React.FC = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <HashRouter>
          <AuthEventListener />
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/salons" element={<SalonListPage />} />
              <Route path="/salon-detail" element={<SalonDetailPage />} />
              <Route
                path="/booking"
                element={
                  <RequireAuth>
                    <BookingPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/booking-confirm"
                element={
                  <RequireAuth>
                    <BookingConfirmPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/booking-detail"
                element={
                  <RequireAuth>
                    <BookingDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/payment"
                element={
                  <RequireAuth>
                    <PaymentPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <RequireAuth>
                    <MyBookingsPage />
                  </RequireAuth>
                }
              />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </Layout>
        </HashRouter>
      </AuthProvider>
    </QueryProvider>
  );
};

export default MyApp;
