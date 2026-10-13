import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pollAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MdBarChart,
  MdHowToVote,
  MdLock,
  MdTimer,
  MdEdit,
  MdDelete,
  MdAddCircleOutline,
  MdWarning,
  MdCheckCircle,
  MdCancel,
} from 'react-icons/md';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const MyPolls = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [closingId, setClosingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Edit modal
  const [editingPoll, setEditingPoll] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', expiryTime: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchMyPolls = async () => {
    try {
      const { data } = await pollAPI.getMy();
      setPolls(data.polls);
      if (refreshUser) refreshUser();
    } catch {
      toast.error('Failed to load your polls.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPolls();
  }, []);

  const perms = user?.creatorPermissions || {};
  const isAdmin = user?.role === 'admin';
  const canCreate = isAdmin || perms.canCreatePoll !== false;
  const canEdit = isAdmin || perms.canEditPoll !== false;
  const canPublish = isAdmin || perms.canPublishPoll !== false;
  const canDelete = isAdmin || perms.canDeletePoll !== false;

  const hasRevokedPermissions = !isAdmin && (!canCreate || !canEdit || !canPublish || !canDelete);

  const handleClose = async (pollId) => {
    if (!canPublish) {
      toast.error('Permission denied: Permission to close or publish polls has been revoked by admin.');
      return;
    }

    if (!window.confirm('Are you sure you want to close this poll? This cannot be undone.')) return;
    setClosingId(pollId);
    try {
      await pollAPI.close(pollId);
      toast.success('Poll closed successfully.');
      fetchMyPolls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close poll.');
    } finally {
      setClosingId(null);
    }
  };

  const handleDelete = async (pollId) => {
    if (!canDelete) {
      toast.error('Permission denied: Permission to delete polls has been revoked by admin.');
      return;
    }

    if (!window.confirm('Are you sure you want to permanently delete this poll and all its votes?')) return;
    setDeletingId(pollId);
    try {
      await pollAPI.delete(pollId);
      toast.success('Poll deleted successfully.');
      fetchMyPolls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete poll.');
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (poll) => {
    if (!canEdit) {
      toast.error('Permission denied: Permission to edit polls has been revoked by admin.');
      return;
    }
    setEditingPoll(poll);
    setEditForm({
      title: poll.title,
      description: poll.description || '',
      expiryTime: new Date(poll.expiryTime).toISOString().slice(0, 16),
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingPoll) return;
    setSavingEdit(true);
    try {
      const { data } = await pollAPI.update(editingPoll._id, {
        title: editForm.title,
        description: editForm.description,
        expiryTime: new Date(editForm.expiryTime).toISOString(),
      });
      toast.success(data.message || 'Poll updated successfully.');
      setEditingPoll(null);
      fetchMyPolls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update poll.');
    } finally {
      setSavingEdit(false);
    }
  };

  const now = new Date();
  const pendingPolls = polls.filter((p) => p.approvalStatus === 'pending');
  const rejectedPolls = polls.filter((p) => p.approvalStatus === 'rejected');
  const activePolls = polls.filter(
    (p) => p.approvalStatus === 'approved' && p.status === 'active' && new Date(p.expiryTime) > now
  );
  const completedPolls = polls.filter(
    (p) => p.approvalStatus === 'approved' && (p.status === 'closed' || new Date(p.expiryTime) <= now)
  );

  let displayed = polls;
  if (activeTab === 'pending') displayed = pendingPolls;
  else if (activeTab === 'active') displayed = activePolls;
  else if (activeTab === 'rejected') displayed = rejectedPolls;
  else if (activeTab === 'completed') displayed = completedPolls;

  const totalVotesReceived = polls.reduce((sum, p) => sum + (p.totalVotes || 0), 0);

  return (
    <div className="page-container animate-fadeIn">
      {/* Header */}
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}
      >
        <div>
          <h1 className="page-title">Creator Dashboard</h1>
          <p className="page-subtitle">Track poll approvals, manage your live questions & view votes</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!canCreate) {
              toast.error('Access Denied: Admin has revoked your permission to create polls.');
            } else {
              navigate('/create-poll');
            }
          }}
          disabled={!canCreate}
          title={!canCreate ? 'Poll creation permission revoked by admin' : 'Create a new poll'}
        >
          <MdAddCircleOutline size={18} /> + Create Poll
        </button>
      </div>

      {/* Permission Restriction Warning Banner */}
      {hasRevokedPermissions && (
        <div
          className="animate-fadeIn"
          style={{
            padding: '16px 20px',
            background: 'var(--warning-bg)',
            border: '1.5px solid #fde68a',
            borderRadius: 'var(--border-radius)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            marginBottom: 24,
          }}
        >
          <MdWarning size={24} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#92400e', marginBottom: 2 }}>
              Creator Permission Restrictions Active
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#78350f', lineHeight: 1.4 }}>
              An administrator has modified your creator permissions. Restricted actions are disabled on your dashboard:
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <span className={`badge ${canCreate ? 'badge-active' : 'badge-closed'}`}>
                {canCreate ? '✅ Create Polls' : '⛔ Create Polls Revoked'}
              </span>
              <span className={`badge ${canEdit ? 'badge-active' : 'badge-closed'}`}>
                {canEdit ? '✅ Edit Polls' : '⛔ Edit Polls Revoked'}
              </span>
              <span className={`badge ${canPublish ? 'badge-active' : 'badge-closed'}`}>
                {canPublish ? '✅ Close/Publish' : '⛔ Close/Publish Revoked'}
              </span>
              <span className={`badge ${canDelete ? 'badge-active' : 'badge-closed'}`}>
                {canDelete ? '✅ Delete Polls' : '⛔ Delete Polls Revoked'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Creator Metrics Row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(42,82,152,0.1)', color: 'var(--primary-light)' }}>
            <MdHowToVote size={22} />
          </div>
          <div className="stat-card-value">{polls.length}</div>
          <div className="stat-card-label">Total Submitted</div>
        </div>

        <div className="stat-card" onClick={() => setActiveTab('pending')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <MdTimer size={22} />
          </div>
          <div className="stat-card-value">{pendingPolls.length}</div>
          <div className="stat-card-label">Pending Approval</div>
        </div>

        <div className="stat-card" onClick={() => setActiveTab('active')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(10,158,108,0.1)', color: 'var(--success)' }}>
            <MdTimer size={22} />
          </div>
          <div className="stat-card-value">{activePolls.length}</div>
          <div className="stat-card-label">Active Open Polls</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(0,180,216,0.1)', color: 'var(--accent)' }}>
            <MdBarChart size={22} />
          </div>
          <div className="stat-card-value">{totalVotesReceived}</div>
          <div className="stat-card-label">Total Votes Received</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({polls.length})
        </button>
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pending Approval ({pendingPolls.length})
        </button>
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          🟢 Active ({activePolls.length})
        </button>
        {rejectedPolls.length > 0 && (
          <button
            className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            🔴 Rejected ({rejectedPolls.length})
          </button>
        )}
        <button
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({completedPolls.length})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading your creator polls..." />
      ) : displayed.length === 0 ? (
        <div className="empty-state card card-body">
          <div className="empty-state-icon">🗳️</div>
          <p className="empty-state-title">
            {activeTab === 'active' ? 'No active polls' : 'No completed polls'}
          </p>
          <p className="empty-state-desc">
            {activeTab === 'active'
              ? canCreate
                ? 'Create your first poll to get started.'
                : 'You currently have no active polls.'
              : 'Completed polls will appear here.'}
          </p>
          {activeTab === 'active' && canCreate && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/create-poll')}>
              + Create Poll
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {displayed.map((poll) => {
            const isExpired = poll.status === 'closed' || new Date(poll.expiryTime) <= now;
            const expiry = new Date(poll.expiryTime);

            return (
              <div key={poll._id} className="card">
                <div
                  className="card-body"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                      {poll.approvalStatus === 'pending' ? (
                        <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                          ⏳ Pending Admin Review
                        </span>
                      ) : poll.approvalStatus === 'rejected' ? (
                        <span className="badge" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid #fca5a5' }}>
                          ❌ Rejected by Admin
                        </span>
                      ) : (
                        <span className={`badge ${isExpired ? 'badge-closed' : 'badge-active'}`}>
                          {isExpired ? 'Closed' : 'Active'}
                        </span>
                      )}

                      <span className="badge badge-primary">{poll.options?.length || 0} options</span>
                      {typeof poll.totalVotes === 'number' && poll.approvalStatus === 'approved' && (
                        <span className="badge badge-accent">{poll.totalVotes} votes</span>
                      )}
                    </div>
                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 6,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {poll.title}
                    </h3>
                    {poll.approvalStatus === 'rejected' && (
                      <div
                        style={{
                          marginBottom: 8,
                          padding: '6px 12px',
                          background: 'var(--error-bg)',
                          borderRadius: 6,
                          fontSize: '0.8rem',
                          color: 'var(--error)',
                          border: '1px solid rgba(220,38,38,0.2)',
                        }}
                      >
                        <strong>Admin Feedback:</strong> {poll.rejectionReason || 'Does not meet guidelines.'}
                      </div>
                    )}
                    {poll.approvalStatus === 'pending' && (
                      <p style={{ fontSize: '0.8rem', color: '#b45309', marginBottom: 8, fontStyle: 'italic' }}>
                        Submitted on {new Date(poll.createdAt).toLocaleDateString()}. Waiting for administrator approval.
                      </p>
                    )}
                    {poll.description && (
                      <p
                        style={{
                          fontSize: '0.83rem',
                          color: 'var(--text-secondary)',
                          marginBottom: 8,
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {poll.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MdTimer size={13} />
                        {isExpired ? 'Closed' : 'Expires'}: {expiry.toLocaleDateString()} {expiry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/polls/${poll._id}/results`)}
                    >
                      <MdBarChart size={15} /> Results
                    </button>

                    {!isExpired && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/polls/${poll._id}/vote`)}
                      >
                        <MdHowToVote size={15} /> View Poll
                      </button>
                    )}

                    {/* Edit Poll button */}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => openEditModal(poll)}
                      disabled={!canEdit}
                      title={!canEdit ? 'Permission to edit polls revoked by admin' : 'Edit poll details'}
                    >
                      <MdEdit size={14} /> Edit
                    </button>

                    {/* Close Poll button */}
                    {!isExpired && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleClose(poll._id)}
                        disabled={closingId === poll._id || !canPublish}
                        title={!canPublish ? 'Permission to close/publish polls revoked by admin' : 'Close poll'}
                        style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }}
                      >
                        {closingId === poll._id ? (
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                        ) : <MdLock size={14} />}
                        Close
                      </button>
                    )}

                    {/* Delete Poll button */}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(poll._id)}
                      disabled={deletingId === poll._id || !canDelete}
                      title={!canDelete ? 'Permission to delete polls revoked by admin' : 'Permanently delete poll'}
                    >
                      {deletingId === poll._id ? (
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      ) : <MdDelete size={14} />}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creator Edit Poll Modal */}
      {editingPoll && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div className="card animate-fadeIn" style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Edit Poll</h3>
              <button
                type="button"
                onClick={() => setEditingPoll(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveEdit}>
                <div className="form-group">
                  <label className="form-label">Poll Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    required
                    minLength={5}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    className="form-input"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expiry Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={editForm.expiryTime}
                    onChange={(e) => setEditForm({ ...editForm, expiryTime: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditingPoll(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPolls;
