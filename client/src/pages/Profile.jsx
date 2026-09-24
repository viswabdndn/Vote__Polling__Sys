import { useAuth } from '../context/AuthContext';
import { MdPerson, MdEmail, MdCalendarToday, MdBadge } from 'react-icons/md';

const Profile = () => {
  const { user } = useAuth();

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="page-container animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Your account information</p>
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* Avatar card */}
        <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: '40px 24px' }}>
          <div style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--primary-light))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.2rem',
            fontWeight: 800,
            margin: '0 auto 18px',
            boxShadow: '0 8px 24px rgba(0,180,216,0.3)',
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            {user?.name}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.email}</p>
        </div>

        {/* Details card */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Account Details</h2>
          </div>
          <div className="card-body">
            {[
              { icon: <MdBadge size={18} />, label: 'Participant / Voter ID', value: user?.voterId || 'N/A' },
              { icon: <MdPerson size={18} />, label: 'Full Name', value: user?.name },
              { icon: <MdEmail size={18} />, label: 'Email Address', value: user?.email },
              { icon: <MdCalendarToday size={18} />, label: 'Member Since', value: joined },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '14px 0',
                borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none',
              }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(42,82,152,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-light)',
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{item.label}</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{item.value || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security note */}
        <div style={{
          marginTop: 16,
          padding: '14px 18px',
          background: 'var(--info-bg)',
          borderRadius: 'var(--border-radius-sm)',
          border: '1px solid #bfdbfe',
        }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--info)', fontWeight: 500 }}>
            🔒 Your password is securely hashed and never stored in plain text. Account data is protected by JWT authentication.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
