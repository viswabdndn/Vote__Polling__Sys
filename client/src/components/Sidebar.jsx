import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  MdHowToVote,
  MdDashboard,
  MdPoll,
  MdAddCircleOutline,
  MdBookmarks,
  MdHistory,
  MdPerson,
  MdSettings,
  MdLogout,
} from 'react-icons/md';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isParticipant = user?.role === 'participant';

  const navItems = [
    { to: '/dashboard', icon: <MdDashboard size={20} />, label: t('dashboard') },
    { to: '/polls', icon: <MdPoll size={20} />, label: t('availablePolls') },
    ...(!isParticipant ? [
      { to: '/create-poll', icon: <MdAddCircleOutline size={20} />, label: t('createPoll') },
      { to: '/my-polls', icon: <MdBookmarks size={20} />, label: t('myPolls') },
    ] : []),
    { to: '/history', icon: <MdHistory size={20} />, label: t('pollHistory') },
    { to: '/profile', icon: <MdPerson size={20} />, label: t('profile') },
    { to: '/settings', icon: <MdSettings size={20} />, label: t('settings') },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoIcon}>
          <MdHowToVote size={26} color="#fff" />
        </div>
        <div>
          <div style={styles.logoText}>PollLive</div>
          <div style={styles.logoSub}>{t('brandSub')}</div>
        </div>
      </div>

      <div style={styles.divider} />

      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom logout */}
      <div style={styles.bottom}>
        <div style={styles.divider} />
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <MdLogout size={20} />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 'var(--sidebar-width)',
    height: '100vh',
    background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-hover) 100%)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 200,
    boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
    transition: 'background 0.3s ease',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '24px 20px',
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    color: '#fff',
    fontWeight: 800,
    fontSize: '1.1rem',
    letterSpacing: '-0.02em',
  },
  logoSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: '0.72rem',
    fontWeight: 500,
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.12)',
    margin: '0 16px',
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '11px 14px',
    borderRadius: 'var(--border-radius-sm)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all 0.2s',
    textDecoration: 'none',
  },
  navItemActive: {
    background: 'rgba(255,255,255,0.18)',
    color: '#fff',
    fontWeight: 600,
    backdropFilter: 'blur(4px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  navIcon: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  bottom: {
    padding: '0 12px 16px',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 'var(--border-radius-sm)',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 12,
    transition: 'all 0.2s',
  },
};

export default Sidebar;
