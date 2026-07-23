import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome,
  FiUsers,
  FiPackage,
  FiTruck,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiAlertTriangle,
} from 'react-icons/fi';

const Sidebar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Mini ERP</h1>
        <span>Operations Portal</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Main</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FiHome /> Dashboard
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">CRM</div>
          <NavLink to="/customers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FiUsers /> Customers
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Inventory</div>
          <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FiPackage /> Products
          </NavLink>
          {hasRole('Admin', 'Warehouse') && (
            <NavLink to="/inventory" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FiTruck /> Stock Movements
            </NavLink>
          )}
          <NavLink to="/low-stock" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FiAlertTriangle /> Low Stock Alerts
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Sales</div>
          <NavLink to="/challans" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FiFileText /> Sales Challans
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user ? getInitials(user.full_name) : '??'}
          </div>
          <div className="user-details">
            <div className="name">{user?.full_name}</div>
            <div className="role">{user?.role}</div>
          </div>
          <button className="modal-close" onClick={logout} title="Logout">
            <FiLogOut />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
