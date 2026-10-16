import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { voteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ResultChart from '../components/ResultChart';
import LoadingSpinner from '../components/LoadingSpinner';
import { exportToExcel, exportToDoc, exportToPdf } from '../utils/exportUtils';
import {
  MdBarChart, MdHowToVote, MdTimer, MdPerson, MdEmojiEvents,
  MdLock, MdSignalWifi4Bar, MdShare, MdSupervisorAccount,
  MdSearch, MdClear,
} from 'react-icons/md';
import { FaFileExcel, FaFileWord, FaFilePdf } from 'react-icons/fa';
import toast from 'react-hot-toast';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (window.location.port === '5173'
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : window.location.origin);

const PollResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState({
    options: [],
    totalVotes: 0,
    winner: null,
    isCreator: false,
    participantVotes: [],
  });
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/polls/${id}/vote`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Poll link copied to clipboard! 📋');
  };

  const fetchResults = useCallback(async () => {
    try {
      const { data } = await voteAPI.getResults(id);
      setPoll(data.poll);
      setResults({
        options: data.options,
        totalVotes: data.totalVotes,
        winner: data.winner,
        isCreator: data.isCreator,
        participantVotes: data.participantVotes || [],
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load results.');
      navigate('/polls');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchResults();

    // Socket.IO — join poll room for live updates
    const token = localStorage.getItem('token');
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('joinPoll', id);
    });

    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('voteUpdated', (data) => {
      if (data.pollId === id) {
        // Refreshes options, vote counts, and participant responses live
        fetchResults();
        toast.success('New vote recorded live!', { duration: 2000, icon: '📊' });
      }
    });

    return () => {
      if (socket.connected) {
        socket.emit('leavePoll', id);
      }
      socket.disconnect();
    };
  }, [id, fetchResults]);

  // Determine if the current viewer is the poll creator owner or system admin
  const isCreatorViewer = useMemo(() => {
    if (results.isCreator) return true;
    if (user?.role === 'admin') return true;
    if (poll?.createdBy?._id && user?._id && poll.createdBy._id.toString() === user._id.toString()) return true;
    return false;
  }, [results.isCreator, user, poll]);

  // Filter participant records by search term
  const filteredParticipants = useMemo(() => {
    const votes = results.participantVotes || [];
    if (!searchTerm.trim()) return votes;
    const term = searchTerm.toLowerCase();
    return votes.filter(
      (p) =>
        p.participantId?.toLowerCase().includes(term) ||
        p.name?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.optionText?.toLowerCase().includes(term)
    );
  }, [results.participantVotes, searchTerm]);

  // Download actions
  const handleExportExcel = () => {
    if (!results.participantVotes?.length) {
      toast.error('No participant votes to export yet.');
      return;
    }
    exportToExcel(poll, results.participantVotes, results.options);
    toast.success('Excel report downloaded! 📊');
  };

  const handleExportDoc = () => {
    if (!results.participantVotes?.length) {
      toast.error('No participant votes to export yet.');
      return;
    }
    exportToDoc(poll, results.participantVotes, results.options);
    toast.success('Word (.doc) report downloaded! 📄');
  };

  const handleExportPdf = () => {
    if (!results.participantVotes?.length) {
      toast.error('No participant votes to export yet.');
      return;
    }
    exportToPdf(poll, results.participantVotes, results.options);
    toast.success('PDF report downloaded! 📑');
  };

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
                <div
                  key={opt._id}
                  className="result-row"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: '14px 0',
                    borderBottom: i === results.options.length - 1 ? 'none' : '1px solid var(--border-light)',
                  }}
                >
                  {/* Top row: Medal/Rank + Option Text and % + Vote Count */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      {i === 0 && results.totalVotes > 0 && (
                        <span style={{ fontSize: '1.1rem', flexShrink: 0, lineHeight: 1 }} title="1st Place">🥇</span>
                      )}
                      {i === 1 && results.totalVotes > 0 && (
                        <span style={{ fontSize: '1.1rem', flexShrink: 0, lineHeight: 1 }} title="2nd Place">🥈</span>
                      )}
                      {i === 2 && results.totalVotes > 0 && (
                        <span style={{ fontSize: '1.1rem', flexShrink: 0, lineHeight: 1 }} title="3rd Place">🥉</span>
                      )}
                      {i > 2 && (
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'var(--bg-alt, #f1f5f9)',
                            color: 'var(--text-muted)',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </span>
                      )}
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          color: 'var(--text-primary)',
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                        }}
                      >
                        {opt.text}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0 }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          color: opt.percentage > 0 ? 'var(--accent)' : 'var(--text-muted)',
                          minWidth: 46,
                          textAlign: 'right',
                        }}
                      >
                        {opt.percentage}%
                      </span>
                      <span
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-muted)',
                          minWidth: 54,
                          textAlign: 'right',
                        }}
                      >
                        {opt.voteCount} vote{opt.voteCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Bottom row: Full-width modern progress bar */}
                  <div className="progress-bar-wrap" style={{ width: '100%', height: 10, margin: 0 }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${opt.percentage}%`,
                        background:
                          i === 0 && results.totalVotes > 0
                            ? 'linear-gradient(90deg, #2563eb, #38bdf8)'
                            : 'linear-gradient(90deg, var(--accent), var(--primary-light))',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Creator Exclusive: Participant Breakdown & Export */}
        {isCreatorViewer && (
          <div className="card" style={{ marginTop: 24, border: '1px solid var(--border)' }}>
            <div
              className="card-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.04) 0%, rgba(0, 180, 216, 0.04) 100%)',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <MdSupervisorAccount size={20} color="var(--primary)" />
                  Participant Voting Details
                  <span className="badge badge-primary" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    Creator View
                  </span>
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Participant IDs and their selected poll options. You can export this audit report below.
                </p>
              </div>

              {/* Download Buttons */}
              <div className="export-btn-group">
                <button
                  className="btn-export btn-export-excel"
                  onClick={handleExportExcel}
                  title="Download report as Excel (.xlsx)"
                >
                  <FaFileExcel size={14} /> Excel
                </button>
                <button
                  className="btn-export btn-export-doc"
                  onClick={handleExportDoc}
                  title="Download report as Word (.doc)"
                >
                  <FaFileWord size={14} /> Word
                </button>
                <button
                  className="btn-export btn-export-pdf"
                  onClick={handleExportPdf}
                  title="Download report as PDF (.pdf)"
                >
                  <FaFilePdf size={14} /> PDF
                </button>
              </div>
            </div>

            <div className="card-body" style={{ padding: '18px 24px' }}>
              {/* Search & Stats Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 360 }}>
                  <MdSearch
                    size={18}
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by ID, name, or option..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: 34, paddingRight: searchTerm ? 32 : 12, height: 38, fontSize: '0.85rem' }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <MdClear size={16} />
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredParticipants.length}</strong> of{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{results.participantVotes?.length || 0}</strong> participant votes
                </div>
              </div>

              {/* Participant Table */}
              {results.participantVotes?.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 0' }}>
                  <p className="empty-state-title">No participant votes yet</p>
                  <p className="empty-state-desc">When participants cast their votes, their participant IDs and choices will appear here in real time.</p>
                </div>
              ) : filteredParticipants.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <p className="empty-state-title">No matching participants</p>
                  <p className="empty-state-desc">No participant matches "{searchTerm}". Try a different keyword.</p>
                </div>
              ) : (
                <div className="participant-table-wrap">
                  <table className="participant-table">
                    <thead>
                      <tr>
                        <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                        <th style={{ width: '20%' }}>Participant ID</th>
                        <th style={{ width: '22%' }}>Name</th>
                        <th style={{ width: '23%' }}>Email</th>
                        <th style={{ width: '18%' }}>Selected Option</th>
                        <th style={{ width: '12%' }}>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParticipants.map((p, index) => (
                        <tr key={p._id || index}>
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {p.slNo || index + 1}
                          </td>
                          <td>
                            <span className="voter-id-badge">
                              {p.participantId}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {p.name}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {p.email}
                          </td>
                          <td>
                            <span className="option-badge-voted">
                              ✓ {p.optionText}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {new Date(p.votedAt).toLocaleDateString()}{' '}
                            {new Date(p.votedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollResults;
