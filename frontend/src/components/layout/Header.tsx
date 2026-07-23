import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiLogOut } from 'react-icons/fi';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { logout } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <h2>{title}</h2>
      </div>
      <div className="header-right">
        <button className="btn-logout" onClick={logout}>
          <FiLogOut style={{ marginRight: 6 }} />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
