

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from './hooks/useWebSocket';
import StatsBar from './components/StatsBar';
import InterfacePicker from './components/InterfacePicker';
import TrafficGraph from './components/TrafficGraph';
import ProtocolPie from './components/ProtocolPie';
import LiveFeed from './components/LiveFeed';
import TopTalkers from './components/TopTalkers';
import DnsTracker from './components/DnsTracker';
import AlertPanel from './components/AlertPanel';
import Analyze from './components/Analyze';
import Wiki from './components/Wiki';
import ProcessMonitor from './components/ProcessMonitor';

function cardProps(i: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.07, duration: 0.4 },
  };
}

export default function App() {
  const { data, status } = useWebSocket();
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analyze' | 'processes' | 'wiki'>('dashboard');

  const rawTimeline = data?.timeline ?? [];
  const protocols = data?.protocol_counts ?? {};
  const packets = data?.recent_packets ?? [];
  const talkers = data?.top_talkers ?? [];
  const alerts = data?.alerts ?? [];
  const processes = data?.processes ?? [];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {}
      <StatsBar data={data} status={status} isCapturing={isCapturing} />

      {}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.7rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-deep)',
        flexWrap: 'wrap',
        gap: '0.6rem',
      }}>
        {}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { id: 'dashboard', label: 'dashboard' },
            { id: 'analyze', label: 'analyze' },
            { id: 'processes', label: 'process monitor' },
            { id: 'wiki', label: 'wiki / help' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="btn"
                style={{
                  background: isActive ? 'var(--accent-yellow)' : 'var(--bg-button)',
                  color: isActive ? 'var(--text-on-yellow)' : 'var(--text-primary)',
                  borderColor: isActive ? 'var(--accent-yellow)' : 'var(--border)',
                  fontWeight: isActive ? 700 : 400,
                  fontSize: '0.7rem',
                  padding: '0.35rem 0.8rem',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginLeft: 'auto' }}>
          <InterfacePicker isCapturing={isCapturing} onCapturingChange={setIsCapturing} />
          {!isCapturing && data && data.total_packets > 0 && (
            <motion.a
              href="http://localhost:8050/download/pcap"
              download="netsight_capture.pcap"
              className="btn btn-yellow"
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
            >
              💾 export pcap
            </motion.a>
          )}
        </div>
      </div>

      {}
      {activeTab === 'dashboard' && (
        <main style={{
          flex: 1,
          padding: '1rem 1.2rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'auto auto auto',
          gap: '0.9rem',
        }}>
          {}
          <motion.div {...cardProps(0)} style={{ gridColumn: 'span 8' }}>
            <TrafficGraph timeline={rawTimeline} />
          </motion.div>

          <motion.div {...cardProps(1)} style={{ gridColumn: 'span 4' }}>
            <ProtocolPie protocolCounts={protocols} />
          </motion.div>

          {}
          <motion.div {...cardProps(2)} style={{ gridColumn: 'span 3' }}>
            <TopTalkers talkers={talkers} />
          </motion.div>

          <motion.div {...cardProps(3)} style={{ gridColumn: 'span 5' }}>
            <DnsTracker packets={packets} />
          </motion.div>

          <motion.div {...cardProps(4)} style={{ gridColumn: 'span 4' }}>
            <AlertPanel alerts={alerts} />
          </motion.div>

          {}
          <motion.div {...cardProps(5)} style={{ gridColumn: 'span 12' }}>
            <LiveFeed packets={packets} />
          </motion.div>
        </main>
      )}

      {activeTab === 'analyze' && (
        <main style={{ flex: 1, padding: '1.2rem 1.5rem' }}>
          <Analyze packets={packets} />
        </main>
      )}

      {activeTab === 'processes' && (
        <main style={{ flex: 1, padding: '1.2rem 1.5rem' }}>
          <ProcessMonitor processes={processes} />
        </main>
      )}

      {activeTab === 'wiki' && (
        <main style={{ flex: 1, padding: '1.2rem 1.5rem' }}>
          <Wiki />
        </main>
      )}

      {}
      <footer style={{
        padding: '0.5rem 1.5rem',
        borderTop: '1px solid var(--border)',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        fontSize: '0.6rem',
        color: 'var(--text-dim)',
        background: 'var(--bg-deep)',
      }}>
        <span>netsight</span>
        <span style={{ fontWeight: 600, color: 'var(--text-bright)', textAlign: 'center' }}>SOHAM GEEDH - TYCO</span>
        <span style={{ textAlign: 'right' }}>backend: localhost:8050 · ws: {status}</span>
      </footer>
    </div>
  );
}