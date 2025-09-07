import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import WorshiperManagement from './components/Worshipers/WorshiperManagement';
import SeatsManagement from './components/Seats/SeatsManagement';
import Contact from './components/Contact/Contact';
import MapManagementGuide from './components/Seats/MapManagementGuide';
import Login from './components/Auth/Login';
import RequireAuth from './components/Auth/RequireAuth';
import ProfileSetup from './components/Auth/ProfileSetup';
import MapView from './components/Seats/MapView';
import StickerPrint from './components/Seats/StickerPrint';
import Pricing from './components/Pricing/Pricing';
import ProPayment from './components/Pricing/ProPayment';
import PaymentThankYou from './components/Pricing/PaymentThankYou';
import PaymentCancelled from './components/Pricing/PaymentCancelled';
import Home from './components/Home/Home';
import UserManagement from './components/Admin/UserManagement';
import DefaultMapView from './components/Admin/DefaultMapView';
import RequireManager from './components/Auth/RequireManager';
import CouponPopup from './components/common/CouponPopup';

function App() {
  return (
    <AuthProvider>
      <CouponPopup />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/pro-payment" element={<ProPayment />} />
          <Route path="/thank-you" element={<PaymentThankYou />} />
          <Route path="/payment-cancelled" element={<PaymentCancelled />} />
          <Route path="/setup" element={<RequireAuth><ProfileSetup /></RequireAuth>} />
          <Route
            path="/view/:id/labels"
            element={
              <AppProvider>
                <StickerPrint />
              </AppProvider>
            }
          />
          <Route
            path="/view/:id"
            element={
              <AppProvider>
                <MapView />
              </AppProvider>
            }
          />
          <Route
            path="/view"
            element={
              <AppProvider>
                <MapView />
              </AppProvider>
            }
          />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppProvider>
                  <Layout />
                </AppProvider>
              </RequireAuth>
            }
          >
            <Route index element={<WorshiperManagement />} />
            <Route path="seats-manage" element={<SeatsManagement />} />
            <Route path="map-guide" element={<MapManagementGuide />} />
            <Route path="admin-users" element={<RequireManager><UserManagement /></RequireManager>} />
            <Route path="default-map" element={<RequireManager><DefaultMapView /></RequireManager>} />
            <Route path="contact" element={<Contact />} />
            <Route path="pricing" element={<Pricing />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
