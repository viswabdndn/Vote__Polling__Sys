import { useNavigate } from 'react-router-dom';
import { MdLockOutline, MdArrowBack, MdDashboard } from 'react-icons/md';

const AccessDenied = ({
  title = 'Access Denied',
  message = 'You do not have permission to access this resource or perform this action.',
  requiredRole,
  requiredPermission,
  inline = false,
}) => {
  const navigate = useNavigate();

  if (inline) {
    return (
      <div
        className="animate-fadeIn"
        style={{
          padding: '16px 20px',
          background: 'var(--error-bg)',
          border: '1.5px solid #fca5a5',
          borderRadius: 'var(--border-radius-sm)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(220, 38, 38, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--error)',
            flexShrink: 0,
          }}
        >
          <MdLockOutline size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--error)', marginBottom: 2 }}>
            {title}
          </h4>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {message}
          </p>
          {(requiredRole || requiredPermission) && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {requiredRole && `Requires role: ${requiredRole}. `}
              {requiredPermission && `Requires permission: ${requiredPermission}.`}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fadeIn" style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
      <div className="card" style={{ maxWidth: 540, width: '100%', textAlign: 'center', padding: '40px 28px' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--error-bg)',
            color: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 4px 16px rgba(220, 38, 38, 0.15)',
          }}
        >
          <MdLockOutline size={36} />
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          {title}
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
          {message}
        </p>

        {(requiredRole || requiredPermission) && (
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--bg)',
              borderRadius: 'var(--border-radius-sm)',
              marginBottom: 24,
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-light)',
            }}
          >
            {requiredRole && <div>Required Role: <strong>{requiredRole}</strong></div>}
            {requiredPermission && <div>Required Permission: <strong>{requiredPermission}</strong></div>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>
            <MdArrowBack size={18} /> Go Back
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            <MdDashboard size={18} /> Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
