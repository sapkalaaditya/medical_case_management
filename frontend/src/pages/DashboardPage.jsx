import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  FolderKanban,
  Clock,
  Eye,
  CheckCircle2,
  CalendarCheck,
  PlusCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(false);
        const res = await api.get('/dashboard/stats');
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const canCreate = user && ['admin', 'engineer'].includes(user.role);

  return (
    <div>
      {/* Header section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', marginBottom: '0.25rem' }}>
            Clinical Operations Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            Welcome back, <strong>{user?.name}</strong>. Here is the real-time surgical lifecycle summary.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => navigate('/cases/new')}
            className="btn btn-primary"
            id="dashboard-new-case-btn"
          >
            <PlusCircle size={18} />
            <span>Create New Case</span>
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Lifecycle Stat Cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', borderColor: 'rgba(14,165,233,0.3)', borderTopColor: '#0ea5e9' }}></div>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem'
          }}>
            {/* Total Cases */}
            <div
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/cases')}
              id="stat-total-cases"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                  Total Cases
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--primary)' }}>
                  <FolderKanban size={20} />
                </div>
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>
                {stats?.total ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>View all active records</span>
                <ArrowRight size={12} />
              </div>
            </div>

            {/* Planning */}
            <div
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/cases?status=Planning')}
              id="stat-planning"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                  Planning
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>
                  <Clock size={20} />
                </div>
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#38bdf8' }}>
                {stats?.planning ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                Pre-op preparation
              </div>
            </div>

            {/* In Review */}
            <div
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/cases?status=In Review')}
              id="stat-in-review"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                  In Review
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                  <Eye size={20} />
                </div>
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#fbbf24' }}>
                {stats?.inReview ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                Surgeon / biomech review
              </div>
            </div>

            {/* Approved */}
            <div
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/cases?status=Approved')}
              id="stat-approved"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                  Approved
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#34d399' }}>
                {stats?.approved ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                Ready for surgical procedure
              </div>
            </div>

            {/* Completed */}
            <div
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/cases?status=Completed')}
              id="stat-completed"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                  Completed
                </span>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  <CalendarCheck size={20} />
                </div>
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#818cf8' }}>
                {stats?.completed ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                Procedure accomplished
              </div>
            </div>
          </div>

          {/* Quick Actions & Navigation Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            <div className="card">
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>
                Clinical Case Directory
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Search, filter, and inspect patient reference IDs, implant specifications, and surgeon schedules.
              </p>
              <button onClick={() => navigate('/cases')} className="btn btn-secondary">
                <span>Browse All Cases</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>
                Role Permissions & Safety
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Logged in as <strong style={{ color: 'var(--text-main)' }}>{user?.role}</strong>. Server-side policy gates enforce read and write permissions on every API request.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`user-role-badge role-${user?.role}`}>
                  {user?.role} Mode Active
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
