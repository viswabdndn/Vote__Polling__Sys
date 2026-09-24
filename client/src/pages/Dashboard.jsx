import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { pollAPI } from '../services/api';
import {
  MdPoll,
  MdHowToVote,
  MdAddCircleOutline,
  MdHistory,
  MdTrendingUp,
  MdArrowForward,
} from 'react-icons/md';
import LoadingSpinner from '../components/LoadingSpinner';

const StatCard = ({ icon, value, label, color, bgColor, onClick }) => (
  <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div className="stat-card-icon" style={{ background: bgColor, color: color }}>
      {icon}
    </div>
    <div className="stat-card-value">{value}</div>
    <div className="stat-card-label">{label}</div>
    {onClick && (
      <MdArrowForward size={16} style={{ position: 'absolute', top: 24, right: 20, color: 'var(--text-muted)' }} />
    )}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useSettings();
  const [stats, setStats] = useState({ active: 0, myPolls: 0, completed: 0, participated: 0 });
  const [recentPolls, setRecentPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const isCreator = user?.role === 'creator';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activeRes, myRes, archiveRes] = await Promise.all([
          pollAPI.getActive(),
          isCreator ? pollAPI.getMy() : Promise.resolve({ data: { polls: [] } }),
          pollAPI.getArchive(),
        ]);
        setStats({
          active: activeRes.data.polls.length,
          myPolls: myRes.data?.polls?.length || 0,
          completed: archiveRes.data.polls.length,
          participated: 0,
        });
        setRecentPolls(activeRes.data.polls.slice(0, 4));
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isCreator]);

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('greetingMorning');
    if (h < 17) return t('greetingAfternoon');
    return t('greetingEvening');
  };

  return (
    <div className="page-container animate-fadeIn">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">{getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="page-subtitle">
            {isCreator ? "Manage and create live polls for participants." : "Vote on questions and view live results in real-time."}
          </p>
        </div>
        {isCreator ? (
          <button className="btn btn-primary" onClick={() => navigate('/create-poll')}>
            <MdAddCircleOutline size={18} /> {t('createPoll')}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => navigate('/polls')}>
            <MdHowToVote size={18} /> Available Polls
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard
          icon={<MdPoll size={22} />}
          value={stats.active}
          label={t('activePollsStat')}
          color="#2a5298"
          bgColor="rgba(42,82,152,0.1)"
          onClick={() => navigate('/polls')}
        />
        {isCreator ? (
          <StatCard
            icon={<MdHowToVote size={22} />}
            value={stats.myPolls}
            label={t('myPollsStat')}
            color="#00b4d8"
            bgColor="rgba(0,180,216,0.1)"
            onClick={() => navigate('/my-polls')}
          />
        ) : (
          <StatCard
            icon={<MdHowToVote size={22} />}
            value="Active"
            label="Voting Access"
            color="#00b4d8"
            bgColor="rgba(0,180,216,0.1)"
            onClick={() => navigate('/polls')}
          />
        )}
        <StatCard
          icon={<MdHistory size={22} />}
          value={stats.completed}
          label={t('completedPollsStat')}
          color="#0a9e6c"
          bgColor="rgba(10,158,108,0.1)"
          onClick={() => navigate('/history')}
        />
        <StatCard
          icon={<MdTrendingUp size={22} />}
          value="Live"
          label={t('realTimeVoting')}
          color="#d97706"
          bgColor="rgba(217,119,6,0.1)"
        />
      </div>

      {/* Recent Active Polls */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('currentActivePolls')}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {t('currentActiveSub')}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/polls')}>
            {t('viewAll')} <MdArrowForward size={14} />
          </button>
        </div>
        <div className="card-body">
          {recentPolls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗳️</div>
              <p className="empty-state-title">{t('noActivePolls')}</p>
              <p className="empty-state-desc">
                {isCreator ? t('createToStart') : 'Check back soon for new questions to vote on!'}
              </p>
              {isCreator && (
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/create-poll')}>
                  <MdAddCircleOutline size={16} /> {t('createPoll')}
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recentPolls.map((poll, i) => {
                const expiry = new Date(poll.expiryTime);
                const diff = expiry - new Date();
                const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
                return (
                  <div
                    key={poll._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: i < recentPolls.length - 1 ? '1px solid var(--border-light)' : 'none',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {poll.title}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {poll.options?.length || 0} {t('optionsCount')} · {t('by')} {poll.createdBy?.name}
                        {hoursLeft > 0 && ` · ${hoursLeft}${t('hoursLeft')}`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/polls/${poll._id}/vote`)}>
                        {t('vote')}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/polls/${poll._id}/results`)}>
                        {t('results')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid-2" style={{ marginTop: 24 }}>
        {isCreator ? (
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/create-poll')}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(42,82,152,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MdAddCircleOutline size={26} color="var(--primary-light)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {t('createPoll')}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {t('createPollDesc')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/polls')}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(0,180,216,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MdHowToVote size={26} color="var(--accent)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Vote in Active Polls
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Choose an open poll and submit your answer
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/history')}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(10,158,108,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdHistory size={26} color="var(--success)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {t('pollHistory')}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {t('pollHistoryDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
