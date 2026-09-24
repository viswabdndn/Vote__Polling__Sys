import { useAuth } from '../context/AuthContext';
import { MdPerson, MdEmail, MdCalendarToday, MdBadge, MdShield, MdHowToVote } from 'react-icons/md';

const Profile = () => {
  const { user } = useAuth();
  const isCreator = user?.role === 'creator';

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="page-container animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Your account and role information</p>
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* Avatar card */}
        <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: '36px 24px' }}>
          <div style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: isCreator
              ? 'linear-gradient(135deg, var(--primary-light), var(--primary))'
              : 'linear-gradient(135deg, var(--accent), var(--primary-light))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.2rem',
            fontWeight: 800,
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            {user?.name}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <span className={`badge ${isCreator ? 'badge-primary' : 'badge-active'}`} style={{ fontSize: '0.82rem', padding: '3px 12px' }}>
              {isCreator ? '👑 Poll Creator & Admin' : '🎓 Participant / Voter'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.email}</p>
        </div>

        {/* Details card */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Account Details</h2>
          </div>
          <div className="card-body">
            {[
              {
                icon: isCreator ? <MdShield size={18} /> : <MdBadge size={18} />,
                label: isCreator ? 'Admin / Creator ID' : 'Participant / 7-Digit ID',
                value: user?.voterId || (isCreator ? 'Admin' : 'N/A'),
              },
              {
                icon: <MdHowToVote size={18} />,
                label: 'Account Role',
                value: isCreator ? '👑 Creator (Creates polls, manages votes, shares links)' : '🎓 Participant (Submits votes, views live results)',
              },
              { icon: <MdPerson size={18} />, label: 'Full Name', value: user?.name },
              { icon: <MdEmail size={18} />, label: 'Email Address', value: user?.email },
              { icon: <MdCalendarToday size={18} />, label: 'Member Since', value: joined },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '14px 0',
                borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none',
              }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: isCreator ? 'rgba(42,82,152,0.08)' : 'rgba(0,180,216,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isCreator ? 'var(--primary-light)' : 'var(--accent)',
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

        {/* Security / Role note */}
        <div style={{
          marginTop: 16,
          padding: '14px 18px',
          background: isCreator ? 'rgba(42,82,152,0.06)' : 'var(--success-bg)',
          borderRadius: 'var(--border-radius-sm)',
          border: isCreator ? '1px solid var(--border-light)' : '1px solid #86efac',
        }}>
          <p style={{ fontSize: '0.82rem', color: isCreator ? 'var(--primary-light)' : 'var(--success)', fontWeight: 600 }}>
            {isCreator
              ? '👑 You are logged in as Creator / Admin. You have full privileges to create, manage, and close polls.'
              : '🎓 You are logged in as a Participant. You can vote in active polls and view real-time results.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
