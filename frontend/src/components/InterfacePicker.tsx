

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API = 'http://localhost:8050';

interface Props {
  isCapturing: boolean;
  onCapturingChange: (val: boolean) => void;
}

export default function InterfacePicker({ isCapturing, onCapturingChange }: Props) {
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/interfaces`)
      .then(r => r.json())
      .then(d => {
        setInterfaces(d.interfaces || []);
        if (d.interfaces?.length) setSelected(d.interfaces[0]);
      })
      .catch(() => setError('backend offline'));
  }, []);

  const handleStart = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await fetch(`${API}/start?iface=${encodeURIComponent(selected)}`, { method: 'POST' });
      onCapturingChange(true);
      setError('');
    } catch {
      setError('failed to start');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await fetch(`${API}/stop`, { method: 'POST' });
      onCapturingChange(false);
    } catch {
      setError('failed to stop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
      {error && (
        <span style={{ fontSize: '0.65rem', color: 'var(--accent-red)' }}>{error}</span>
      )}

      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        disabled={isCapturing}
        style={{ minWidth: '180px' }}
        title="network interface"
      >
        {interfaces.length === 0 && <option>loading interfaces...</option>}
        {interfaces.map(i => <option key={i} value={i}>{i}</option>)}
      </select>

      {!isCapturing ? (
        <motion.button
          className="btn btn-yellow"
          onClick={handleStart}
          disabled={loading || !selected}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
        >
          {loading ? 'starting...' : '▶ start capture'}
        </motion.button>
      ) : (
        <motion.button
          className="btn btn-danger"
          onClick={handleStop}
          disabled={loading}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
        >
          {loading ? 'stopping...' : '■ stop capture'}
        </motion.button>
      )}
    </div>
  );
}