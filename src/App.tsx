import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { client } from './api/client';
import { useAuthStore } from './store/authStore';
import HomePage from './pages/HomePage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import ExperiencesPage from './pages/ExperiencesPage';
import RetreatsPage from './pages/RetreatsPage';
import TripPlannerPage from './pages/TripPlannerPage';
import GuidePage from './pages/GuidePage';
import PlanPage from './pages/PlanPage';
import OrderPage from './pages/OrderPage';
import AuthPage from './pages/AuthPage';

import AdminPage from './pages/AdminPage';
import Layout from './layouts/Layout';

export default function App() {
  const { setUser, setChecking, setAdminStatus } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    if (useAuthStore.getState().user) {
      // User already in state, just check admin status
      try {
        const res = await client.api.fetch('/api/admin/check');
        const adminData = await res.json();
        setAdminStatus(adminData.isAdmin, adminData.role);
      } catch (err) {
        setAdminStatus(false, null);
      }
      setChecking(false);
      return;
    }
    try {
      const session = await client.auth.getSession();
      if (session.data?.user) {
        setUser({
          id: session.data.user.id,
          email: session.data.user.email,
          name: session.data.user.name || '',
        });
        // Check admin status
        try {
          const res = await client.api.fetch('/api/admin/check');
          const adminData = await res.json();
          setAdminStatus(adminData.isAdmin, adminData.role);
        } catch (err) {
          setAdminStatus(false, null);
        }
      }
    } finally {
      setChecking(false);
    }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/experiences" element={<ExperiencesPage />} />
          <Route path="/retreats" element={<RetreatsPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/invest" element={<Navigate to="/plan" replace />} />
          <Route path="/trip-planner" element={<TripPlannerPage />} />
          <Route path="/order/:token" element={<OrderPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
