import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

const STATUS_LIST = ['Draft', 'Planning', 'In Review', 'Approved', 'Completed', 'Cancelled'];
const PRIORITY_LIST = ['Low', 'Medium', 'High'];

export const CaseForm = ({ initialData = null, isEdit = false, caseId = null }) => {
  const navigate = useNavigate();

  // Form Fields State
  const [formData, setFormData] = useState({
    caseNumber: '',
    patientReference: '',
    surgeonName: '',
    implantType: '',
    status: 'Draft',
    priority: 'Medium',
    surgeryDate: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bonus: Public holiday lookup state
  const [holidayInfo, setHolidayInfo] = useState(null);
  const [loadingHoliday, setLoadingHoliday] = useState(false);

  // Populate form if initialData is provided
  useEffect(() => {
    if (initialData) {
      setFormData({
        caseNumber: initialData.caseNumber || '',
        patientReference: initialData.patientReference || '',
        surgeonName: initialData.surgeonName || '',
        implantType: initialData.implantType || '',
        status: initialData.status || 'Draft',
        priority: initialData.priority || 'Medium',
        surgeryDate: initialData.surgeryDate ? initialData.surgeryDate.split('T')[0] : ''
      });
    }
  }, [initialData]);

  // Lookup public holiday when surgeryDate changes (Bonus Task)
  useEffect(() => {
    const checkHoliday = async () => {
      if (!formData.surgeryDate) {
        setHolidayInfo(null);
        return;
      }

      setLoadingHoliday(true);
      try {
        const res = await api.get(`/holidays?date=${formData.surgeryDate}&country=IN`);
        if (res.data?.success && res.data?.data) {
          setHolidayInfo(res.data.data);
        } else {
          setHolidayInfo(null);
        }
      } catch (err) {
        // Fail gracefully
        setHolidayInfo(null);
      } finally {
        setLoadingHoliday(false);
      }
    };

    const timer = setTimeout(checkHoliday, 400);
    return () => clearTimeout(timer);
  }, [formData.surgeryDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-level error as user edits
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setGeneralError('');
    setSuccessMsg('');

    try {
      const payload = { ...formData };
      if (!payload.surgeryDate) {
        payload.surgeryDate = null;
      }

      let res;
      if (isEdit) {
        res = await api.put(`/cases/${caseId}`, payload);
      } else {
        res = await api.post('/cases', payload);
      }

      if (res.data?.success) {
        setSuccessMsg(isEdit ? 'Case updated successfully!' : 'Case created successfully!');
        setTimeout(() => {
          navigate(`/cases/${res.data.data._id}`);
        }, 1200);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        // 422 field-level validation errors
        setFieldErrors(data.errors);
      } else {
        setGeneralError(data?.message || 'An error occurred while saving the case.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={14} />
        <span>Back</span>
      </button>

      <div className="card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          {isEdit ? `Edit Case: ${formData.caseNumber || 'Medical Case'}` : 'Create New Medical Case'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
          {isEdit
            ? 'Update surgical scheduling, clinical status, or implant specifications.'
            : 'Enter patient reference code, surgeon details, and initial planning parameters.'}
        </p>

        {/* General Error Alert */}
        {generalError && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={18} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="alert alert-success" role="alert">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Case Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="caseNumber">
                <span>Case Number <span className="required">*</span></span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Format: CASE-0001</span>
              </label>
              <input
                id="caseNumber"
                name="caseNumber"
                type="text"
                placeholder="e.g. CASE-1024"
                className={`form-input ${fieldErrors.caseNumber ? 'has-error' : ''}`}
                value={formData.caseNumber}
                onChange={handleChange}
                required
              />
              {fieldErrors.caseNumber && (
                <div className="field-error-msg">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.caseNumber[0]}</span>
                </div>
              )}
            </div>

            {/* Patient Reference */}
            <div className="form-group">
              <label className="form-label" htmlFor="patientReference">
                <span>Patient Reference Code <span className="required">*</span></span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Dummy code only (e.g. PT-1042)</span>
              </label>
              <input
                id="patientReference"
                name="patientReference"
                type="text"
                placeholder="e.g. PT-8921"
                className={`form-input ${fieldErrors.patientReference ? 'has-error' : ''}`}
                value={formData.patientReference}
                onChange={handleChange}
                required
              />
              {fieldErrors.patientReference && (
                <div className="field-error-msg">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.patientReference[0]}</span>
                </div>
              )}
            </div>

            {/* Surgeon Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="surgeonName">
                <span>Surgeon Name <span className="required">*</span></span>
              </label>
              <input
                id="surgeonName"
                name="surgeonName"
                type="text"
                placeholder="e.g. Dr. Meredith Grey"
                className={`form-input ${fieldErrors.surgeonName ? 'has-error' : ''}`}
                value={formData.surgeonName}
                onChange={handleChange}
                required
              />
              {fieldErrors.surgeonName && (
                <div className="field-error-msg">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.surgeonName[0]}</span>
                </div>
              )}
            </div>

            {/* Implant Type */}
            <div className="form-group">
              <label className="form-label" htmlFor="implantType">
                <span>Implant Type / Model <span className="required">*</span></span>
              </label>
              <input
                id="implantType"
                name="implantType"
                type="text"
                placeholder="e.g. Titanium Hip Stem 12mm"
                className={`form-input ${fieldErrors.implantType ? 'has-error' : ''}`}
                value={formData.implantType}
                onChange={handleChange}
                required
              />
              {fieldErrors.implantType && (
                <div className="field-error-msg">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.implantType[0]}</span>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label" htmlFor="status">
                <span>Clinical Status <span className="required">*</span></span>
              </label>
              <select
                id="status"
                name="status"
                className={`form-select ${fieldErrors.status ? 'has-error' : ''}`}
                value={formData.status}
                onChange={handleChange}
                required
              >
                {STATUS_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {fieldErrors.status && (
                <div className="field-error-msg">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.status[0]}</span>
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="form-group">
              <label className="form-label" htmlFor="priority">
                <span>Priority Level <span className="required">*</span></span>
              </label>
              <select
                id="priority"
                name="priority"
                className={`form-select ${fieldErrors.priority ? 'has-error' : ''}`}
                value={formData.priority}
                onChange={handleChange}
                required
              >
                {PRIORITY_LIST.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {fieldErrors.priority && (
                <div className="field-error-msg">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.priority[0]}</span>
                </div>
              )}
            </div>
          </div>

          {/* Surgery Date & Holiday Check */}
          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label className="form-label" htmlFor="surgeryDate">
              <span>Scheduled Surgery Date</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Optional</span>
            </label>
            <input
              id="surgeryDate"
              name="surgeryDate"
              type="date"
              className={`form-input ${fieldErrors.surgeryDate ? 'has-error' : ''}`}
              value={formData.surgeryDate}
              onChange={handleChange}
            />
            {fieldErrors.surgeryDate && (
              <div className="field-error-msg">
                <AlertCircle size={12} />
                <span>{fieldErrors.surgeryDate[0]}</span>
              </div>
            )}

            {/* Bonus: Public Holiday Indicator */}
            {loadingHoliday && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div className="spinner" style={{ width: '0.8rem', height: '0.8rem' }}></div>
                <span>Checking public holiday calendar...</span>
              </div>
            )}

            {holidayInfo && holidayInfo.isHoliday && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.625rem 0.875rem',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Sparkles size={16} />
                <span>
                  <strong>Notice:</strong> This date is a recognized public holiday in India: <strong>{holidayInfo.holidayName}</strong>. Operating rooms may have holiday schedules.
                </span>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              id="submit-case-btn"
            >
              {submitting ? (
                <>
                  <div className="spinner"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{isEdit ? 'Save Changes' : 'Create Medical Case'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
