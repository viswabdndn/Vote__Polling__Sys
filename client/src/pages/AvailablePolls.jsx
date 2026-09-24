import { useEffect, useState } from 'react';
import { pollAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PollCard from '../components/PollCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { MdSearch, MdPoll } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const AvailablePolls = () => {
  const { user } = useAuth();
  const isCreator = user?.role === 'creator';
  const [polls, setPolls] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const { data } = await pollAPI.getActive();
        setPolls(data.polls);
        setFiltered(data.polls);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Available Polls</h1>
          <p className="page-subtitle">
            {polls.length} active poll{polls.length !== 1 ? 's' : ''} open for voting
          </p>
        </div>
        {isCreator && (
          <button className="btn btn-primary" onClick={() => navigate('/create-poll')}>
            + Create Poll
          </button>
        )}
      </div>

      {/* Search */}
      <div className="search-bar">
        <MdSearch size={20} className="search-icon" />
        <input
          id="poll-search"
          type="text"
          className="form-input"
          placeholder="Search polls by title, description, or creator..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading polls..." />
      ) : filtered.length === 0 ? (
        <div className="empty-state card card-body">
          <div className="empty-state-icon"><MdPoll size={48} /></div>
          <p className="empty-state-title">
            {search ? 'No polls match your search' : 'No active polls yet'}
          </p>
          <p className="empty-state-desc">
            {search ? 'Try a different search term.' : 'Be the first to create a poll!'}
          </p>
          {!search && isCreator && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/create-poll')}>
              + Create Poll
            </button>
          )}
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((poll) => (
            <PollCard key={poll._id} poll={poll} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailablePolls;
