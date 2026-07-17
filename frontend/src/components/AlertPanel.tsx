

import { motion, AnimatePresence } from 'framer-motion';
import type { Alert } from '../hooks/useWebSocket';

const LEVEL_STYLE: Record<string, { color: string; bg: string; icon: string }> = {
  critical: { color: 'var(--accent-red)',    bg: 'rgba(248,113,113,0.08)', icon: '⚠' },
  warning:  { color: 'var(--accent-orange)', bg: 'rgba(251,146,60,0.08)',  icon: '◉' },
  info:     { color: 'var(--accent-cyan)',   bg: 'rgba(79,195,247,0.08)',  icon: '◈' },
};

interface Props { alerts: Alert[] }

export default function AlertPanel({ alerts }: Props) {
  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-title">
        <span className="icon">⚑</span>
        threat feed
        {alerts.length > 0 && (
          <span style={{
            marginLeft: '0.4rem',
            background: 'rgba(248,113,113,0.15)',
            color: 'var(--accent-red)',
            fontSize: '0.6rem',
            fontWeight: 700,
            padding: '0.1rem 0.4rem',
            borderRadius: '3px',
          }}>
            {alerts.length}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '300px', overflowY: 'auto' }}>
        {alerts.length === 0 ? (
          <div style={{
            color: 'var(--text-dim)',
            fontSize: '0.72rem',
            textAlign: 'center',
            padding: '2rem 0',
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>✓</div>
            no threats detected
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {alerts.map((alert, idx) => {
              const style = LEVEL_STYLE[alert.level] ?? LEVEL_STYLE.info;
              return (
                <motion.div
                  key={`${alert.title}-${alert.time}-${idx}`}
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    background: style.bg,
                    border: `1px solid ${style.color}30`,
                    borderLeft: `3px solid ${style.color}`,
                    borderRadius: 'var(--radius)',
                    padding: '0.5rem 0.7rem',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ color: style.color, fontSize: '0.7rem' }}>{style.icon}</span>
                    <span style={{ color: style.color, fontSize: '0.7rem', fontWeight: 700 }}>
                      {alert.title.toLowerCase()}
                    </span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: '0.6rem' }}>
                      {alert.time}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {alert.detail}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}