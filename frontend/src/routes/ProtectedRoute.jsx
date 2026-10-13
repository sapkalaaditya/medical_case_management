import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route wrapper protecting routes from unauthenticated access
 * and restricting routes based on user role
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem', borderColor: 'rgba(14,165,233,0.3)', borderTopColor: '#0ea5e9' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization if restricted
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <h2 style={{ color: '#f43f5e', marginBottom: '1rem' }}>403 — Access Denied</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Your current account role (<strong>{user.role}</strong>) does not have permission to view or access this page.
        </p>
        <a href="/cases" className="btn btn-primary">Return to Case Directory</a>
      </div>
    );
  }

  return children;
};
