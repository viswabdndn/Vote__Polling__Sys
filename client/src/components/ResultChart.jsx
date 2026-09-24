import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

const COLORS = [
  '#2a5298',
  '#00b4d8',
  '#0a9e6c',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#0891b2',
  '#65a30d',
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: 'var(--shadow)',
      }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>
          {d.text}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {d.voteCount} vote{d.voteCount !== 1 ? 's' : ''} ({d.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

const ResultChart = ({ options = [], totalVotes = 0 }) => {
  const data = options.map((o) => ({
    text: o.text.length > 14 ? o.text.substring(0, 14) + '…' : o.text,
    fullText: o.text,
    voteCount: o.voteCount,
    percentage: o.percentage,
  }));

  if (totalVotes === 0) {
    return (
      <div className="empty-state" style={{ padding: '30px 0' }}>
        <div className="empty-state-icon">📊</div>
        <p className="empty-state-title">No votes yet</p>
        <p className="empty-state-desc">Be the first to cast a vote!</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
          <XAxis
            dataKey="text"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,180,216,0.06)' }} />
          <Bar dataKey="voteCount" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
            <LabelList
              dataKey="percentage"
              position="top"
              formatter={(v) => `${v}%`}
              style={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResultChart;
