import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../supabase';
import { useAuthStore, useAppStore } from '../store';
import { FiHome, FiEdit3, FiUsers, FiBook, FiAward, FiSettings, FiLogOut, FiMenu, FiX, FiBookOpen, FiCpu } from 'react-icons/fi';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuthStore();
  const { xp, badges } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);

  // Build nav links dynamically based on user role
  const navLinks = [
    { path: '/home',      icon: FiHome,   label: 'Home' },
    ...(profile?.role === 'teacher' 
      ? [{ path: '/teacher', icon: FiBookOpen, label: 'Teacher Portal' }] 
      : []
    ),
    ...(profile?.role === 'child' 
      ? [{ path: '/assignments', icon: FiBookOpen, label: 'Assignments' }] 
      : []
    ),
    { path: '/write',     icon: FiEdit3,  label: 'Write' },
    { path: '/lab',       icon: FiCpu,    label: 'Lab' },
    { path: '/community', icon: FiUsers,  label: 'Community' },
    { path: '/journal',   icon: FiBook,   label: 'My Journal' },
    { path: '/contests',  icon: FiAward,  label: 'Contests' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/');
  };

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/home" className="navbar-logo">
          <span className="navbar-logo-emoji">✍️</span>
          <span className="navbar-logo-text">Young<span>Writers</span></span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar-links hide-mobile">
          {navLinks.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`navbar-link ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {/* Progress Pill */}
          <div className="navbar-progress-pill hide-mobile">
            <span>⚡ {xp} XP</span>
            {badges.length > 0 && (
              <>
                <span className="pill-divider">|</span>
                <span>🏅 {badges.length}</span>
              </>
            )}
          </div>

          {/* Avatar */}
          <button className="navbar-avatar" onClick={() => navigate('/settings')} title="Settings & Profile">
            {initials}
          </button>

          {/* Logout */}
          <button className="navbar-icon-btn" onClick={handleLogout} title="Logout">
            <FiLogOut size={18} />
          </button>

          {/* Mobile menu toggle */}
          <button
            className="navbar-icon-btn show-mobile"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="navbar-mobile-drawer">
          {navLinks.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`navbar-mobile-link ${location.pathname === path ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
          <div className="navbar-mobile-footer">
            <span>⚡ {xp} XP</span>
            {badges.length > 0 && <span>🏅 {badges.length} badges</span>}
          </div>
        </div>
      )}
    </nav>
  );
}
