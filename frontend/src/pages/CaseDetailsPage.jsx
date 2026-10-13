import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  User,
  Clock,
  Tag,
  Shield,
  Activity,
  AlertTriangle
} from 'lucide-react';

export const CaseDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const res = await api.get(`/cases/${id}`);
        if (res.data?.success) {
          setCaseData(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load case details');
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/cases/${id}`);
      navigate('/cases');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete case');
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = user && ['admin', 'engineer'].includes(user.role);
  const canDelete = user && user.role === 'admin';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
        <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', borderColor: 'rgba(14,165,233,0.3)', borderTopColor: '#0ea5e9' }}></div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={20} />
          <span>{error || 'Case record not found'}</span>
        </div>
        <button onClick={() => navigate('/cases')} className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Return to Directory</span>
        </button>
      </div>
    );
  }

  const statusBadgeClass = `badge badge-${caseData.status.toLowerCase().replace(/\s+/g, '-')}`;
  const priorityClass = `priority-${caseData.priority.toLowerCase()}`;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Top action row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => navigate('/cases')}
          className="btn btn-secondary btn-sm"
        >
          <ArrowLeft size={14} />
          <span>Back to Case Directory</span>
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {canEdit && (
            <button
              onClick={() => navigate(`/cases/${id}/edit`)}
              className="btn btn-secondary btn-sm"
              id="details-edit-btn"
            >
              <Edit size={14} />
              <span>Edit Case</span>
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-danger btn-sm"
              id="details-delete-btn"
            >
              <Trash2 size={14} />
              <span>Delete Case</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Case Summary Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Clinical Reference
            </div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'monospace', color: 'var(--primary)', marginBottom: '0.25rem' }}>
              {caseData.caseNumber}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              Patient Reference Identifier: <strong>{caseData.patientReference}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <span className={statusBadgeClass} style={{ fontSize: '0.875rem', padding: '0.35rem 0.85rem' }}>
              {caseData.status}
            </span>
            <span className={priorityClass} style={{ fontSize: '0.8125rem' }}>
              {caseData.priority} Priority
            </span>
          </div>
        </div>

        {/* Clinical Parameters Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Surgeon in Charge
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>
              {caseData.surgeonName}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Implant Specification
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>
              {caseData.implantType}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Scheduled Surgery Date
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} style={{ color: 'var(--primary)' }} />
              <span>
                {caseData.surgeryDate
                  ? new Date(caseData.surgeryDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Not scheduled yet'}
              </span>
            </div>
          </div>
        </div>

        {/* Audit & Traceability Metadata Section */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={16} style={{ color: 'var(--primary)' }} />
            <span>Audit & System Traceability Record</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Created By:</span>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {caseData.createdBy?.name || 'System'}
                {caseData.createdBy?.email && (
                  <span style={{ color: 'var(--text-dim)', fontWeight: '400', display: 'block', fontSize: '0.75rem' }}>
                    ({caseData.createdBy.email})
                  </span>
                )}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-dim)' }}>Created At:</span>
              <div style={{ fontWeight: '500', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {new Date(caseData.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-dim)' }}>Last Updated:</span>
              <div style={{ fontWeight: '500', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {new Date(caseData.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ color: '#f43f5e', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 size={20} />
              Confirm Case Deletion
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Are you sure you want to permanently delete case <strong>{caseData.caseNumber}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
