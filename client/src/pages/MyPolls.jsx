import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pollAPI } from '../services/api';
import { MdBarChart, MdHowToVote, MdLock, MdPerson, MdTimer } from 'react-icons/md';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const MyPolls = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [closingId, setClosingId] = useState(null);
  const navigate = useNavigate();

  const fetchMyPolls = async () => {
    try {
      const { data } = await pollAPI.getMy();
      setPolls(data.polls);
    } catch {
      toast.error('Failed to load your polls.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyPolls(); }, []);

  const handleClose = async (pollId) => {
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

  const now = new Date();
  const activePolls = polls.filter((p) => p.status === 'active' && new Date(p.expiryTime) > now);
  const completedPolls = polls.filter((p) => p.status === 'closed' || new Date(p.expiryTime) <= now);
  const displayed = activeTab === 'active' ? activePolls : completedPolls;

  return (
    <div className="page-container animate-fadeIn">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Polls</h1>
          <p className="page-subtitle">Polls you have created</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/create-poll')}>
          + Create Poll
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active ({activePolls.length})
        </button>
        <button
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({completedPolls.length})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading your polls..." />
      ) : displayed.length === 0 ? (
        <div className="empty-state card card-body">
          <div className="empty-state-icon">🗳️</div>
          <p className="empty-state-title">
            {activeTab === 'active' ? 'No active polls' : 'No completed polls'}
          </p>
          <p className="empty-state-desc">
            {activeTab === 'active' ? 'Create your first poll to get started.' : 'Completed polls will appear here.'}
          </p>
          {activeTab === 'active' && (
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
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <span className={`badge ${isExpired ? 'badge-closed' : 'badge-active'}`}>
                        {isExpired ? 'Closed' : 'Active'}
                      </span>
                      <span className="badge badge-primary">{poll.options?.length || 0} options</span>
                      {typeof poll.totalVotes === 'number' && (
                        <span className="badge badge-accent">{poll.totalVotes} votes</span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {poll.title}
                    </h3>
                    {poll.description && (
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
                    {!isExpired && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleClose(poll._id)}
                        disabled={closingId === poll._id}
                      >
                        {closingId === poll._id ? (
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                        ) : <MdLock size={14} />}
                        Close Poll
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyPolls;
