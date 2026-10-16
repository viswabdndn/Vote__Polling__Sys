import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { FiLogOut } from 'react-icons/fi';
import {
  MdHowToVote,
  MdLightMode,
  MdDarkMode,
  MdSettings,
  MdMenu,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { mode, setMode, t, playSound } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDarkMode = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    playSound('click');
  };

  return (
    <header className="navbar-header" style={styles.navbar}>
      <div style={styles.brandGroup}>
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleSidebar}
          className="mobile-hamburger-btn"
          aria-label="Toggle navigation menu"
          style={styles.mobileMenuBtn}
        >
          <MdMenu size={22} color="var(--text-primary)" />
        </button>

        <div style={styles.brand}>
          <div style={styles.brandIconWrap}>
            <MdHowToVote size={22} color="var(--accent)" />
          </div>
          <span style={styles.brandName}>PollLive</span>
        </div>
      </div>

      <div style={styles.right}>
        {/* Dark/Light Quick Toggle */}
        <button
          onClick={toggleDarkMode}
          style={styles.iconBtn}
          title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {mode === 'dark' ? (
            <MdLightMode size={18} color="#f59e0b" />
          ) : (
            <MdDarkMode size={18} color="var(--text-secondary)" />
          )}
        </button>

        {/* Admin Quick Button */}
        {user?.role === 'admin' && (
          <button
            onClick={() => navigate('/admin')}
            style={{
              ...styles.iconBtn,
              background: 'rgba(220, 38, 38, 0.1)',
              borderColor: 'rgba(220, 38, 38, 0.3)',
            }}
            title="Admin Dashboard"
            aria-label="Admin Dashboard"
          >
            <span style={{ fontSize: '1rem' }}>🛡️</span>
          </button>
        )}

        {/* Quick Settings Button */}
        <button
          onClick={() => navigate('/settings')}
          style={styles.iconBtn}
          title={t('settings')}
          aria-label={t('settings')}
        >
          <MdSettings size={18} color="var(--text-secondary)" />
        </button>

        {/* User Info */}
        <div
          style={styles.userInfo}
          onClick={() => navigate('/profile')}
          role="button"
          tabIndex={0}
          title="View Profile"
          aria-label="View user profile"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              navigate('/profile');
            }
          }}
        >
          <div style={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="nav-user-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={styles.userName}>{user?.name}</span>
              <span
                className={`badge ${
                  user?.role === 'admin'
                    ? 'badge-closed'
                    : user?.role === 'creator'
                    ? 'badge-primary'
                    : 'badge-active'
                }`}
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 6px',
                  ...(user?.role === 'admin'
                    ? { background: 'rgba(220, 38, 38, 0.12)', color: 'var(--error)' }
                    : {}),
                }}
              >
                {user?.role === 'admin'
                  ? '🛡️ Admin'
                  : user?.role === 'creator'
                  ? '👑 Creator'
                  : '🎓 Participant'}
              </span>
            </div>
            <div style={styles.userEmail}>
              {user?.voterId ? `ID: ${user.voterId}` : user?.email}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={styles.logoutBtn}
          title={t('logout')}
          aria-label={t('logout')}
        >
          <FiLogOut size={16} />
          <span className="logout-text">{t('logout')}</span>
        </button>
      </div>
    </header>
  );
};

const styles = {
  navbar: {
    position: 'fixed',
    top: 0,
    left: 'var(--sidebar-width)',
    right: 0,
    height: 'var(--navbar-height)',
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    zIndex: 100,
    boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
    transition: 'background 0.3s ease, border-color 0.3s ease, left 0.3s ease',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  mobileMenuBtn: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    borderRadius: 'var(--border-radius-sm)',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    cursor: 'pointer',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  brandIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: 'rgba(0, 180, 216, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: '1.15rem',
    fontWeight: 800,
    color: 'var(--primary-light)',
    letterSpacing: '-0.02em',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '5px 12px',
    borderRadius: 'var(--border-radius-sm)',
    background: 'var(--surface)',
    cursor: 'pointer',
    border: '1px solid var(--border)',
    transition: 'var(--transition)',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), var(--primary-light))',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.9rem',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(0, 180, 216, 0.25)',
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  userEmail: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    lineHeight: 1.2,
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    background: 'transparent',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default Navbar;
