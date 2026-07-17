

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PROTOCOL_COLORS: Record<string, string> = {
  TCP:        '#4fc3f7',
  UDP:        '#a78bfa',
  DNS:        '#4ade80',
  HTTP:       '#e2b714',
  HTTPS:      '#f0c832',
  ICMP:       '#fb923c',
  ARP:        '#f87171',
  SSH:        '#34d399',
  FTP:        '#60a5fa',
  SMTP:       '#f472b6',
  RDP:        '#e879f9',
  OTHER:      '#6a93c4',
  IPv6:       '#818cf8',
  TELNET:     '#fbbf24',
  MYSQL:      '#2dd4bf',
  POSTGRES:   '#38bdf8',
  REDIS:      '#f97316',
  MONGODB:    '#a3e635',
};

function getColor(protocol: string): string {
  return PROTOCOL_COLORS[protocol.toUpperCase()] ?? PROTOCOL_COLORS.OTHER;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0];
  return (
    <div className="custom-tooltip">
      <div style={{ color: getColor(name), fontWeight: 700 }}>{name.toLowerCase()}</div>
      <div>{value.toLocaleString()} packets</div>
      <div style={{ color: 'var(--text-muted)' }}>{(percent * 100).toFixed(1)}%</div>
    </div>
  );
}

function CustomLegend({ payload }: any) {
  if (!payload) return null;
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '0.4rem 1rem',
      justifyContent: 'center', marginTop: '0.5rem',
    }}>
      {payload.map((entry: any) => (
        <div key={entry.value} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.65rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-muted)' }}>{entry.value.toLowerCase()}</span>
        </div>
      ))}
    </div>
  );
}

interface Props { protocolCounts: Record<string, number> }

export default function ProtocolPie({ protocolCounts }: Props) {
  const data = Object.entries(protocolCounts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-title">
        <span className="icon">◉</span>
        protocol breakdown
        <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: '0.65rem' }}>
          {total.toLocaleString()} total
        </span>
      </div>

      {data.length === 0 ? (
        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0' }}>
          no traffic yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius="52%"
              outerRadius="78%"
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={600}
              isAnimationActive
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={getColor(entry.name)}
                  stroke="var(--bg-card)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}