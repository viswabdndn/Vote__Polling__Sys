import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pollAPI } from '../services/api';
import { MdSearch, MdBarChart, MdEmojiEvents, MdPerson, MdTimer } from 'react-icons/md';
import LoadingSpinner from '../components/LoadingSpinner';

const PollHistory = () => {
  const [polls, setPolls] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArchive = async () => {
      try {
        const { data } = await pollAPI.getArchive();
        setPolls(data.polls);
        setFiltered(data.polls);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchArchive();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      polls.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.createdBy?.name || '').toLowerCase().includes(q)
      )
    );
  }, [search, polls]);

  return (
    <div className="page-container animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Poll History</h1>
        <p className="page-subtitle">Archived and closed polls with final results</p>
      </div>

      <div className="search-bar">
        <MdSearch size={20} className="search-icon" />
        <input
          id="history-search"
          type="text"
          className="form-input"
          placeholder="Search archived polls..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading history..." />
      ) : filtered.length === 0 ? (
        <div className="empty-state card card-body">
          <div className="empty-state-icon">📜</div>
          <p className="empty-state-title">
            {search ? 'No archived polls match your search' : 'No archived polls yet'}
          </p>
          <p className="empty-state-desc">
            {search ? 'Try a different search term.' : 'Completed polls will appear here once they expire or are closed.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((poll) => {
            const closedDate = new Date(poll.expiryTime);
            const winner = poll.options?.reduce((prev, curr) =>
              (curr.voteCount > (prev?.voteCount || 0)) ? curr : prev, null
            );

            return (
              <div key={poll._id} className="card animate-fadeIn">
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                      <span className="badge badge-closed">Closed</span>
                      {poll.totalVotes > 0 && (
                        <span className="badge badge-primary">{poll.totalVotes} votes</span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                      {poll.title}
                    </h3>
                    {poll.description && (
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {poll.description}
                      </p>
                    )}

                    {/* Winner */}
                    {winner && winner.voteCount > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <MdEmojiEvents size={16} color="#fbbf24" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Winner: {winner.text}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          ({winner.voteCount} votes)
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 14, fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MdPerson size={13} /> {poll.createdBy?.name || 'Unknown'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MdTimer size={13} /> Closed: {closedDate.toLocaleDateString()} {closedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/polls/${poll._id}/results`)}
                    style={{ flexShrink: 0 }}
                  >
                    <MdBarChart size={15} /> View Results
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PollHistory;
