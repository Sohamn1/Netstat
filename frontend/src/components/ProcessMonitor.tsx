

import type { ProcessEntry } from '../hooks/useWebSocket';

interface Props {
  processes?: ProcessEntry[];
}

export default function ProcessMonitor({ processes = [] }: Props) {
  function fmtBytes(b: number): string {
    if (b >= 1073741824) return `${(b / 1073741824).toFixed(1)} GB`;
    if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MB`;
    if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${b} B`;
  }

  function fmtSpeed(b: number): string {
    if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MB/s`;
    if (b >= 1024) return `${(b / 1024).toFixed(1)} KB/s`;
    return `${b.toFixed(0)} B/s`;
  }

  const runningCount = processes.filter(p => p.running).length;
  const totalMemory = processes.reduce((acc, p) => acc + (p.running ? p.memory : 0), 0);
  const totalNetwork = processes.reduce((acc, p) => acc + (p.running ? p.network : 0), 0);

  return (
    <div className="card fade-in-up" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.8rem',
      height: 'calc(100vh - 200px)',
      background: 'var(--bg-card)',
      padding: '1.4rem 1.8rem',
    }}>
      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.6rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: '0.78rem' }}>
            <span className="icon" style={{ marginRight: '0.4rem' }}>🖥️</span>
            system process resource monitor
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            active local network socket mapping to processes (Resource Monitor mode)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.62rem', fontFamily: 'var(--font-mono)' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>active:</span> <span style={{ color: 'var(--accent-yellow2)', fontWeight: 700 }}>{runningCount}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>tot mem:</span> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{fmtBytes(totalMemory)}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>tot net:</span> <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{fmtSpeed(totalNetwork)}</span></div>
        </div>
      </div>

      {}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {processes.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textAlign: 'center', padding: '5rem 0' }}>
            no processes detected. ensure the capture is active to map connections...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.3rem', width: '80px' }}>PID</th>
                <th style={{ width: '1.2fr' }}>Process Name</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
                <th style={{ width: '100px', textAlign: 'right' }}>CPU</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Memory</th>
                <th style={{ width: '140px', textAlign: 'right', paddingRight: '0.3rem' }}>Network Usage</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => {
                const isTarget = ["chrome.exe", "vscode.exe", "discord.exe", "steam.exe", "firefox.exe"].includes(p.name.toLowerCase()) || ["code.exe"].includes(p.name.toLowerCase());
                return (
                  <tr
                    key={`${p.name}-${p.pid}`}
                    style={{
                      borderBottom: '1px solid rgba(0,0,0,0.015)',
                      color: p.running ? 'var(--text-primary)' : 'var(--text-dim)',
                      transition: 'background 0.15s ease',
                      background: p.running ? 'transparent' : 'rgba(0,0,0,0.005)',
                    }}
                  >
                    {}
                    <td style={{ padding: '0.6rem 0.3rem', color: p.running ? 'var(--text-bright)' : 'var(--text-dim)' }}>
                      {p.pid}
                    </td>

                    {}
                    <td style={{ fontWeight: isTarget ? 700 : 400, color: p.running ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                      {p.name}
                    </td>

                    {}
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.52rem',
                          padding: '0.08rem 0.3rem',
                          background: p.running ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0,0,0,0.06)',
                          color: p.running ? '#16a34a' : 'var(--text-muted)',
                          border: 'none',
                          fontWeight: 700,
                          textTransform: 'lowercase',
                        }}
                      >
                        {p.running ? 'active' : 'offline'}
                      </span>
                    </td>

                    {}
                    <td style={{ textAlign: 'right', color: p.running && p.cpu > 5.0 ? 'var(--accent-yellow2)' : 'var(--text-primary)' }}>
                      {p.running ? `${p.cpu.toFixed(1)}%` : '0.0%'}
                    </td>

                    {}
                    <td style={{ textAlign: 'right', color: p.running ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                      {p.running ? fmtBytes(p.memory) : '0 B'}
                    </td>

                    {}
                    <td style={{
                      textAlign: 'right',
                      paddingRight: '0.3rem',
                      fontWeight: p.running && p.network > 0 ? 700 : 400,
                      color: p.running && p.network > 0 ? 'var(--accent-cyan)' : 'var(--text-dim)',
                    }}>
                      {p.running ? fmtSpeed(p.network) : '0 B/s'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}