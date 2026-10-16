const SkeletonLoader = ({ type = 'pollCard', count = 3 }) => {
  const items = Array.from({ length: count });

  if (type === 'statCard') {
    return (
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {items.map((_, i) => (
          <div key={i} className="card" style={{ padding: 24 }}>
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '50%', height: 32, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '70%', height: 16 }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div className="skeleton" style={{ width: '30%', height: 24, marginBottom: 20 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: '100%', height: 44, borderRadius: 'var(--border-radius-sm)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'results') {
    return (
      <div className="card" style={{ padding: 28 }}>
        <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 14 }} />
        <div className="skeleton" style={{ width: '40%', height: 16, marginBottom: 24 }} />
        <div className="skeleton" style={{ width: '100%', height: 220, marginBottom: 24, borderRadius: 12 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton" style={{ width: '30%', height: 16 }} />
                <div className="skeleton" style={{ width: '10%', height: 16 }} />
              </div>
              <div className="skeleton" style={{ width: '100%', height: 10, borderRadius: 10 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: pollCard grid
  return (
    <div className="grid-3">
      {items.map((_, i) => (
        <div
          key={i}
          className="card"
          style={{
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '65%', height: 20 }} />
            <div className="skeleton" style={{ width: '20%', height: 20, borderRadius: 50 }} />
          </div>
          <div className="skeleton" style={{ width: '90%', height: 14 }} />
          <div className="skeleton" style={{ width: '75%', height: 14 }} />
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <div className="skeleton" style={{ width: '30%', height: 14 }} />
            <div className="skeleton" style={{ width: '30%', height: 14 }} />
            <div className="skeleton" style={{ width: '30%', height: 14 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 8 }}>
            <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
