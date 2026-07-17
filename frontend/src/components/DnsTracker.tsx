

import { useEffect, useState } from 'react';
import type { PacketEntry } from '../hooks/useWebSocket';

interface DnsEntry {
  domain: string;
  count: number;
  lastSeen: string;
  qtype: string;
  resolvedIps: string[] | null;
}

interface Props { packets: PacketEntry[] }

export default function DnsTracker({ packets }: Props) {
  const [dnsQueries, setDnsQueries] = useState<Map<string, DnsEntry>>(new Map());

  useEffect(() => {
    let changed = false;
    const newQueries = new Map(dnsQueries);

    for (const pkt of packets) {
      if (pkt.dns_query) {
        const domain = pkt.dns_query;
        const qtype = pkt.dns_qtype || 'A';
        const resolvedIps = pkt.dns_resolved_ips || null;
        
        const existing = newQueries.get(domain);
        if (existing) {
          if (pkt.timestamp !== existing.lastSeen) {
            newQueries.set(domain, {
              domain,
              count: existing.count + 1,
              lastSeen: pkt.timestamp,
              qtype,
              resolvedIps: resolvedIps 
                ? Array.from(new Set([...(existing.resolvedIps || []), ...resolvedIps]))
                : existing.resolvedIps,
            });
            changed = true;
          }
        } else {
          newQueries.set(domain, {
            domain,
            count: 1,
            lastSeen: pkt.timestamp,
            qtype,
            resolvedIps,
          });
          changed = true;
        }
      }
    }

    if (changed) {
      setDnsQueries(newQueries);
    }
  }, [packets]);

  const sortedQueries = Array.from(dnsQueries.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalQueries = Array.from(dnsQueries.values()).reduce((sum, q) => sum + q.count, 0);

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-title" style={{ marginBottom: '0.6rem' }}>
        <span className="icon">◈</span>
        dns domain tracker
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.6rem' }}>
          {dnsQueries.size} unique domains · {totalQueries} total
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sortedQueries.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textAlign: 'center', padding: '2.5rem 0' }}>
            waiting for dns lookups...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 1.2fr 40px 60px',
              gap: '0.5rem',
              fontSize: '0.6rem',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.2rem',
              fontWeight: 500,
            }}>
              <span>type</span>
              <span>domain / resolution</span>
              <span style={{ textAlign: 'center' }}>count</span>
              <span style={{ textAlign: 'right' }}>last seen</span>
            </div>

            {}
            {sortedQueries.map((q) => {
              const pct = totalQueries > 0 ? (q.count / totalQueries) * 100 : 0;
              return (
                <div
                  key={q.domain}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1.2fr 40px 60px',
                    gap: '0.5rem',
                    fontSize: '0.66rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '0.3rem 0.4rem',
                    borderBottom: '1px solid rgba(0,0,0,0.015)',
                    alignItems: 'center',
                    borderRadius: '4px',
                    background: `linear-gradient(90deg, rgba(226, 183, 20, 0.05) ${pct}%, transparent ${pct}%)`,
                    transition: 'background 0.2s ease',
                  }}
                >
                  {}
                  <span>
                    <span className="badge" style={{ 
                      fontSize: '0.52rem', 
                      padding: '0.08rem 0.25rem', 
                      background: q.qtype === 'AAAA' ? 'rgba(79, 195, 247, 0.15)' : 'rgba(226, 183, 20, 0.15)',
                      color: q.qtype === 'AAAA' ? 'var(--accent-cyan)' : 'var(--accent-yellow2)',
                      border: 'none',
                    }}>
                      {q.qtype}
                    </span>
                  </span>

                  {}
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span
                      style={{
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 500,
                      }}
                      title={q.domain}
                    >
                      {q.domain}
                    </span>
                    {q.resolvedIps && q.resolvedIps.length > 0 && (
                      <span
                        style={{
                          fontSize: '0.55rem',
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '0.05rem',
                        }}
                        title={q.resolvedIps.join(', ')}
                      >
                        ip: {q.resolvedIps.join(', ')}
                      </span>
                    )}
                  </div>

                  {}
                  <span style={{ color: 'var(--text-bright)', textAlign: 'center', fontWeight: 700 }}>
                    {q.count}
                  </span>

                  {}
                  <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>
                    {q.lastSeen}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}