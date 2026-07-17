

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { TimelinePoint } from '../hooks/useWebSocket';

function fmtYAxis(v: number): string {
  if (v >= 1_048_576) return `${(v / 1_048_576).toFixed(0)}m`;
  if (v >= 1024) return `${(v / 1024).toFixed(0)}k`;
  return `${v}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const bps = payload[0]?.value ?? 0;
  const pps = payload[1]?.value ?? 0;
  return (
    <div className="custom-tooltip">
      <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ color: 'var(--accent-yellow)' }}>
        ↑ {fmtYAxis(bps)}b/s
      </div>
      <div style={{ color: 'var(--accent-cyan)' }}>
        {pps} pkt/s
      </div>
    </div>
  );
}

interface Props { timeline: TimelinePoint[] }

export default function TrafficGraph({ timeline }: Props) {
  const avg = timeline.length
    ? timeline.reduce((a, b) => a + b.bps, 0) / timeline.length
    : 0;

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-title">
        <span className="icon">▲</span>
        traffic — bytes/sec (60s window)
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={timeline} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="bpsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#e2b714" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#e2b714" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="ppsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#4fc3f7" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#4fc3f7" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(168,198,232,0.06)" vertical={false} />

          <XAxis
            dataKey="t"
            tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'Roboto Mono' }}
            interval="preserveStartEnd"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={fmtYAxis}
            tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'Roboto Mono' }}
            tickLine={false}
            axisLine={false}
            width={36}
          />

          <Tooltip content={<CustomTooltip />} />

          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke="rgba(226,183,20,0.3)"
              strokeDasharray="4 4"
              label={{ value: 'avg', position: 'insideTopRight', fill: 'var(--text-dim)', fontSize: 9, fontFamily: 'Roboto Mono' }}
            />
          )}

          <Area
            type="monotone"
            dataKey="bps"
            stroke="#e2b714"
            strokeWidth={1.5}
            fill="url(#bpsGrad)"
            dot={false}
            animationDuration={400}
            isAnimationActive
          />
          <Area
            type="monotone"
            dataKey="pps"
            stroke="#4fc3f7"
            strokeWidth={1}
            fill="url(#ppsGrad)"
            dot={false}
            animationDuration={400}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: '1.2rem', marginTop: '0.6rem' }}>
        {[
          { color: '#e2b714', label: 'bytes/sec' },
          { color: '#4fc3f7', label: 'packets/sec' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <div style={{ width: '14px', height: '2px', background: color, borderRadius: '1px' }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}