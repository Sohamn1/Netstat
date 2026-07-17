

import { useEffect, useState } from 'react';
import type { PacketEntry } from '../hooks/useWebSocket';

interface Props {
  packets: PacketEntry[];
}

type DeviceType = 'laptop' | 'phone' | 'tv';

export default function Topology({ packets }: Props) {
  const [activeDevice, setActiveDevice] = useState<DeviceType | null>(null);

  useEffect(() => {
    if (packets.length === 0) return;

    const pkt = packets[0];
    const sport = pkt.src_port;
    const dport = pkt.dst_port;
    
    if (sport === 1900 || dport === 1900 || pkt.dst_ip === '239.255.255.250') {
      setActiveDevice('tv');
    }
    else if (sport === 5353 || dport === 5353 || pkt.protocol.toUpperCase() === 'ARP') {
      setActiveDevice('phone');
    }
    else if (pkt.src_ip && (pkt.protocol.toUpperCase() === 'TCP' || pkt.protocol.toUpperCase() === 'DNS')) {
      setActiveDevice('laptop');
    }

    const timer = setTimeout(() => {
      setActiveDevice(null);
    }, 700);

    return () => clearTimeout(timer);
  }, [packets]);

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-title" style={{ marginBottom: '0.4rem' }}>
        <span className="icon">🕸️</span>
        live network topology
        {activeDevice && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.55rem',
            color: 'var(--accent-yellow2)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            textTransform: 'lowercase',
          }}>
            ⚡ active traffic: {activeDevice}
          </span>
        )}
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.4rem 0',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.66rem',
      }}>
        {}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
        }}>
          <div style={{
            padding: '0.35rem 0.8rem',
            background: 'var(--bg-deep)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--text-bright)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}>
            <span>☁️</span> <span>internet</span>
          </div>
          {}
          <div style={{ width: '1px', height: '18px', background: 'var(--border)' }}></div>
        </div>

        {}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
        }}>
          <div style={{
            padding: '0.35rem 0.8rem',
            background: 'var(--bg-deep)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--text-bright)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}>
            <span>📶</span> <span>router</span>
          </div>
          {}
          <div style={{ width: '1px', height: '12px', background: 'var(--border)' }}></div>
        </div>

        {}
        <div style={{
          width: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {}
          <div style={{
            width: '100%',
            height: '1px',
            background: 'var(--border)',
            position: 'relative',
          }}>
            {}
            <div style={{ position: 'absolute', left: '0', top: '0', width: '1px', height: '8px', background: 'var(--border)' }}></div>
            <div style={{ position: 'absolute', left: '50%', top: '0', width: '1px', height: '8px', background: 'var(--border)' }}></div>
            <div style={{ position: 'absolute', right: '0', top: '0', width: '1px', height: '8px', background: 'var(--border)' }}></div>
          </div>

          {}
          <div style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            justifyItems: 'center',
            marginTop: '8px',
          }}>
            {}
            <div style={{
              padding: '0.4rem 0.7rem',
              background: activeDevice === 'laptop' ? 'var(--accent-yellow)' : 'var(--bg-deep)',
              color: activeDevice === 'laptop' ? 'var(--text-on-yellow)' : 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.15s ease',
              transform: activeDevice === 'laptop' ? 'scale(1.05)' : 'scale(1)',
              boxShadow: activeDevice === 'laptop' ? '0 0 10px rgba(226, 183, 20, 0.4)' : 'none',
              fontWeight: activeDevice === 'laptop' ? 700 : 400,
            }}>
              <span>💻</span> <span>laptop</span>
            </div>

            {}
            <div style={{
              padding: '0.4rem 0.7rem',
              background: activeDevice === 'phone' ? 'var(--accent-yellow)' : 'var(--bg-deep)',
              color: activeDevice === 'phone' ? 'var(--text-on-yellow)' : 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.15s ease',
              transform: activeDevice === 'phone' ? 'scale(1.05)' : 'scale(1)',
              boxShadow: activeDevice === 'phone' ? '0 0 10px rgba(226, 183, 20, 0.4)' : 'none',
              fontWeight: activeDevice === 'phone' ? 700 : 400,
            }}>
              <span>📱</span> <span>phone</span>
            </div>

            {}
            <div style={{
              padding: '0.4rem 0.7rem',
              background: activeDevice === 'tv' ? 'var(--accent-yellow)' : 'var(--bg-deep)',
              color: activeDevice === 'tv' ? 'var(--text-on-yellow)' : 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.15s ease',
              transform: activeDevice === 'tv' ? 'scale(1.05)' : 'scale(1)',
              boxShadow: activeDevice === 'tv' ? '0 0 10px rgba(226, 183, 20, 0.4)' : 'none',
              fontWeight: activeDevice === 'tv' ? 700 : 400,
            }}>
              <span>📺</span> <span>tv</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}