import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LayoutDashboard, FolderKanban, PlusCircle, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const canCreate = ['admin', 'engineer'].includes(user.role);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <NavLink to="/" className="nav-brand">
          <Activity size={26} />
          <span>MedCase</span>
          <span className="badge-beta">Clinical</span>
        </NavLink>

        {/* Navigation Links */}
        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/cases"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <FolderKanban size={16} />
            <span>Cases</span>
          </NavLink>

          {canCreate && (
            <NavLink
              to="/cases/new"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <PlusCircle size={16} />
              <span>New Case</span>
            </NavLink>
          )}
        </nav>

        {/* User Badge & Logout */}
        <div className="nav-user">
          <div className="user-badge">
            <span className="user-name">{user.name}</span>
            <span className={`user-role-badge role-${user.role}`}>
              {user.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            title="Log out of session"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
