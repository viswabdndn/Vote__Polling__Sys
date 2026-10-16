import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminAPI, pollAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MdAdminPanelSettings,
  MdPeople,
  MdPoll,
  MdHowToVote,
  MdShield,
  MdRefresh,
  MdSearch,
  MdCheckCircle,
  MdCancel,
  MdDelete,
  MdEdit,
  MdBarChart,
  MdLockOpen,
  MdLock,
  MdHourglassTop,
  MdAdd,
  MdRemove,
  MdInfo,
  MdOutlineAccessTime,
} from 'react-icons/md';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const actionParam = searchParams.get('action');

  const [activeTab, setActiveTab] = useState(
    tabParam && ['approvals', 'creators', 'polls', 'users'].includes(tabParam)
      ? tabParam
      : 'approvals'
  );
  const [stats, setStats] = useState(null);
  const [creators, setCreators] = useState([]);
  const [users, setUsers] = useState([]);
  const [polls, setPolls] = useState([]);
  const [pendingPolls, setPendingPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter States
  const [pendingSearch, setPendingSearch] = useState('');
  const [creatorSearch, setCreatorSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [pollSearch, setPollSearch] = useState('');
  const [pollStatusFilter, setPollStatusFilter] = useState('all');

  // Edit Poll Modal State (for existing polls)
  const [editingPoll, setEditingPoll] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', expiryTime: '', status: 'active' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Review & Approve Modal State (for pending polls)
  const [reviewingPoll, setReviewingPoll] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    title: '',
    description: '',
    expiryTime: '',
    options: ['', ''],
  });
  const [savingApproval, setSavingApproval] = useState(false);

  // Reject Modal State
  const [rejectingPoll, setRejectingPoll] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [savingRejection, setSavingRejection] = useState(false);

  // Create Creator Modal State
  const [showCreateCreatorModal, setShowCreateCreatorModal] = useState(false);
  const [newCreatorForm, setNewCreatorForm] = useState({
    name: '',
    email: '',
    password: '',
    voterId: '',
    canCreatePoll: true,
    canEditPoll: true,
    canPublishPoll: true,
    canDeletePoll: true,
  });
  const [creatingCreator, setCreatingCreator] = useState(false);

  // Sync tab with URL search params (supports deep linking from sidebar)
  useEffect(() => {
    if (tabParam && ['approvals', 'creators', 'polls', 'users'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    if (actionParam === 'new' && tabParam === 'creators') {
      setShowCreateCreatorModal(true);
    }
  }, [tabParam, actionParam]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Load dashboard data
  const fetchData = async () => {
    try {
      const [statsRes, creatorsRes, usersRes, pollsRes, pendingRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getCreators(),
        adminAPI.getUsers(),
        adminAPI.getPolls(),
        adminAPI.getPendingPolls(),
      ]);

      setStats(statsRes.data.stats);
      setCreators(creatorsRes.data.creators);
      setUsers(usersRes.data.users);
      setPolls(pollsRes.data.polls);
      setPendingPolls(pendingRes.data.polls || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch admin data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- Approval Queue Actions ---
  const handleQuickApprove = async (poll) => {
    try {
      const { data } = await adminAPI.approvePoll(poll._id);
      toast.success(data.message || `Poll "${poll.title}" approved and live!`);
      setPendingPolls((prev) => prev.filter((p) => p._id !== poll._id));
      if (stats) {
        setStats((prev) => ({
          ...prev,
          pendingApprovals: Math.max(0, (prev?.pendingApprovals || 1) - 1),
          activePolls: (prev?.activePolls || 0) + 1,
        }));
      }
      // Re-fetch all polls to sync state
      const pollsRes = await adminAPI.getPolls();
      setPolls(pollsRes.data.polls);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve poll.');
    }
  };

  const openReviewModal = (poll) => {
    setReviewingPoll(poll);
    setReviewForm({
      title: poll.title,
      description: poll.description || '',
      expiryTime: new Date(poll.expiryTime).toISOString().slice(0, 16),
      options: poll.options?.map((o) => (typeof o === 'string' ? o : o.text)) || ['', ''],
    });
  };

  const handleOptionChange = (index, value) => {
    setReviewForm((prev) => {
      const next = [...prev.options];
      next[index] = value;
      return { ...prev, options: next };
    });
  };

  const handleAddOption = () => {
    if (reviewForm.options.length >= 8) {
      toast.error('Maximum 8 options allowed.');
      return;
    }
    setReviewForm((prev) => ({ ...prev, options: [...prev.options, ''] }));
  };

  const handleRemoveOption = (index) => {
    if (reviewForm.options.length <= 2) {
      toast.error('Poll must have at least 2 options.');
      return;
    }
    setReviewForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSaveReviewAndApprove = async (e) => {
    e.preventDefault();
    if (!reviewingPoll) return;

    const validOptions = reviewForm.options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      toast.error('Please specify at least 2 valid options.');
      return;
    }

    setSavingApproval(true);
    try {
      const { data } = await adminAPI.approvePoll(reviewingPoll._id, {
        title: reviewForm.title,
        description: reviewForm.description,
        expiryTime: new Date(reviewForm.expiryTime).toISOString(),
        options: validOptions,
      });

      toast.success(data.message || 'Poll modified and approved successfully!');
      setPendingPolls((prev) => prev.filter((p) => p._id !== reviewingPoll._id));
      setReviewingPoll(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve poll.');
    } finally {
      setSavingApproval(false);
    }
  };

  const openRejectModal = (poll) => {
    setRejectingPoll(poll);
    setRejectionReason('');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingPoll) return;

    setSavingRejection(true);
    try {
      const { data } = await adminAPI.rejectPoll(rejectingPoll._id, rejectionReason);
      toast.success(data.message || 'Poll rejected.');
      setPendingPolls((prev) => prev.filter((p) => p._id !== rejectingPoll._id));
      setRejectingPoll(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject poll.');
    } finally {
      setSavingRejection(false);
    }
  };

  // --- Creator Actions ---
  const handleToggleCreatorStatus = async (creator) => {
    const nextStatus = !creator.isActive;
    const actionLabel = nextStatus ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${creator.name}'s creator account?`)) {
      return;
    }

    try {
      const { data } = await adminAPI.updateCreatorStatus(creator._id, nextStatus);
      toast.success(data.message);
      setCreators((prev) =>
        prev.map((c) => (c._id === creator._id ? { ...c, isActive: nextStatus } : c))
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === creator._id ? { ...u, isActive: nextStatus } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionLabel} creator.`);
    }
  };

  const handleTogglePermission = async (creator, permissionKey) => {
    const currentPerm = creator.creatorPermissions?.[permissionKey] ?? true;
    const nextPerm = !currentPerm;

    const updatedPerms = {
      ...creator.creatorPermissions,
      [permissionKey]: nextPerm,
    };

    try {
      await adminAPI.updateCreatorPermissions(creator._id, updatedPerms);
      toast.success(
        `${permissionKey} ${nextPerm ? 'granted' : 'revoked'} for ${creator.name}.`
      );
      setCreators((prev) =>
        prev.map((c) =>
          c._id === creator._id
            ? { ...c, creatorPermissions: updatedPerms }
            : c
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update creator permission.');
    }
  };

  const handleCreateCreator = async (e) => {
    e.preventDefault();
    if (!newCreatorForm.name.trim() || !newCreatorForm.email.trim() || !newCreatorForm.password) {
      toast.error('Name, email, and password are required.');
      return;
    }
    if (newCreatorForm.password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    setCreatingCreator(true);
    try {
      const { data } = await adminAPI.createCreator(newCreatorForm);
      toast.success(data.message || 'Creator created successfully!');
      setShowCreateCreatorModal(false);
      setNewCreatorForm({
        name: '',
        email: '',
        password: '',
        voterId: '',
        canCreatePoll: true,
        canEditPoll: true,
        canPublishPoll: true,
        canDeletePoll: true,
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create creator account.');
    } finally {
      setCreatingCreator(false);
    }
  };

  const handleDeleteCreator = async (creator) => {
    if (
      !window.confirm(
        `⚠️ DANGER: Are you sure you want to completely remove Creator '${creator.name}'?\n\nThis will remove their account and all associated polls and votes.`
      )
    ) {
      return;
    }

    try {
      const { data } = await adminAPI.deleteCreator(creator._id);
      toast.success(data.message);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete creator.');
    }
  };

  // --- User Actions ---
  const handleToggleUserStatus = async (targetUser) => {
    const nextStatus = !targetUser.isActive;
    try {
      const { data } = await adminAPI.updateUserStatus(targetUser._id, nextStatus);
      toast.success(data.message);
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, isActive: nextStatus } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleChangeUserRole = async (targetUser, newRole) => {
    try {
      const { data } = await adminAPI.updateUserRole(targetUser._id, newRole);
      toast.success(data.message);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change user role.');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Delete account for '${targetUser.name}'? This cannot be undone.`)) {
      return;
    }
    try {
      const { data } = await adminAPI.deleteUser(targetUser._id);
      toast.success(data.message);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  // --- Poll Actions ---
  const handleTogglePollStatus = async (pollId) => {
    try {
      const { data } = await pollAPI.toggleStatus(pollId);
      toast.success(data.message);
      setPolls((prev) =>
        prev.map((p) => (p._id === pollId ? { ...p, status: data.poll.status } : p))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update poll status.');
    }
  };

  const handleDeletePoll = async (poll) => {
    if (!window.confirm(`Are you sure you want to delete poll: "${poll.title}"?`)) {
      return;
    }
    try {
      const { data } = await adminAPI.deletePoll(poll._id);
      toast.success(data.message);
      setPolls((prev) => prev.filter((p) => p._id !== poll._id));
      if (stats) setStats({ ...stats, totalPolls: Math.max(0, stats.totalPolls - 1) });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete poll.');
    }
  };

  const openEditModal = (poll) => {
    setEditingPoll(poll);
    setEditForm({
      title: poll.title,
      description: poll.description || '',
      expiryTime: new Date(poll.expiryTime).toISOString().slice(0, 16),
      status: poll.status || 'active',
    });
  };

  const handleSavePollEdit = async (e) => {
    e.preventDefault();
    if (!editingPoll) return;
    setSavingEdit(true);
    try {
      const { data } = await pollAPI.update(editingPoll._id, {
        title: editForm.title,
        description: editForm.description,
        expiryTime: new Date(editForm.expiryTime).toISOString(),
        status: editForm.status,
      });
      toast.success(data.message || 'Poll updated successfully.');
      setPolls((prev) =>
        prev.map((p) => (p._id === editingPoll._id ? { ...p, ...data.poll } : p))
      );
      setEditingPoll(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update poll.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Filters
  const filteredPendingPolls = pendingPolls.filter((p) => {
    const q = pendingSearch.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.createdBy?.name?.toLowerCase().includes(q) ||
      p.createdBy?.email?.toLowerCase().includes(q)
    );
  });

  const filteredCreators = creators.filter((c) => {
    const q = creatorSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.voterId?.toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.voterId?.toLowerCase().includes(q);
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredPolls = polls.filter((p) => {
    const q = pollSearch.toLowerCase();
    const matchesSearch =
      p.title?.toLowerCase().includes(q) ||
      p.createdBy?.name?.toLowerCase().includes(q) ||
      p.createdBy?.email?.toLowerCase().includes(q);

    const now = new Date();
    const isAct = p.approvalStatus === 'approved' && p.status === 'active' && new Date(p.expiryTime) > now;
    const isPending = p.approvalStatus === 'pending';
    const isRejected = p.approvalStatus === 'rejected';
    const isClosed = p.approvalStatus === 'approved' && (p.status === 'closed' || new Date(p.expiryTime) <= now);

    let matchesStatus = true;
    if (pollStatusFilter === 'active') matchesStatus = isAct;
    else if (pollStatusFilter === 'pending') matchesStatus = isPending;
    else if (pollStatusFilter === 'rejected') matchesStatus = isRejected;
    else if (pollStatusFilter === 'closed') matchesStatus = isClosed;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSpinner size="lg" text="Loading Admin Control Center..." />
      </div>
    );
  }

  return (
    <div className="page-container animate-fadeIn">
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '28px 32px',
          color: '#fff',
          marginBottom: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 10px 30px rgba(15,23,42,0.25)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
            }}
          >
            <MdAdminPanelSettings size={34} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Admin Control Center
              </h1>
              <span
                style={{
                  background: 'rgba(239,68,68,0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.4)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                RBAC & Approval Gate Enforced
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: 4, margin: 0 }}>
              Review & approve creator poll requests, oversee users, and manage granular permissions.
            </p>
          </div>
        </div>

        <button
          className="btn btn-ghost btn-sm"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
        >
          <MdRefresh size={18} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 28 }}>
        {/* Pending Approvals Card */}
        <div
          className="stat-card"
          onClick={() => setActiveTab('approvals')}
          style={{
            cursor: 'pointer',
            border: pendingPolls.length > 0 ? '1.5px solid rgba(245, 158, 11, 0.6)' : undefined,
            background: pendingPolls.length > 0 ? 'rgba(245, 158, 11, 0.05)' : undefined,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
        >
          <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <MdHourglassTop size={22} />
          </div>
          <div className="stat-card-value" style={{ color: pendingPolls.length > 0 ? '#d97706' : undefined }}>
            {pendingPolls.length}
          </div>
          <div className="stat-card-label" style={{ fontWeight: 600 }}>
            Pending Approvals {pendingPolls.length > 0 && '⚡ Action Required'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <MdShield size={22} />
          </div>
          <div className="stat-card-value">{stats?.totalCreators || 0}</div>
          <div className="stat-card-label">Poll Creators</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <MdPeople size={22} />
          </div>
          <div className="stat-card-value">{stats?.totalParticipants || 0}</div>
          <div className="stat-card-label">Participants</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <MdPoll size={22} />
          </div>
          <div className="stat-card-value">{stats?.totalPolls || 0}</div>
          <div className="stat-card-label">Total Polls ({stats?.activePolls || 0} active)</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
            <MdHowToVote size={22} />
          </div>
          <div className="stat-card-value">{stats?.totalVotes || 0}</div>
          <div className="stat-card-label">Total Votes Cast</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        <button
          className={`tab ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => handleTabChange('approvals')}
          style={{ position: 'relative' }}
        >
          ⏳ Approval Requests
          {pendingPolls.length > 0 && (
            <span
              style={{
                marginLeft: 8,
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 10,
              }}
            >
              {pendingPolls.length}
            </span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'creators' ? 'active' : ''}`}
          onClick={() => handleTabChange('creators')}
        >
          👑 Creator Management ({creators.length})
        </button>
        <button
          className={`tab ${activeTab === 'polls' ? 'active' : ''}`}
          onClick={() => handleTabChange('polls')}
        >
          🗳️ All Polls ({polls.length})
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => handleTabChange('users')}
        >
          👥 User Directory ({users.length})
        </button>
      </div>

      {/* ================= SECTION 0: POLL APPROVAL REQUESTS ================= */}
      {activeTab === 'approvals' && (
        <div className="animate-fadeIn">
          {/* Section Toolbar */}
          <div
            className="card"
            style={{
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Pending Creator Poll Submissions ({pendingPolls.length})
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Creator polls require Admin verification before going live. Review choices, modify details, or approve/reject below.
              </p>
            </div>

            <div style={{ position: 'relative', minWidth: 260 }}>
              <MdSearch
                size={18}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search pending polls or creators..."
                className="form-input"
                style={{ paddingLeft: 38, paddingBottom: 8, paddingTop: 8, fontSize: '0.85rem' }}
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
              />
            </div>
          </div>

          {filteredPendingPolls.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                background: 'var(--surface)',
                border: '1.5px dashed var(--border)',
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <MdCheckCircle size={38} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                All Caught Up!
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 440, margin: '0 auto 18px' }}>
                {pendingSearch
                  ? 'No pending approval requests match your search criteria.'
                  : 'There are currently no polls awaiting administrative review. New polls submitted by Creators will appear here.'}
              </p>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setActiveTab('polls')}
              >
                View Live System Polls
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {filteredPendingPolls.map((poll) => {
                const creatorName = poll.createdBy?.name || 'Creator';
                const creatorEmail = poll.createdBy?.email || 'N/A';
                const optionsCount = poll.options?.length || 0;
                const submittedDate = new Date(poll.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const expiryDate = new Date(poll.expiryTime).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={poll._id}
                    className="card animate-fadeIn"
                    style={{
                      border: '1.5px solid rgba(245, 158, 11, 0.3)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div className="card-body" style={{ padding: 24 }}>
                      {/* Top Header of the Pending Card */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: 16,
                          marginBottom: 16,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 260 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span
                              style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#d97706',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                padding: '3px 10px',
                                borderRadius: 12,
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <MdHourglassTop size={13} />
                              Awaiting Admin Review
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Submitted {submittedDate}
                            </span>
                          </div>

                          <h3
                            style={{
                              fontSize: '1.25rem',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              margin: '0 0 6px 0',
                              lineHeight: 1.35,
                            }}
                          >
                            {poll.title}
                          </h3>

                          {poll.description && (
                            <p
                              style={{
                                fontSize: '0.88rem',
                                color: 'var(--text-secondary)',
                                margin: '0 0 10px 0',
                                background: 'var(--bg)',
                                padding: '10px 14px',
                                borderRadius: 'var(--border-radius-sm)',
                                borderLeft: '3px solid var(--accent)',
                              }}
                            >
                              {poll.description}
                            </p>
                          )}
                        </div>

                        {/* Creator Info Box */}
                        <div
                          style={{
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--border-radius)',
                            padding: '12px 16px',
                            minWidth: 220,
                          }}
                        >
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
                            Submitted by Creator
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent), var(--primary))',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                              }}
                            >
                              {creatorName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                {creatorName}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                {creatorEmail}
                              </div>
                              {poll.createdBy?.voterId && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                                  ID: {poll.createdBy.voterId}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Options Preview */}
                      <div style={{ marginBottom: 20 }}>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            marginBottom: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <MdPoll size={16} />
                          Proposed Voting Options ({optionsCount})
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: 10,
                          }}
                        >
                          {poll.options?.map((opt, idx) => (
                            <div
                              key={opt._id || idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                padding: '10px 14px',
                                fontSize: '0.86rem',
                                color: 'var(--text-primary)',
                              }}
                            >
                              <span
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  background: 'var(--surface)',
                                  border: '1px solid var(--border)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  color: 'var(--text-muted)',
                                  flexShrink: 0,
                                }}
                              >
                                {idx + 1}
                              </span>
                              <span style={{ fontWeight: 500 }}>
                                {typeof opt === 'string' ? opt : opt.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Timeline & Actions Bar */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 12,
                          paddingTop: 16,
                          borderTop: '1px solid var(--border-light)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          <MdOutlineAccessTime size={16} />
                          <span>
                            Voting Expiry Scheduled: <strong>{expiryDate}</strong>
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
                            onClick={() => openRejectModal(poll)}
                          >
                            <MdCancel size={15} /> Reject
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openReviewModal(poll)}
                          >
                            <MdEdit size={15} /> Edit & Approve
                          </button>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
                            onClick={() => handleQuickApprove(poll)}
                          >
                            <MdCheckCircle size={16} /> Approve & Publish
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION 1: CREATOR MANAGEMENT ================= */}
      {activeTab === 'creators' && (
        <div className="card animate-fadeIn">
          <div
            className="card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Creator Accounts & Permissions Matrix
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Admin grants or revokes permissions for each creator. Changes take effect immediately.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: 240 }}>
                <MdSearch
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search creator name or email..."
                  className="form-input"
                  style={{ paddingLeft: 38, paddingBottom: 8, paddingTop: 8, fontSize: '0.85rem' }}
                  value={creatorSearch}
                  onChange={(e) => setCreatorSearch(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowCreateCreatorModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <MdAdd size={16} /> Add Creator
              </button>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            {filteredCreators.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No creator accounts found matching search.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1.5px solid var(--border)' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>Creator</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Status</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Create Poll</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Poll</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Close/Publish</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Delete Poll</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Polls</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCreators.map((creator) => {
                    const perms = creator.creatorPermissions || {};
                    const canCreate = perms.canCreatePoll !== false;
                    const canEdit = perms.canEditPoll !== false;
                    const canPublish = perms.canPublishPoll !== false;
                    const canDelete = perms.canDeletePoll !== false;

                    return (
                      <tr
                        key={creator._id}
                        style={{
                          borderBottom: '1px solid var(--border-light)',
                          background: creator.isActive ? 'transparent' : 'rgba(220, 38, 38, 0.03)',
                          transition: 'background 0.2s',
                        }}
                      >
                        {/* Creator Info */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                background: creator.isActive
                                  ? 'linear-gradient(135deg, var(--primary-light), var(--primary))'
                                  : '#94a3b8',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                              }}
                            >
                              {creator.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                {creator.name}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {creator.email}
                              </div>
                              {creator.voterId && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                                  ID: {creator.voterId}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td style={{ padding: '16px 16px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleCreatorStatus(creator)}
                            style={{
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                            title={`Click to ${creator.isActive ? 'deactivate' : 'activate'}`}
                          >
                            <span
                              className={`badge ${creator.isActive ? 'badge-active' : 'badge-closed'}`}
                              style={{
                                fontSize: '0.75rem',
                                padding: '4px 10px',
                                ...(creator.isActive
                                  ? {}
                                  : { background: 'rgba(220,38,38,0.1)', color: 'var(--error)' }),
                              }}
                            >
                              {creator.isActive ? <MdCheckCircle size={14} /> : <MdCancel size={14} />}
                              {creator.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </button>
                        </td>

                        {/* Permission Toggles */}
                        <td style={{ padding: '16px 16px' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(creator, 'canCreatePoll')}
                            className={`btn btn-sm ${canCreate ? 'btn-ghost' : 'btn-outline'}`}
                            style={{
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              borderColor: canCreate ? 'var(--success)' : 'var(--error)',
                              color: canCreate ? 'var(--success)' : 'var(--error)',
                              background: canCreate ? 'var(--success-bg)' : 'var(--error-bg)',
                            }}
                            title="Click to toggle create permission"
                          >
                            {canCreate ? '✅ Allowed' : '⛔ Revoked'}
                          </button>
                        </td>

                        <td style={{ padding: '16px 16px' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(creator, 'canEditPoll')}
                            className={`btn btn-sm ${canEdit ? 'btn-ghost' : 'btn-outline'}`}
                            style={{
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              borderColor: canEdit ? 'var(--success)' : 'var(--error)',
                              color: canEdit ? 'var(--success)' : 'var(--error)',
                              background: canEdit ? 'var(--success-bg)' : 'var(--error-bg)',
                            }}
                            title="Click to toggle edit permission"
                          >
                            {canEdit ? '✅ Allowed' : '⛔ Revoked'}
                          </button>
                        </td>

                        <td style={{ padding: '16px 16px' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(creator, 'canPublishPoll')}
                            className={`btn btn-sm ${canPublish ? 'btn-ghost' : 'btn-outline'}`}
                            style={{
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              borderColor: canPublish ? 'var(--success)' : 'var(--error)',
                              color: canPublish ? 'var(--success)' : 'var(--error)',
                              background: canPublish ? 'var(--success-bg)' : 'var(--error-bg)',
                            }}
                            title="Click to toggle publish/close permission"
                          >
                            {canPublish ? '✅ Allowed' : '⛔ Revoked'}
                          </button>
                        </td>

                        <td style={{ padding: '16px 16px' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(creator, 'canDeletePoll')}
                            className={`btn btn-sm ${canDelete ? 'btn-ghost' : 'btn-outline'}`}
                            style={{
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              borderColor: canDelete ? 'var(--success)' : 'var(--error)',
                              color: canDelete ? 'var(--success)' : 'var(--error)',
                              background: canDelete ? 'var(--success-bg)' : 'var(--error-bg)',
                            }}
                            title="Click to toggle delete permission"
                          >
                            {canDelete ? '✅ Allowed' : '⛔ Revoked'}
                          </button>
                        </td>

                        {/* Polls count */}
                        <td style={{ padding: '16px 16px' }}>
                          <span className="badge badge-primary">
                            {creator.stats?.totalPolls || 0} polls
                          </span>
                        </td>

                        {/* Remove Creator */}
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteCreator(creator)}
                            title="Remove creator account and clean up polls"
                          >
                            <MdDelete size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ================= SECTION 2: ALL POLLS MANAGEMENT ================= */}
      {activeTab === 'polls' && (
        <div className="card animate-fadeIn">
          <div
            className="card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                System-Wide Polls Management
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Administrators can review approval statuses, edit details, and manage polls across all creators.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select
                className="form-input"
                style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
                value={pollStatusFilter}
                onChange={(e) => setPollStatusFilter(e.target.value)}
              >
                <option value="all">All Polls</option>
                <option value="pending">⏳ Pending Approval</option>
                <option value="active">🟢 Active / Approved</option>
                <option value="rejected">❌ Rejected</option>
                <option value="closed">Closed / Expired</option>
              </select>

              <div style={{ position: 'relative', minWidth: 240 }}>
                <MdSearch
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search polls or creator..."
                  className="form-input"
                  style={{ paddingLeft: 38, paddingBottom: 8, paddingTop: 8, fontSize: '0.85rem' }}
                  value={pollSearch}
                  onChange={(e) => setPollSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            {filteredPolls.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No polls found matching criteria.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1.5px solid var(--border)' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>Poll Details</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Creator</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Approval Status</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Votes</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Expiry</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPolls.map((poll) => {
                    const now = new Date();
                    const isPending = poll.approvalStatus === 'pending';
                    const isRejected = poll.approvalStatus === 'rejected';
                    const isClosed = poll.status === 'closed' || new Date(poll.expiryTime) <= now;

                    return (
                      <tr key={poll._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '16px 20px', maxWidth: 320 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                            {poll.title}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {poll.options?.length || 0} options
                          </div>
                        </td>

                        <td style={{ padding: '16px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {poll.createdBy?.name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {poll.createdBy?.email}
                          </div>
                        </td>

                        <td style={{ padding: '16px 16px' }}>
                          {isPending ? (
                            <span
                              className="badge"
                              style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#d97706',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                fontSize: '0.74rem',
                              }}
                            >
                              ⏳ Pending Review
                            </span>
                          ) : isRejected ? (
                            <span
                              className="badge"
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                fontSize: '0.74rem',
                              }}
                            >
                              ❌ Rejected
                            </span>
                          ) : (
                            <span className={`badge ${isClosed ? 'badge-closed' : 'badge-active'}`}>
                              {isClosed ? 'Closed' : '🟢 Approved & Active'}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '16px 16px' }}>
                          <span className="badge badge-accent">
                            {poll.totalVotes || 0} votes
                          </span>
                        </td>

                        <td style={{ padding: '16px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(poll.expiryTime).toLocaleDateString()}
                        </td>

                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {isPending ? (
                              <>
                                <button
                                  className="btn btn-sm"
                                  style={{ background: 'var(--success)', color: '#fff', padding: '4px 8px', fontSize: '0.75rem' }}
                                  onClick={() => handleQuickApprove(poll)}
                                  title="Approve immediately"
                                >
                                  <MdCheckCircle size={14} /> Approve
                                </button>
                                <button
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                  onClick={() => openReviewModal(poll)}
                                  title="Review & edit options"
                                >
                                  <MdEdit size={14} /> Review
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => navigate(`/polls/${poll._id}/results`)}
                                  title="View results"
                                >
                                  <MdBarChart size={15} /> Results
                                </button>

                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={() => openEditModal(poll)}
                                  title="Edit poll details"
                                >
                                  <MdEdit size={14} /> Edit
                                </button>

                                <button
                                  className={`btn btn-sm ${isClosed ? 'btn-ghost' : 'btn-ghost'}`}
                                  onClick={() => handleTogglePollStatus(poll._id)}
                                  title={isClosed ? 'Reopen poll' : 'Close poll'}
                                  style={{
                                    color: isClosed ? 'var(--success)' : 'var(--warning)',
                                    borderColor: isClosed ? 'var(--success)' : 'var(--warning)',
                                  }}
                                >
                                  {isClosed ? <MdLockOpen size={14} /> : <MdLock size={14} />}
                                  {isClosed ? 'Reopen' : 'Close'}
                                </button>
                              </>
                            )}

                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeletePoll(poll)}
                              title="Delete poll"
                            >
                              <MdDelete size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ================= SECTION 3: USER DIRECTORY ================= */}
      {activeTab === 'users' && (
        <div className="card animate-fadeIn">
          <div
            className="card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                User Directory & Role Administration
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                View all registered accounts, promote/demote roles, or toggle user activation.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select
                className="form-input"
                style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="creator">Creators Only</option>
                <option value="participant">Participants Only</option>
                <option value="admin">Admins Only</option>
              </select>

              <div style={{ position: 'relative', minWidth: 240 }}>
                <MdSearch
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="form-input"
                  style={{ paddingLeft: 38, paddingBottom: 8, paddingTop: 8, fontSize: '0.85rem' }}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            {filteredUsers.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No users found matching search.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1.5px solid var(--border)' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>User</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Role</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Status</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Joined</th>
                    <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isSelf = u._id === user?._id;

                    return (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {u.name} {isSelf && <span style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>(You)</span>}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {u.email}
                          </div>
                          {u.voterId && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                              ID: {u.voterId}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '16px 16px' }}>
                          {isSelf ? (
                            <span className="badge badge-closed" style={{ background: 'rgba(220,38,38,0.12)', color: 'var(--error)' }}>
                              🛡️ Admin
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeUserRole(u, e.target.value)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                border: '1px solid var(--border)',
                                fontSize: '0.82rem',
                                background: 'var(--surface)',
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                              }}
                            >
                              <option value="participant">🎓 Participant</option>
                              <option value="creator">👑 Creator</option>
                              <option value="admin">🛡️ Admin</option>
                            </select>
                          )}
                        </td>

                        <td style={{ padding: '16px 16px' }}>
                          {isSelf ? (
                            <span className="badge badge-active">Active</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                            >
                              <span
                                className={`badge ${u.isActive ? 'badge-active' : 'badge-closed'}`}
                                style={u.isActive ? {} : { background: 'rgba(220,38,38,0.1)', color: 'var(--error)' }}
                              >
                                {u.isActive ? 'Active' : 'Deactivated'}
                              </span>
                            </button>
                          )}
                        </td>

                        <td style={{ padding: '16px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          {!isSelf && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteUser(u)}
                              title="Delete user"
                            >
                              <MdDelete size={14} /> Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: REVIEW & EDIT PENDING POLL ================= */}
      {reviewingPoll && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div className="card animate-fadeIn" style={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  Review & Approve Poll with Modifications
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Creator: {reviewingPoll.createdBy?.name} ({reviewingPoll.createdBy?.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingPoll(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div className="card-body">
              <form onSubmit={handleSaveReviewAndApprove}>
                <div className="form-group">
                  <label className="form-label">Poll Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    required
                    minLength={5}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Instructions</label>
                  <textarea
                    className="form-input"
                    value={reviewForm.description}
                    onChange={(e) => setReviewForm({ ...reviewForm, description: e.target.value })}
                    rows={3}
                    placeholder="Optional background info or guidelines for voters"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Voting Expiry Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={reviewForm.expiryTime}
                    onChange={(e) => setReviewForm({ ...reviewForm, expiryTime: e.target.value })}
                    required
                  />
                </div>

                {/* Options List */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Voting Options ({reviewForm.options.length})
                    </label>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 8px', fontSize: '0.78rem' }}
                      onClick={handleAddOption}
                    >
                      <MdAdd size={14} /> Add Option
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {reviewForm.options.map((optionText, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          className="form-input"
                          value={optionText}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Option ${idx + 1} text`}
                          required
                          style={{ flex: 1 }}
                        />
                        {reviewForm.options.length > 2 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--error)', padding: '6px' }}
                            onClick={() => handleRemoveOption(idx)}
                            title="Remove option"
                          >
                            <MdRemove size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setReviewingPoll(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
                    disabled={savingApproval}
                  >
                    {savingApproval ? 'Approving...' : 'Approve & Publish Poll'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REJECT POLL ================= */}
      {rejectingPoll && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div className="card animate-fadeIn" style={{ maxWidth: 480, width: '100%' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--error)' }}>
                Reject Poll Submission
              </h3>
              <button
                type="button"
                onClick={() => setRejectingPoll(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div className="card-body">
              <form onSubmit={handleConfirmReject}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  You are rejecting: <strong>"{rejectingPoll.title}"</strong> proposed by{' '}
                  <strong>{rejectingPoll.createdBy?.name || 'Creator'}</strong>.
                </p>

                <div className="form-group">
                  <label className="form-label">Reason for Rejection (Visible to Creator)</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="e.g. Duplicate topic, inappropriate language, or please revise the options..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setRejectingPoll(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={savingRejection}
                  >
                    {savingRejection ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT ACTIVE/CLOSED POLL ================= */}
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
          <div className="card animate-fadeIn" style={{ maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Edit Poll (Admin Override)</h3>
              <button
                type="button"
                onClick={() => setEditingPoll(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSavePollEdit}>
                <div className="form-group">
                  <label className="form-label">Poll Title</label>
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
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expiry Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={editForm.expiryTime}
                    onChange={(e) => setEditForm({ ...editForm, expiryTime: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
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

      {/* ================= MODAL: CREATE CREATOR ================= */}
      {showCreateCreatorModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div className="card animate-fadeIn" style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MdShield size={20} color="var(--primary)" /> Add New Creator Account
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateCreatorModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div className="card-body">
              <form onSubmit={handleCreateCreator}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dr. Jane Smith"
                    value={newCreatorForm.name}
                    onChange={(e) => setNewCreatorForm({ ...newCreatorForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. janesmith@university.edu"
                    value={newCreatorForm.email}
                    onChange={(e) => setNewCreatorForm({ ...newCreatorForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Min 8 chars with uppercase, lowercase, & number"
                    value={newCreatorForm.password}
                    onChange={(e) => setNewCreatorForm({ ...newCreatorForm, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Must be at least 8 characters (including uppercase, lowercase, and a digit).
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Staff / Employee ID (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. CR9021"
                    value={newCreatorForm.voterId}
                    onChange={(e) => setNewCreatorForm({ ...newCreatorForm, voterId: e.target.value })}
                  />
                </div>

                <div style={{ marginTop: 18, marginBottom: 8 }}>
                  <label className="form-label" style={{ marginBottom: 10 }}>Initial Creator Permissions</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newCreatorForm.canCreatePoll}
                        onChange={(e) => setNewCreatorForm({ ...newCreatorForm, canCreatePoll: e.target.checked })}
                      />
                      <span>Create Polls</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newCreatorForm.canEditPoll}
                        onChange={(e) => setNewCreatorForm({ ...newCreatorForm, canEditPoll: e.target.checked })}
                      />
                      <span>Edit Polls</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newCreatorForm.canPublishPoll}
                        onChange={(e) => setNewCreatorForm({ ...newCreatorForm, canPublishPoll: e.target.checked })}
                      />
                      <span>Publish / Close</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newCreatorForm.canDeletePoll}
                        onChange={(e) => setNewCreatorForm({ ...newCreatorForm, canDeletePoll: e.target.checked })}
                      />
                      <span>Delete Polls</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowCreateCreatorModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creatingCreator}
                  >
                    {creatingCreator ? 'Creating...' : 'Create Creator Account'}
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

export default AdminDashboard;
