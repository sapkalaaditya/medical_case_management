import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

const STATUS_LIST = ['Draft', 'Planning', 'In Review', 'Approved', 'Completed', 'Cancelled'];
const PRIORITY_LIST = ['Low', 'Medium', 'High'];

export const CaseListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state synced with URL params
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [selectedPriority, setSelectedPriority] = useState(searchParams.get('priority') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('order') || 'desc');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page'), 10) || 1);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch cases from API
  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: 10,
        sortBy,
        order: sortOrder
      };
      if (searchInput.trim()) params.search = searchInput.trim();
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPriority) params.priority = selectedPriority;

      const res = await api.get('/cases', { params });
      if (res.data?.success) {
        setCases(res.data.data.items || []);
        setPagination(res.data.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load medical cases');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchInput, selectedStatus, selectedPriority, sortBy, sortOrder]);

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCases();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchCases]);

  // Sync state to URL searchParams
  useEffect(() => {
    const nextParams = {};
    if (currentPage > 1) nextParams.page = currentPage;
    if (searchInput.trim()) nextParams.search = searchInput.trim();
    if (selectedStatus) nextParams.status = selectedStatus;
    if (selectedPriority) nextParams.priority = selectedPriority;
    if (sortBy !== 'createdAt') nextParams.sortBy = sortBy;
    if (sortOrder !== 'desc') nextParams.order = sortOrder;
    setSearchParams(nextParams, { replace: true });
  }, [currentPage, searchInput, selectedStatus, selectedPriority, sortBy, sortOrder, setSearchParams]);

  // Handle column header sorting click
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Render sorting icon
  const renderSortIcon = (field) => {
    if (sortBy !== field) {
      return <ArrowUpDown size={12} style={{ opacity: 0.4, marginLeft: '0.25rem' }} />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp size={12} style={{ color: 'var(--primary)', marginLeft: '0.25rem' }} />
      : <ArrowDown size={12} style={{ color: 'var(--primary)', marginLeft: '0.25rem' }} />;
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/cases/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchCases();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete case');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchInput('');
    setSelectedStatus('');
    setSelectedPriority('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const canCreate = user && ['admin', 'engineer'].includes(user.role);
  const canEdit = user && ['admin', 'engineer'].includes(user.role);
  const canDelete = user && user.role === 'admin';

  return (
    <div>
      {/* Page Title & Add Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Medical Case Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage surgical cases, implant specifications, and schedule milestones.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => navigate('/cases/new')}
            className="btn btn-primary"
            id="new-case-btn"
          >
            <PlusCircle size={18} />
            <span>Create New Case</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search Case # or Surgeon..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setCurrentPage(1);
              }}
              id="case-search-input"
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              id="case-status-filter"
            >
              <option value="">All Statuses</option>
              {STATUS_LIST.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter (Bonus) */}
          <div>
            <select
              className="form-select"
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setCurrentPage(1);
              }}
              id="case-priority-filter"
            >
              <option value="">All Priorities</option>
              {PRIORITY_LIST.map((p) => (
                <option key={p} value={p}>{p} Priority</option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={resetFilters}
              className="btn btn-secondary btn-sm"
              title="Reset search and filters"
              style={{ height: '38px', width: '100%' }}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Case Table */}
      <div className="table-responsive">
        <table className="clinical-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('caseNumber')}>
                Case Number {renderSortIcon('caseNumber')}
              </th>
              <th className="sortable" onClick={() => handleSort('patientReference')}>
                Patient Ref {renderSortIcon('patientReference')}
              </th>
              <th className="sortable" onClick={() => handleSort('surgeonName')}>
                Surgeon {renderSortIcon('surgeonName')}
              </th>
              <th className="sortable" onClick={() => handleSort('implantType')}>
                Implant Type {renderSortIcon('implantType')}
              </th>
              <th className="sortable" onClick={() => handleSort('status')}>
                Status {renderSortIcon('status')}
              </th>
              <th className="sortable" onClick={() => handleSort('priority')}>
                Priority {renderSortIcon('priority')}
              </th>
              <th className="sortable" onClick={() => handleSort('surgeryDate')}>
                Surgery Date {renderSortIcon('surgeryDate')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto', width: '2rem', height: '2rem', borderColor: 'rgba(14,165,233,0.3)', borderTopColor: '#0ea5e9' }}></div>
                </td>
              </tr>
            ) : cases.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  No medical cases found matching your search and filter criteria.
                </td>
              </tr>
            ) : (
              cases.map((c) => {
                const statusBadgeClass = `badge badge-${c.status.toLowerCase().replace(/\s+/g, '-')}`;
                const priorityClass = `priority-${c.priority.toLowerCase()}`;

                return (
                  <tr key={c._id} id={`case-row-${c._id}`}>
                    <td style={{ fontWeight: '700', fontFamily: 'monospace', color: 'var(--primary)' }}>
                      {c.caseNumber}
                    </td>
                    <td>{c.patientReference}</td>
                    <td style={{ fontWeight: '500' }}>{c.surgeonName}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.implantType}</td>
                    <td>
                      <span className={statusBadgeClass}>{c.status}</span>
                    </td>
                    <td>
                      <span className={priorityClass}>{c.priority}</span>
                    </td>
                    <td>
                      {c.surgeryDate
                        ? new Date(c.surgeryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : <span style={{ color: 'var(--text-dim)' }}>Unscheduled</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {/* View Button - All Roles */}
                        <button
                          onClick={() => navigate(`/cases/${c._id}`)}
                          className="btn btn-secondary btn-sm"
                          title="View Case Details"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>

                        {/* Edit Button - Admin and Engineer only */}
                        {canEdit && (
                          <button
                            onClick={() => navigate(`/cases/${c._id}/edit`)}
                            className="btn btn-secondary btn-sm"
                            title="Edit Case"
                          >
                            <Edit size={14} />
                            <span>Edit</span>
                          </button>
                        )}

                        {/* Delete Button - Admin only */}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="btn btn-danger btn-sm"
                            title="Delete Case"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && pagination.total > 0 && (
        <div className="pagination-bar">
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total cases)
          </div>

          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={pagination.page <= 1}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <span style={{ padding: '0 0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
              {pagination.page} / {pagination.totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="btn btn-secondary btn-sm"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ color: '#f43f5e', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 size={20} />
              Confirm Case Deletion
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Are you sure you want to permanently delete case <strong>{deleteTarget.caseNumber}</strong> ({deleteTarget.patientReference})? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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
