import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { CaseForm } from '../components/CaseForm';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export const EditCasePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const res = await api.get(`/cases/${id}`);
        if (res.data?.success) {
          setCaseData(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load case details for editing');
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [id]);

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
          <span>{error || 'Case not found'}</span>
        </div>
        <button onClick={() => navigate('/cases')} className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Return to Directory</span>
        </button>
      </div>
    );
  }

  return <CaseForm isEdit={true} initialData={caseData} caseId={id} />;
};
