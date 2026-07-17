

import { motion } from 'framer-motion';

function fmtBytes(b: number): string {
  if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

interface Props {
  talkers: Array<{ ip: string; bytes: number }>;
}

export default function TopTalkers({ talkers }: Props) {
  const max = talkers[0]?.bytes || 1;

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-title">
        <span className="icon">◈</span>
        top talkers
        <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: '0.6rem' }}>by volume</span>
      </div>

      {talkers.length === 0 ? (
        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0' }}>
          no data yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {talkers.slice(0, 8).map((t, i) => {
            const pct = (t.bytes / max) * 100;
            const isTop = i === 0;
            return (
              <div key={t.ip}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.2rem',
                  fontSize: '0.67rem',
                }}>
                  <span style={{
                    color: isTop ? 'var(--accent-yellow)' : 'var(--text-primary)',
                    fontWeight: isTop ? 700 : 400,
                  }}>
                    {isTop && '⭑ '}{t.ip}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{fmtBytes(t.bytes)}</span>
                </div>
                <div style={{
                  height: '4px',
                  background: 'var(--bg-deep)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      borderRadius: '2px',
                      background: isTop
                        ? 'var(--accent-yellow)'
                        : `hsl(${200 + i * 15}, 70%, 60%)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}