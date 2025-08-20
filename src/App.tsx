import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import WorshiperManagement from './components/Worshipers/WorshiperManagement';
import SeatsView from './components/Seats/SeatsView';
import SeatsManagement from './components/Seats/SeatsManagement';
import Contact from './components/Contact/Contact';
import About from './components/About/About';
import Login from './components/Auth/Login';
import RequireAuth from './components/Auth/RequireAuth';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppProvider>
                  <Layout />
                </AppProvider>
              </RequireAuth>
            }
          >
            <Route index element={<WorshiperManagement />} />
            <Route path="seats-view" element={<SeatsView />} />
            <Route path="seats-manage" element={<SeatsManagement />} />
            <Route path="contact" element={<Contact />} />
            <Route path="about" element={<About />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
