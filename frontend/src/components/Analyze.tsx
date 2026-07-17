

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PacketEntry } from '../hooks/useWebSocket';
import Topology from './Topology';

interface Props { packets: PacketEntry[] }

const PORT_SERVICES: Record<number, string> = {
  80: 'http (web traffic)',
  443: 'https (secure web)',
  53: 'dns (domain resolution)',
  22: 'ssh (secure shell)',
  21: 'ftp (file transfer)',
  23: 'telnet (unencrypted shell)',
  25: 'smtp (mail routing)',
  110: 'pop3 (mail retrieval)',
  143: 'imap (mail retrieval)',
  123: 'ntp (network time protocol)',
  161: 'snmp (network management)',
  1900: 'ssdp (upnp discovery)',
  5353: 'mdns (multicast dns)',
  137: 'netbios name service',
  138: 'netbios datagram',
  139: 'netbios session',
  445: 'smb (windows file sharing)',
  3389: 'rdp (remote desktop)',
  8080: 'http-alt (alternative web)',
  1337: 'backdoor listener',
  4444: 'metasploit payload listener',
};

function getServiceName(port: number, proto: string): string {
  if (PORT_SERVICES[port]) return PORT_SERVICES[port];
  return `${proto.toLowerCase()}/${port}`;
}

export default function Analyze({ packets }: Props) {
  let small = 0;
  let medium = 0;
  let large = 0;

  packets.forEach(p => {
    if (p.length < 64) small++;
    else if (p.length <= 512) medium++;
    else large++;
  });

  const distData = [
    { name: 'small (<64b)', count: small, fill: '#16a34a' },
    { name: 'medium (64-512b)', count: medium, fill: '#e2b714' },
    { name: 'large (>512b)', count: large, fill: '#0284c7' },
  ];

  const flows: Record<string, { src: string; dst: string; count: number; bytes: number; proto: string }> = {};

  packets.forEach(p => {
    if (p.src_ip && p.dst_ip) {
      const key = `${p.src_ip}→${p.dst_ip}`;
      if (flows[key]) {
        flows[key].count++;
        flows[key].bytes += p.length;
      } else {
        flows[key] = {
          src: p.src_ip,
          dst: p.dst_ip,
          count: 1,
          bytes: p.length,
          proto: p.protocol,
        };
      }
    }
  });

  const sortedFlows = Object.values(flows)
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 6);

  const portTraffic: Record<number, { port: number; service: string; count: number; bytes: number; protocol: string }> = {};
  let totalBytes = 0;

  packets.forEach(p => {
    totalBytes += p.length;
    const ports = [p.dst_port, p.src_port];
    let matchedPort: number | null = null;
    
    for (const port of ports) {
      if (port !== null) {
        matchedPort = port;
        if (PORT_SERVICES[port]) {
          break;
        }
      }
    }

    if (matchedPort !== null) {
      const service = getServiceName(matchedPort, p.protocol);
      if (portTraffic[matchedPort]) {
        portTraffic[matchedPort].count++;
        portTraffic[matchedPort].bytes += p.length;
      } else {
        portTraffic[matchedPort] = {
          port: matchedPort,
          service,
          count: 1,
          bytes: p.length,
          protocol: p.protocol,
        };
      }
    }
  });

  const sortedPorts = Object.values(portTraffic)
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 6);

  function fmtBytes(b: number): string {
    if (b >= 1048576) return `${(b / 1048576).toFixed(1)} mb`;
    if (b >= 1024) return `${(b / 1024).toFixed(1)} kb`;
    return `${b} b`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '0.9rem' }}>
        
        {}
        <div className="card" style={{ gridColumn: 'span 4', minHeight: '300px' }}>
          <div className="card-title">
            <span className="icon">📊</span>
            packet size distribution
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={distData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.03)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-deep)', borderColor: 'var(--border)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distData.map((entry, index) => (
                    <Bar key={`cell-${index}`} dataKey="count" fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {}
        <div style={{ gridColumn: 'span 4', minHeight: '300px' }}>
          <Topology packets={packets} />
        </div>

        {}
        <div className="card" style={{ gridColumn: 'span 4', minHeight: '300px' }}>
          <div className="card-title">
            <span className="icon">⇄</span>
            active conversation flows (top 6 by volume)
          </div>
          <div style={{ overflowX: 'auto', flex: 1, marginTop: '0.5rem' }}>
            {sortedFlows.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textAlign: 'center', padding: '4rem 0' }}>
                waiting for IP conversations...
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.66rem', fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.4rem 0.2rem' }}>source ip</th>
                    <th></th>
                    <th>destination ip</th>
                    <th style={{ textAlign: 'center' }}>packets</th>
                    <th style={{ textAlign: 'right', paddingRight: '0.2rem' }}>bytes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFlows.map((f, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)', color: 'var(--text-primary)' }}>
                      <td style={{ padding: '0.5rem 0.2rem', color: 'var(--text-bright)' }}>{f.src}</td>
                      <td style={{ color: 'var(--text-dim)' }}>→</td>
                      <td>{f.dst}</td>
                      <td style={{ textAlign: 'center', color: 'var(--accent-cyan)' }}>{f.count}</td>
                      <td style={{ textAlign: 'right', color: 'var(--accent-yellow2)', paddingRight: '0.2rem', fontWeight: 600 }}>
                        {fmtBytes(f.bytes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.9rem' }}>
        <div className="card" style={{ minHeight: '260px' }}>
          <div className="card-title">
            <span className="icon">⚓</span>
            network services & port traffic analyzer
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.6rem' }}>
              analyzed {sortedPorts.length} active service ports
            </span>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '0.6rem' }}>
            {sortedPorts.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textAlign: 'center', padding: '3rem 0' }}>
                waiting for active socket ports...
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.66rem', fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.4rem 0.2rem' }}>port</th>
                    <th>assigned service description</th>
                    <th style={{ textAlign: 'center' }}>protocol</th>
                    <th style={{ textAlign: 'center' }}>packets</th>
                    <th style={{ textAlign: 'right' }}>bytes volume</th>
                    <th style={{ textAlign: 'right', paddingRight: '0.2rem' }}>load share</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPorts.map((pt, idx) => {
                    const share = totalBytes > 0 ? ((pt.bytes / totalBytes) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)', color: 'var(--text-primary)' }}>
                        <td style={{ padding: '0.5rem 0.2rem', color: 'var(--accent-yellow)', fontWeight: 700 }}>{pt.port}</td>
                        <td style={{ color: 'var(--text-bright)' }}>{pt.service}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge badge-tcp`} style={{ padding: '0.1rem 0.3rem', fontSize: '0.55rem' }}>
                            {pt.protocol.toLowerCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{pt.count}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-primary)', fontWeight: 500 }}>{fmtBytes(pt.bytes)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--accent-cyan)', paddingRight: '0.2rem', fontWeight: 600 }}>
                          {share}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}