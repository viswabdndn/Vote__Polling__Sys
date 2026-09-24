import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { FiLogOut } from 'react-icons/fi';
import { MdHowToVote, MdLightMode, MdDarkMode, MdSettings } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
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
    <header style={styles.navbar}>
      <div style={styles.brand}>
        <MdHowToVote size={24} color="var(--accent)" />
        <span style={styles.brandName}>PollLive</span>
      </div>

      <div style={styles.right}>
        {/* Dark/Light Quick Toggle */}
        <button
          onClick={toggleDarkMode}
          style={styles.iconBtn}
          title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {mode === 'dark' ? <MdLightMode size={18} color="#f59e0b" /> : <MdDarkMode size={18} color="var(--text-secondary)" />}
        </button>

        {/* Quick Settings Button */}
        <button
          onClick={() => navigate('/settings')}
          style={styles.iconBtn}
          title={t('settings')}
        >
          <MdSettings size={18} color="var(--text-secondary)" />
        </button>

        {/* User Info */}
        <div style={styles.userInfo} onClick={() => navigate('/profile')} role="button" title="View Profile">
          <div style={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={styles.userName}>{user?.name}</span>
              <span className={`badge ${user?.role === 'creator' ? 'badge-primary' : 'badge-active'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                {user?.role === 'creator' ? '👑 Creator' : '🎓 Participant'}
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
        >
          <FiLogOut size={16} />
          <span>{t('logout')}</span>
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
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    zIndex: 100,
    boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
    transition: 'background 0.3s ease, border-color 0.3s ease',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontSize: '1.1rem',
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
    width: 36,
    height: 36,
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
    padding: '6px 12px',
    borderRadius: 'var(--border-radius-sm)',
    background: 'var(--bg)',
    cursor: 'pointer',
    border: '1px solid var(--border-light)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), var(--primary-light))',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.9rem',
    flexShrink: 0,
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
    padding: '7px 14px',
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
