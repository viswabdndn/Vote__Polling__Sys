import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdHowToVote, MdEmail, MdLock, MdPerson, MdBadge, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    voterId: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';

    if (!form.voterId.trim() && !form.email.trim()) {
      errs.voterId = 'Participant ID (e.g. 24104110) or Email is required.';
    } else if (form.voterId.trim() && !/^[0-9a-zA-Z]{4,15}$/.test(form.voterId.trim())) {
      errs.voterId = 'Participant ID must be 4 to 15 alphanumeric characters (e.g. 24104110).';
    }

    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errs.email = 'Enter a valid email address.';
    }

    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
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
      await register(form);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Register with your 7-digit ID to participate & vote</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <MdPerson size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="reg-name"
                name="name"
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                style={{ paddingLeft: 38 }}
                placeholder="e.g. Alice Johnson"
                value={form.name}
                onChange={handleChange}
                autoFocus
              />
            </div>
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Participant / Voter ID (7-8 Digits)</label>
            <div style={{ position: 'relative' }}>
              <MdBadge size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="reg-voter-id"
                name="voterId"
                type="text"
                className={`form-input ${errors.voterId ? 'error' : ''}`}
                style={{ paddingLeft: 38 }}
                placeholder="e.g. 24104110"
                value={form.voterId}
                onChange={handleChange}
              />
            </div>
            {errors.voterId && <p className="form-error">{errors.voterId}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label>
            <div style={{ position: 'relative' }}>
              <MdEmail size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="reg-email"
                name="email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                style={{ paddingLeft: 38 }}
                placeholder="Optional (e.g. alice@example.com)"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Unique Password</label>
            <div style={{ position: 'relative' }}>
              <MdLock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="reg-password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'error' : ''}`}
                style={{ paddingLeft: 38, paddingRight: 42 }}
                placeholder="Min. 6 characters"
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

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <MdLock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="reg-confirm-password"
                name="confirmPassword"
                type={showPwd ? 'text' : 'password'}
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                style={{ paddingLeft: 38 }}
                placeholder="Repeat your unique password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
          </div>

          <button
            id="register-btn"
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
                Creating Account...
              </>
            ) : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in with your 7-digit ID</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
