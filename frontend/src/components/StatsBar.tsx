

import { motion, AnimatePresence } from 'framer-motion';
import type { Snapshot, WsStatus } from '../hooks/useWebSocket';

function fmtBytes(b: number): string {
  if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(1)} mb/s`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} kb/s`;
  return `${b} b/s`;
}

function fmtUptime(s: number): string {
  const h = Math.floor(s / 3600).toString().padStart(2, '0');
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

interface StatItemProps { label: string; value: string; highlight?: boolean }

function StatItem({ label, value, highlight }: StatItemProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: highlight ? 'var(--accent-yellow)' : 'var(--text-bright)',
            lineHeight: 1.2,
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: '2px' }}>
        {label}
      </span>
    </div>
  );
}

interface Props { data: Snapshot | null; status: WsStatus; isCapturing: boolean }

export default function StatsBar({ data, status, isCapturing }: Props) {
  const connected = status === 'connected';

  return (
    <header style={{
      background: 'var(--bg-deep)',
      borderBottom: '1px solid var(--border)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginRight: '1rem' }}>
        <span style={{ fontSize: '1.1rem', color: 'var(--accent-yellow)' }}>◈</span>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-bright)', letterSpacing: '0.1em' }}>
          netsight
        </span>
      </div>

      {}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '1.5rem' }}>
        <div className={`live-dot ${isCapturing && connected ? '' : 'inactive'}`} />
        <span style={{
          fontSize: '0.65rem',
          color: isCapturing && connected ? 'var(--accent-yellow)' : 'var(--text-dim)',
          letterSpacing: '0.1em',
          fontWeight: 600,
        }}>
          {isCapturing && connected ? 'live' : connected ? 'idle' : 'offline'}
        </span>
      </div>

      {}
      <div style={{ position: 'relative', flex: 1, height: '1px', background: 'var(--border)', overflow: 'hidden', minWidth: '60px' }}>
        {isCapturing && (
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: '25%', height: '100%',
            background: 'linear-gradient(90deg, transparent, var(--accent-yellow), transparent)',
            animation: 'scan 2s linear infinite',
          }} />
        )}
      </div>

      {}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <StatItem label="packets/s"  value={data ? data.packets_per_sec.toString() : '—'} />
        <StatItem label="bandwidth"  value={data ? fmtBytes(data.bytes_per_sec) : '—'} highlight />
        <StatItem label="total pkts" value={data ? fmtNum(data.total_packets) : '—'} />
        <StatItem label="unique ips" value={data ? data.unique_ips.toString() : '—'} />
        <StatItem label="uptime"     value={data ? fmtUptime(data.uptime) : '00:00:00'} />
      </div>

      {}
      <div style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
        ws {status}
      </div>
    </header>
  );
}