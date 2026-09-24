import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pollAPI } from '../services/api';
import { MdAdd, MdDelete, MdAccessTime } from 'react-icons/md';
import toast from 'react-hot-toast';

const CreatePoll = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    expiryTime: '',
  });
  const [options, setOptions] = useState(['', '']);
  const [errors, setErrors] = useState({});

  // Default expiry to 24h from now
  const defaultExpiry = () => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleOptionChange = (index, value) => {
    const newOpts = [...options];
    newOpts[index] = value;
    setOptions(newOpts);
    if (errors.options) setErrors({ ...errors, options: '' });
  };

  const addOption = () => {
    if (options.length >= 10) { toast.error('Maximum 10 options allowed.'); return; }
    setOptions([...options, '']);
  };

  const removeOption = (index) => {
    if (options.length <= 2) { toast.error('Minimum 2 options required.'); return; }
    setOptions(options.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Poll title is required.';
    else if (form.title.trim().length < 5) errs.title = 'Title must be at least 5 characters.';

    if (!form.expiryTime) errs.expiryTime = 'Expiry date/time is required.';
    else if (new Date(form.expiryTime) <= new Date()) errs.expiryTime = 'Expiry must be in the future.';

    const cleanOpts = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOpts.length < 2) errs.options = 'At least two non-empty options are required.';
    else {
      const lower = cleanOpts.map((o) => o.toLowerCase());
      if (new Set(lower).size !== lower.length) errs.options = 'Duplicate option names are not allowed.';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        expiryTime: new Date(form.expiryTime).toISOString(),
        options: options.map((o) => o.trim()).filter(Boolean),
      };
      const { data } = await pollAPI.create(payload);
      toast.success('Poll created successfully.');
      navigate(`/polls/${data.poll._id}/results`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create poll.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Create New Poll</h1>
        <p className="page-subtitle">Set up a poll with multiple voting options</p>
      </div>

      <div style={{ maxWidth: 680 }}>
        <form onSubmit={handleSubmit}>
          {/* Poll Details */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Poll Details</h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Poll Title *</label>
                <input
                  id="poll-title"
                  name="title"
                  type="text"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="e.g. Which programming language do you prefer?"
                  value={form.title}
                  onChange={handleChange}
                  maxLength={200}
                />
                {errors.title && <p className="form-error">{errors.title}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  id="poll-description"
                  name="description"
                  className="form-input"
                  style={{ resize: 'vertical', minHeight: 90 }}
                  placeholder="Provide additional context for voters..."
                  value={form.description}
                  onChange={handleChange}
                  maxLength={1000}
                />
                <p className="form-help">{form.description.length}/1000 characters</p>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <MdAccessTime size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Expiry Date & Time *
                </label>
                <input
                  id="poll-expiry"
                  name="expiryTime"
                  type="datetime-local"
                  className={`form-input ${errors.expiryTime ? 'error' : ''}`}
                  value={form.expiryTime || defaultExpiry()}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={handleChange}
                />
                {errors.expiryTime && <p className="form-error">{errors.expiryTime}</p>}
                <p className="form-help">Poll will automatically close after this date and time.</p>
              </div>
            </div>
          </div>

          {/* Voting Options */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Voting Options *</h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Add 2–10 options for voters to choose from</p>
              </div>
              <span className="badge badge-primary">{options.length} options</span>
            </div>
            <div className="card-body">
              {errors.options && (
                <div style={{ background: 'var(--error-bg)', border: '1px solid #fca5a5', borderRadius: 'var(--border-radius-sm)', padding: '10px 14px', marginBottom: 16 }}>
                  <p style={{ color: 'var(--error)', fontSize: '0.875rem', fontWeight: 500 }}>{errors.options}</p>
                </div>
              )}

              {options.map((opt, i) => (
                <div key={i} className="option-input-row">
                  <div className="option-number">{i + 1}</div>
                  <input
                    id={`option-${i}`}
                    type="text"
                    className="form-input"
                    placeholder={`Option ${i + 1}${i === 0 ? ' (e.g. JavaScript)' : i === 1 ? ' (e.g. Python)' : ''}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    maxLength={200}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    style={{
                      padding: '8px',
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--border-radius-sm)',
                      color: options.length <= 2 ? 'var(--text-light)' : 'var(--error)',
                      cursor: options.length <= 2 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                    disabled={options.length <= 2}
                    title="Remove option"
                  >
                    <MdDelete size={18} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={addOption}
                style={{ marginTop: 4 }}
                disabled={options.length >= 10}
              >
                <MdAdd size={16} /> Add Option
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              id="create-poll-btn"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Creating...
                </>
              ) : 'Create Poll'}
            </button>
            <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePoll;
