import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pollAPI, voteAPI } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { MdHowToVote, MdPerson, MdTimer, MdBarChart, MdCheckCircle, MdLock, MdShare } from 'react-icons/md';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const VotePoll = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playSound } = useSettings();
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voteStatus, setVoteStatus] = useState({ hasVoted: false, vote: null });

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const [pollRes, statusRes] = await Promise.all([
          pollAPI.getById(id),
          voteAPI.getVoteStatus(id),
        ]);
        setPoll(pollRes.data.poll);
        setVoteStatus(statusRes.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Poll not found.');
        navigate('/polls');
      } finally {
        setLoading(false);
      }
    };
    fetchPoll();
  }, [id]);

  const isExpired = poll && (poll.status === 'closed' || new Date(poll.expiryTime) <= new Date());

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Poll link copied to clipboard! 📋');
  };

  const handleVote = async (e) => {
    e.preventDefault();
    if (!selectedOption) { toast.error('Please select an option.'); return; }

    setSubmitting(true);
    try {
      await voteAPI.cast(id, selectedOption);
      playSound('vote');
      toast.success('Vote submitted successfully.');
      navigate(`/polls/${id}/results`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cast vote.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="page-container">
      <LoadingSpinner size="lg" text="Loading poll..." />
    </div>
  );

  if (!poll) return null;

  const expiryDate = new Date(poll.expiryTime);

  return (
    <div className="page-container animate-fadeIn">
      <div style={{ maxWidth: 620 }}>
        {/* Back */}
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
          ← Back
        </button>

        {/* Poll Header Card */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span className={`badge ${isExpired ? 'badge-closed' : 'badge-active'}`}>
                {isExpired ? <MdLock size={11} /> : <span className="live-dot" />}
                {isExpired ? 'Closed' : 'Active'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleCopyLink}
                  title="Share Poll"
                >
                  <MdShare size={15} /> Share
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate(`/polls/${id}/results`)}
                >
                  <MdBarChart size={15} /> Results
                </button>
              </div>
            </div>

            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, lineHeight: 1.4 }}>
              {poll.title}
            </h1>

            {poll.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 14 }}>
                {poll.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MdPerson size={14} /> {poll.createdBy?.name || 'Unknown'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MdTimer size={14} />
                Expires: {expiryDate.toLocaleDateString()} {expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MdHowToVote size={14} /> {poll.totalVotes || 0} total votes
              </span>
            </div>
          </div>
        </div>

        {/* Already voted */}
        {voteStatus.hasVoted && (
          <div style={{
            background: 'var(--success-bg)',
            border: '1px solid #86efac',
            borderRadius: 'var(--border-radius)',
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <MdCheckCircle size={22} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.9rem', marginBottom: 2 }}>
                You already voted in this poll!
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Your vote: <strong>{voteStatus.vote?.optionText}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Expired */}
        {isExpired && !voteStatus.hasVoted && (
          <div style={{
            background: 'var(--closed-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--border-radius)',
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <MdLock size={22} color="var(--closed-color)" />
            <p style={{ fontWeight: 600, color: 'var(--closed-color)', fontSize: '0.9rem' }}>
              This poll has expired. Voting is no longer allowed.
            </p>
          </div>
        )}

        {/* Voting Form */}
        {!voteStatus.hasVoted && !isExpired && (
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Cast Your Vote
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Select one option and click Submit Vote. You can only vote once.
              </p>
            </div>
            <div className="card-body">
              <form onSubmit={handleVote}>
                {poll.options?.map((opt) => (
                  <label
                    key={opt._id}
                    className={`vote-option ${selectedOption === opt._id ? 'selected' : ''}`}
                    htmlFor={`opt-${opt._id}`}
                  >
                    <input
                      id={`opt-${opt._id}`}
                      type="radio"
                      name="voteOption"
                      value={opt._id}
                      checked={selectedOption === opt._id}
                      onChange={() => setSelectedOption(opt._id)}
                    />
                    <span className="vote-option-text">{opt.text}</span>
                  </label>
                ))}

                <button
                  id="cast-vote-btn"
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  style={{ marginTop: 16 }}
                  disabled={submitting || !selectedOption}
                >
                  {submitting ? (
                    <>
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <MdHowToVote size={20} /> Cast Vote
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* View results CTA */}
        {(voteStatus.hasVoted || isExpired) && (
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={() => navigate(`/polls/${id}/results`)}
            style={{ marginTop: 8 }}
          >
            <MdBarChart size={20} /> View Live Results
          </button>
        )}
      </div>
    </div>
  );
};

export default VotePoll;
