import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { voteAPI, pollAPI } from '../services/api';
import ResultChart from '../components/ResultChart';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  MdBarChart, MdHowToVote, MdTimer, MdPerson, MdEmojiEvents,
  MdLock, MdSignalWifi4Bar, MdShare,
} from 'react-icons/md';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

const PollResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState({ options: [], totalVotes: 0, winner: null });
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/polls/${id}/vote`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Poll link copied to clipboard! 📋');
  };

  const fetchResults = useCallback(async () => {
    try {
      const { data } = await voteAPI.getResults(id);
      setPoll(data.poll);
      setResults({ options: data.options, totalVotes: data.totalVotes, winner: data.winner });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load results.');
      navigate('/polls');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResults();

    // Socket.IO — join poll room for live updates
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('joinPoll', id);
    });

    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('voteUpdated', (data) => {
      if (data.pollId === id) {
        setResults({ options: data.options, totalVotes: data.totalVotes, winner: data.winner });
        toast.success('Results updated!', { duration: 2000, icon: '📊' });
      }
    });

    return () => {
      socket.emit('leavePoll', id);
      socket.disconnect();
    };
  }, [id, fetchResults]);

  if (loading) return (
    <div className="page-container">
      <LoadingSpinner size="lg" text="Loading results..." />
    </div>
  );

  if (!poll) return null;

  const isExpired = poll.effectiveStatus === 'closed' || poll.status === 'closed' || new Date(poll.expiryTime) <= new Date();
  const expiryDate = new Date(poll.expiryTime);

  return (
    <div className="page-container animate-fadeIn">
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        ← Back
      </button>

      <div style={{ maxWidth: 760 }}>
        {/* Header */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`badge ${isExpired ? 'badge-closed' : 'badge-active'}`}>
                  {isExpired ? <MdLock size={11} /> : <span className="live-dot" />}
                  {isExpired ? 'Closed' : 'Active'}
                </span>
                {!isExpired && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: socketConnected ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                    <MdSignalWifi4Bar size={14} />
                    {socketConnected ? 'Live' : 'Connecting...'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={handleCopyLink} title="Share Poll Link">
                  <MdShare size={15} /> Share
                </button>
                {!isExpired && (
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/polls/${id}/vote`)}>
                    <MdHowToVote size={15} /> Vote
                  </button>
                )}
              </div>
            </div>

            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
              {poll.title}
            </h1>

            {poll.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 12 }}>
                {poll.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MdPerson size={14} /> {poll.createdBy?.name || 'Unknown'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MdTimer size={14} />
                {isExpired ? 'Closed on' : 'Closes'}: {expiryDate.toLocaleDateString()} {expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MdHowToVote size={14} />
                <strong style={{ color: 'var(--text-primary)' }}>{results.totalVotes}</strong>&nbsp;total votes
              </span>
            </div>
          </div>
        </div>

        {/* Winner Banner */}
        {results.winner && results.totalVotes > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
            borderRadius: 'var(--border-radius)',
            padding: '20px 24px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            color: '#fff',
          }}>
            <MdEmojiEvents size={40} style={{ flexShrink: 0, color: '#fbbf24' }} />
            <div>
              <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: 2, fontWeight: 500 }}>
                {isExpired ? 'Final Winner' : 'Currently Leading'}
              </p>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 2 }}>
                🏆 {results.winner.text}
              </p>
              <p style={{ fontSize: '0.82rem', opacity: 0.8 }}>
                {results.winner.voteCount} votes · {results.winner.percentage}%
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MdBarChart size={18} color="var(--accent)" /> Vote Distribution
            </h2>
          </div>
          <div className="card-body">
            <ResultChart options={results.options} totalVotes={results.totalVotes} />
          </div>
        </div>

        {/* Detailed Results */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Detailed Results
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Total: <strong style={{ color: 'var(--text-primary)' }}>{results.totalVotes}</strong> votes
            </span>
          </div>
          <div className="card-body" style={{ padding: '16px 24px' }}>
            {results.options.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <p className="empty-state-title">No votes yet</p>
              </div>
            ) : (
              results.options.map((opt, i) => (
                <div key={opt._id} className="result-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 160, flexShrink: 0 }}>
                    {i === 0 && results.totalVotes > 0 && (
                      <span style={{ fontSize: '0.9rem' }}>🥇</span>
                    )}
                    {i === 1 && results.totalVotes > 0 && (
                      <span style={{ fontSize: '0.9rem' }}>🥈</span>
                    )}
                    {i === 2 && results.totalVotes > 0 && (
                      <span style={{ fontSize: '0.9rem' }}>🥉</span>
                    )}
                    {i > 2 && <span style={{ width: 22 }} />}
                    <span className="result-label" style={{ width: 'auto' }} title={opt.text}>{opt.text}</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${opt.percentage}%` }}
                    />
                  </div>
                  <span className="result-percent">{opt.percentage}%</span>
                  <span className="result-count">{opt.voteCount} vote{opt.voteCount !== 1 ? 's' : ''}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollResults;
