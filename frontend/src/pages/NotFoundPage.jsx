import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      maxWidth: '560px',
      margin: '6rem auto',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div className="card" style={{ padding: '3rem 2rem' }}>
        <div style={{
          display: 'inline-flex',
          padding: '1rem',
          borderRadius: '16px',
          background: 'rgba(244, 63, 94, 0.12)',
          color: '#f43f5e',
          marginBottom: '1.5rem'
        }}>
          <FileQuestion size={48} />
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>404 — Page Not Found</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '2rem', lineHeight: '1.6' }}>
          The clinical route or medical record you requested does not exist or may have been relocated.
        </p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
