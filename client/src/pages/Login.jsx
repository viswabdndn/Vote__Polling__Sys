import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdHowToVote, MdBadge, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errs = {};
    if (!form.identifier.trim()) {
      errs.identifier = 'Participant ID or Email is required.';
    }
    if (!form.password) {
      errs.password = 'Password is required.';
    }
    return errs;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your ID/Email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <MdHowToVote size={30} />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in with your 7-digit Participant ID or Email</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Participant ID (7-8 Digits) or Email</label>
            <div style={{ position: 'relative' }}>
              <MdBadge size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-identifier"
                name="identifier"
                type="text"
                className={`form-input ${errors.identifier ? 'error' : ''}`}
                style={{ paddingLeft: 38 }}
                placeholder="e.g. 24104110 or alice@example.com"
                value={form.identifier}
                onChange={handleChange}
                autoFocus
              />
            </div>
            {errors.identifier && <p className="form-error">{errors.identifier}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <MdLock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'error' : ''}`}
                style={{ paddingLeft: 38, paddingRight: 42 }}
                placeholder="Your unique password"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPwd ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <button
            id="login-btn"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Signing In...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--info-bg)', borderRadius: 'var(--border-radius-sm)', border: '1px solid #bfdbfe' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--info)', fontWeight: 700, marginBottom: 8 }}>💡 Demo Accounts (Click to auto-fill):</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              type="button"
              onClick={() => setForm({ identifier: 'john@example.com', password: 'password123' })}
              style={{ textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              👑 <strong>Creator (John Smith):</strong> <code>john@example.com</code> / <code>password123</code>
            </button>
            <button
              type="button"
              onClick={() => setForm({ identifier: '24104111', password: 'password123' })}
              style={{ textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              🎓 <strong>Participant (Bob Smith):</strong> ID: <code>24104111</code> / <code>password123</code>
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Register with your 7-digit ID</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
