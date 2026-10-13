import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CaseListPage } from './pages/CaseListPage';
import { CreateCasePage } from './pages/CreateCasePage';
import { EditCasePage } from './pages/EditCasePage';
import { CaseDetailsPage } from './pages/CaseDetailsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Login route guard: if user is already authenticated, redirect to /
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public route */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />

              {/* Protected clinical routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/cases"
                element={
                  <ProtectedRoute>
                    <CaseListPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/cases/new"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'engineer']}>
                    <CreateCasePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/cases/:id"
                element={
                  <ProtectedRoute>
                    <CaseDetailsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/cases/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'engineer']}>
                    <EditCasePage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback 404 route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
