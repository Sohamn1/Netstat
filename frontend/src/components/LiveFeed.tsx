

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PacketEntry } from '../hooks/useWebSocket';

const PROTOCOL_BADGE_CLASS: Record<string, string> = {
  TCP: 'badge-tcp', UDP: 'badge-udp', DNS: 'badge-dns',
  HTTP: 'badge-http', HTTPS: 'badge-https', ICMP: 'badge-icmp',
  ARP: 'badge-arp', SSH: 'badge-ssh', FTP: 'badge-tcp',
};

function getBadge(proto: string): string {
  return PROTOCOL_BADGE_CLASS[proto.toUpperCase()] ?? 'badge-other';
}

function fmtLen(b: number): string {
  if (b >= 1024) return `${(b / 1024).toFixed(1)}k`;
  return `${b}b`;
}

function ipPort(ip: string | null, port: number | null) {
  if (!ip) return '—';
  return port ? `${ip}:${port}` : ip;
}

interface RowProps {
  pkt: PacketEntry;
  idx: number;
  isSelected: boolean;
  onClick: () => void;
}

function PacketRow({ pkt, idx, isSelected, onClick }: RowProps) {
  return (
    <motion.div
      key={`${pkt.timestamp_ms}-${idx}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.12 }}
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '50px 1fr 10px 1fr 60px 45px 2.2fr',
        gap: '0.5rem',
        alignItems: 'center',
        padding: '0.35rem 0.5rem',
        borderBottom: '1px solid rgba(0,0,0,0.03)',
        fontSize: '0.66rem',
        fontFamily: 'var(--font-mono)',
        cursor: 'pointer',
        background: isSelected
          ? 'rgba(226, 183, 20, 0.12)'
          : pkt.suspicious
          ? 'rgba(248,113,113,0.05)'
          : 'transparent',
        borderRadius: '3px',
        borderLeft: isSelected ? '2px solid var(--accent-yellow)' : '2px solid transparent',
        transition: 'background 0.15s, border-color 0.15s',
      }}
      whileHover={{ background: isSelected ? 'rgba(226, 183, 20, 0.15)' : 'rgba(0,0,0,0.02)' }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{pkt.timestamp}</span>
      <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {ipPort(pkt.src_ip, pkt.src_port)}
      </span>
      <span style={{ color: 'var(--text-dim)', textAlign: 'center' }}>→</span>
      <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {ipPort(pkt.dst_ip, pkt.dst_port)}
      </span>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span className={`badge ${getBadge(pkt.protocol)}`}>
          {pkt.protocol.toLowerCase()}
        </span>
      </div>
      <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>{fmtLen(pkt.length)}</span>
      
      {}
      <span style={{
        color: 'var(--text-muted)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'left',
        paddingLeft: '0.4rem',
      }} title={pkt.info || ''}>
        {pkt.info || '—'}
      </span>
    </motion.div>
  );
}

interface SelectedPacketDetailsProps {
  pkt: PacketEntry;
  onClose: () => void;
}

function SelectedPacketDetails({ pkt, onClose }: SelectedPacketDetailsProps) {
  const isTcp = pkt.protocol.toUpperCase() === 'TCP' || pkt.app_protocol?.toUpperCase() === 'HTTP' || pkt.app_protocol?.toUpperCase() === 'HTTPS';
  const isUdp = pkt.protocol.toUpperCase() === 'UDP' || pkt.protocol.toUpperCase() === 'DNS';

  return (
    <div style={{
      background: 'var(--bg-deep)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '0.8rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.8rem',
      height: '100%',
      overflowY: 'auto',
      maxHeight: '280px',
      fontSize: '0.66rem',
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent-yellow)', fontSize: '0.75rem' }}>
          frame {pkt.frame_number ?? '—'}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
      </div>

      {}
      <div>
        <div style={{ fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.2rem', textTransform: 'lowercase' }}>ethernet ii</div>
        <div style={{ paddingLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>source mac:</span> <span style={{ color: 'var(--text-primary)' }}>{pkt.src_mac ?? '—'}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>destination mac:</span> <span style={{ color: 'var(--text-primary)' }}>{pkt.dst_mac ?? '—'}</span></div>
        </div>
      </div>

      {}
      {pkt.src_ip && (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.2rem', textTransform: 'lowercase' }}>ipv4</div>
          <div style={{ paddingLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>source ip:</span> <span style={{ color: 'var(--text-primary)' }}>{pkt.src_ip}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>destination ip:</span> <span style={{ color: 'var(--text-primary)' }}>{pkt.dst_ip}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>ttl:</span> <span style={{ color: 'var(--text-primary)' }}>{pkt.ttl ?? '—'}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>id:</span> <span style={{ color: 'var(--text-primary)' }}>{pkt.ip_id ?? '—'}</span></div>
          </div>
        </div>
      )}

      {}
      {(pkt.src_port || pkt.dst_port) && (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.2rem', textTransform: 'lowercase' }}>
            {isTcp ? 'tcp' : isUdp ? 'udp' : 'transport layer'}
          </div>
          <div style={{ paddingLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>source port:</span> <span style={{ color: 'var(--text-primary)' }}>{pkt.src_port}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>destination port:</span> <span style={{ color: 'var(--text-primary)' }}>{pkt.dst_port}</span></div>
            {isTcp && (
              <>
                <div><span style={{ color: 'var(--text-muted)' }}>flags:</span> <span style={{ color: 'var(--accent-cyan)' }}>{pkt.flags ?? '—'}</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>sequence number:</span> <span style={{ color: 'var(--text-primary)' }}>{pkt.tcp_seq ?? '—'}</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>window size:</span> <span style={{ color: 'var(--text-primary)' }}>{pkt.tcp_window ?? '—'}</span></div>
              </>
            )}
          </div>
        </div>
      )}

      {}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.2rem', textTransform: 'lowercase' }}>payload (hex)</div>
        <pre style={{
          flex: 1,
          background: 'var(--bg-card)',
          padding: '0.4rem',
          borderRadius: '3px',
          overflowX: 'auto',
          overflowY: 'auto',
          fontSize: '0.52rem',
          color: 'var(--text-bright)',
          fontFamily: 'var(--font-mono)',
          lineHeight: '1.2',
          border: '1px solid var(--border)',
          whiteSpace: 'pre-wrap',
          maxHeight: '100px',
        }}>
          {pkt.hexdump || 'no payload'}
        </pre>
      </div>
    </div>
  );
}

interface Props { packets: PacketEntry[] }

export default function LiveFeed({ packets }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScroll = useRef(true);

  const [filter, setFilter] = useState('');
  const [selectedPkt, setSelectedPkt] = useState<PacketEntry | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [frozenPackets, setFrozenPackets] = useState<PacketEntry[]>([]);

  useEffect(() => {
    if (!isPaused) {
      setFrozenPackets(packets);
    }
  }, [packets, isPaused]);

  useEffect(() => {
    if (selectedPkt && !packets.some(p => p.timestamp_ms === selectedPkt.timestamp_ms)) {
      setSelectedPkt(null);
    }
  }, [packets, selectedPkt]);

  useEffect(() => {
    if (autoScroll.current && containerRef.current && !isPaused) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [packets, isPaused]);

  const orderedPackets = frozenPackets.filter(p => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return (
      p.protocol.toLowerCase().includes(f) ||
      (p.src_ip && p.src_ip.toLowerCase().includes(f)) ||
      (p.dst_ip && p.dst_ip.toLowerCase().includes(f)) ||
      (p.app_protocol && p.app_protocol.toLowerCase().includes(f)) ||
      (p.info && p.info.toLowerCase().includes(f))
    );
  });

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.8rem',
        marginBottom: '0.8rem',
      }}>
        <div className="card-title" style={{ margin: 0 }}>
          <span className="icon">≡</span>
          live packet feed
          <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.6rem' }}>
            {orderedPackets.length} of {frozenPackets.length} displayed {isPaused && '(paused)'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="btn"
            style={{
              padding: '0.25rem 0.6rem',
              fontSize: '0.65rem',
              height: '24px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: isPaused ? 'var(--accent-yellow)' : 'var(--bg-button)',
              color: isPaused ? 'var(--text-on-yellow)' : 'var(--text-primary)',
              borderColor: isPaused ? 'var(--accent-yellow)' : 'var(--border)',
            }}
          >
            {isPaused ? '▶ resume feed' : '⏸ pause feed'}
          </button>

          <input
            type="text"
            placeholder="filter ip / proto / info..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{
              padding: '0.25rem 0.6rem',
              fontSize: '0.65rem',
              width: '180px',
              height: '24px',
            }}
          />
          <span style={{ color: 'var(--text-dim)', fontSize: '0.6rem' }}>
            hover to pause
          </span>
        </div>
      </div>

      {}
      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        {}
        <div style={{
          flex: selectedPkt ? 6.5 : 12,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: 'flex 0.2s ease',
        }}>
          {}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '50px 1fr 10px 1fr 60px 45px 2.2fr',
            gap: '0.5rem',
            fontSize: '0.6rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
            padding: '0.2rem 0.5rem 0.4rem',
            borderBottom: '1px solid var(--border)',
          }}>
            <span>time</span>
            <span>source</span>
            <span />
            <span>destination</span>
            <span style={{ textAlign: 'center' }}>proto</span>
            <span style={{ textAlign: 'right' }}>size</span>
            <span style={{ paddingLeft: '0.4rem' }}>info summary</span>
          </div>

          {}
          <div
            ref={containerRef}
            onMouseEnter={() => { autoScroll.current = false; }}
            onMouseLeave={() => { autoScroll.current = true; }}
            style={{
              flex: 1,
              overflowY: 'auto',
              marginTop: '0.2rem',
              maxHeight: '280px',
            }}
          >
            {orderedPackets.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textAlign: 'center', padding: '3rem 0' }}>
                {packets.length === 0 ? 'waiting for packets...' : 'no packets match filter'}
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {orderedPackets.map((pkt, idx) => (
                  <PacketRow
                    key={`${pkt.timestamp_ms}-${idx}`}
                    pkt={pkt}
                    idx={idx}
                    isSelected={selectedPkt?.timestamp_ms === pkt.timestamp_ms}
                    onClick={() => setSelectedPkt(pkt)}
                  />
                ))}
              </AnimatePresence>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {}
        {selectedPkt && (
          <motion.div
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: '35%' }}
            exit={{ opacity: 0, x: 20, width: 0 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 3.5, minWidth: '220px' }}
          >
            <SelectedPacketDetails pkt={selectedPkt} onClose={() => setSelectedPkt(null)} />
          </motion.div>
        )}
      </div>
    </div>
  );
}