import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import WorshiperManagement from './components/Worshipers/WorshiperManagement';
import SeatsManagement from './components/Seats/SeatsManagement';
import Contact from './components/Contact/Contact';
import About from './components/About/About';
import MapManagementGuide from './components/Seats/MapManagementGuide';
import Login from './components/Auth/Login';
import RequireAuth from './components/Auth/RequireAuth';
import ProfileSetup from './components/Auth/ProfileSetup';
import MapView from './components/Seats/MapView';
import Pricing from './components/Pricing/Pricing';
import ProPayment from './components/Pricing/ProPayment';
import Home from './components/Home/Home';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/pro-payment" element={<ProPayment />} />
          <Route path="/setup" element={<RequireAuth><ProfileSetup /></RequireAuth>} />
          <Route
            path="/view/:id"
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
            <Route path="contact" element={<Contact />} />
            <Route path="about" element={<About />} />
            <Route path="pricing" element={<Pricing />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
