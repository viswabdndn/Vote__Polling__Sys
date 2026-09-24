import { useNavigate } from 'react-router-dom';
import { MdPerson, MdTimer, MdHowToVote, MdBarChart, MdLock, MdShare } from 'react-icons/md';
import toast from 'react-hot-toast';

const PollCard = ({ poll }) => {
  const navigate = useNavigate();

  const now = new Date();
  const expiry = new Date(poll.expiryTime);
  const isExpired = poll.status === 'closed' || expiry <= now;

  const timeLeft = () => {
    if (isExpired) return 'Closed';
    const diff = expiry - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/polls/${poll._id}/vote`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Poll link copied to clipboard! 📋');
  };

  return (
    <div className="poll-card animate-slideUp">
      <div className="poll-card-header">
        <h3 className="poll-card-title">{poll.title}</h3>
        <span className={`badge ${isExpired ? 'badge-closed' : 'badge-active'}`}>
          {isExpired ? <MdLock size={11} /> : <span className="live-dot" />}
          {isExpired ? 'Closed' : 'Active'}
        </span>
      </div>

      {poll.description && (
        <p className="poll-card-desc">{poll.description}</p>
      )}

      <div className="poll-card-meta">
        <span>
          <MdPerson size={13} />
          {poll.createdBy?.name || 'Unknown'}
        </span>
        <span>
          <MdHowToVote size={13} />
          {poll.options?.length || 0} options
        </span>
        <span>
          <MdTimer size={13} />
          <span className={`countdown ${isExpired ? 'expired' : ''}`}>
            {timeLeft()}
          </span>
        </span>
      </div>

      <div className="poll-card-actions">
        {!isExpired && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate(`/polls/${poll._id}/vote`)}
          >
            <MdHowToVote size={15} />
            Vote
          </button>
        )}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(`/polls/${poll._id}/results`)}
        >
          <MdBarChart size={15} />
          Results
        </button>
        <button
          className="btn btn-ghost btn-sm"
          title="Copy Poll Link"
          onClick={handleCopyLink}
          style={{ padding: '7px 10px' }}
        >
          <MdShare size={15} />
        </button>
      </div>
    </div>
  );
};

export default PollCard;
