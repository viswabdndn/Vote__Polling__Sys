import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
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
  MdAdminPanelSettings,
  MdClose,
  MdPeople,
  MdPersonAdd,
} from 'react-icons/md';

const Sidebar = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (onClose) onClose();
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const isAdmin = user?.role === 'admin';
  const isCreator = user?.role === 'creator';

  const isLinkActive = (item) => {
    if (item.matchQuery) {
      return location.pathname === '/admin' && location.search.includes(item.matchQuery);
    }
    if (item.exact) {
      return location.pathname === item.to && (!location.search || location.search === '' || location.search === '?tab=approvals');
    }
    return location.pathname === item.to;
  };

  const navItems = [
    ...(isAdmin
      ? [
          { to: '/admin', icon: <MdAdminPanelSettings size={20} />, label: 'Admin Dashboard', exact: true },
          { to: '/admin?tab=creators', icon: <MdPeople size={20} />, label: 'Manage Creators', matchQuery: 'tab=creators' },
          { to: '/admin?tab=creators&action=new', icon: <MdPersonAdd size={20} />, label: 'Add Creator', matchQuery: 'action=new' },
        ]
      : []),
    {
      to: '/dashboard',
      icon: <MdDashboard size={20} />,
      label: isCreator ? 'Creator Dashboard' : t('dashboard'),
    },
    { to: '/polls', icon: <MdPoll size={20} />, label: isAdmin ? 'All Polls' : t('availablePolls') },
    ...(isAdmin || isCreator
      ? [
          { to: '/create-poll', icon: <MdAddCircleOutline size={20} />, label: t('createPoll') },
          { to: '/my-polls', icon: <MdBookmarks size={20} />, label: t('myPolls') },
        ]
      : []),
    { to: '/history', icon: <MdHistory size={20} />, label: t('pollHistory') },
    { to: '/profile', icon: <MdPerson size={20} />, label: t('profile') },
    { to: '/settings', icon: <MdSettings size={20} />, label: t('settings') },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo and Mobile Close */}
        <div style={styles.logoHeader}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <MdHowToVote size={26} color="#fff" />
            </div>
            <div>
              <div style={styles.logoText}>PollLive</div>
              <div style={styles.logoSub}>{t('brandSub')}</div>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            aria-label="Close navigation sidebar"
          >
            <MdClose size={22} color="#ffffff" />
          </button>
        </div>

        <div style={styles.divider} />

        {/* Navigation */}
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={() => `sidebar-nav-link ${isLinkActive(item) ? 'active' : ''}`}
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
    </>
  );
};

const styles = {
  logoHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 20px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
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
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
  },
  logoText: {
    color: '#fff',
    fontWeight: 800,
    fontSize: '1.15rem',
    letterSpacing: '-0.02em',
  },
  logoSub: {
    color: 'rgba(255,255,255,0.7)',
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
    color: 'rgba(255,255,255,0.85)',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 12,
    transition: 'all 0.2s',
  },
};

export default Sidebar;
