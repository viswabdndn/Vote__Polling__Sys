import { MdHowToVote } from 'react-icons/md';

const LoadingSpinner = ({
  size = 'md',
  text = 'Poll voting is loading...',
  fullScreen = false,
}) => {
  const sizeConfig = {
    sm: { circle: 44, icon: 20, font: '0.8rem', stroke: 3 },
    md: { circle: 72, icon: 32, font: '0.9rem', stroke: 3.5 },
    lg: { circle: 96, icon: 42, font: '1rem', stroke: 4 },
  };

  const { circle, icon, font, stroke } = sizeConfig[size] || sizeConfig.md;
  const radius = circle / 2 - stroke * 2;
  const circumference = 2 * Math.PI * radius;

  const content = (
    <div className="poll-loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      {/* Outer spinning circular ring with inner pulsating voting icon */}
      <div
        className="poll-loading-circle-wrapper"
        style={{
          position: 'relative',
          width: circle,
          height: circle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width={circle}
          height={circle}
          viewBox={`0 0 ${circle} ${circle}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
          }}
        >
          {/* Background circle */}
          <circle
            cx={circle / 2}
            cy={circle / 2}
            r={radius}
            stroke="var(--border-light)"
            strokeWidth={stroke}
            fill="transparent"
          />
          {/* Animated gradient accent stroke */}
          <circle
            cx={circle / 2}
            cy={circle / 2}
            r={radius}
            stroke="var(--accent)"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.65}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center glowing voting icon */}
        <div
          className="poll-loading-icon"
          style={{
            width: circle - 16,
            height: circle - 16,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.12), rgba(42, 82, 152, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            animation: 'pulseVote 1.8s ease-in-out infinite',
            boxShadow: '0 4px 14px rgba(0, 180, 216, 0.15)',
          }}
        >
          <MdHowToVote size={icon} />
        </div>
      </div>

      {/* Loading message */}
      {text && (
        <div
          className="poll-loading-text"
          style={{
            color: 'var(--text-secondary)',
            fontSize: font,
            fontWeight: 600,
            letterSpacing: '0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>{text}</span>
          <span className="poll-loading-dots">
            <span className="dot dot-1">.</span>
            <span className="dot dot-2">.</span>
            <span className="dot dot-3">.</span>
          </span>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
