

import { useEffect, useRef, useState, useCallback } from 'react';

export interface PacketEntry {
  timestamp: string;
  timestamp_ms: number;
  protocol: string;
  src_ip: string | null;
  dst_ip: string | null;
  src_port: number | null;
  dst_port: number | null;
  length: number;
  flags: string | null;
  ttl: number | null;
  app_protocol: string | null;
  suspicious: boolean;
  hexdump?: string;
  layers?: string[];
  info?: string | null;
  dns_query?: string | null;
  dns_qtype?: string | null;
  dns_resolved_ips?: string[] | null;
  frame_number?: number;
  src_mac?: string | null;
  dst_mac?: string | null;
  ip_id?: number | null;
  tcp_window?: number | null;
  tcp_seq?: number | null;
  geo?: { country?: string; countryCode?: string; city?: string; lat?: number; lon?: number; isp?: string };
}

export interface TimelinePoint {
  t: string;
  bps: number;
  pps: number;
}

export interface Alert {
  title: string;
  detail: string;
  level: 'critical' | 'warning' | 'info';
  time: string;
}

export interface ProcessEntry {
  pid: number | string;
  name: string;
  cpu: number;
  memory: number;
  network: number;
  running: boolean;
}

export interface Snapshot {
  uptime: number;
  total_packets: number;
  total_bytes: number;
  packets_per_sec: number;
  bytes_per_sec: number;
  unique_ips: number;
  protocol_counts: Record<string, number>;
  top_talkers: Array<{ ip: string; bytes: number }>;
  timeline: TimelinePoint[];
  recent_packets: PacketEntry[];
  alerts: Alert[];
  processes: ProcessEntry[];
}

export type WsStatus = 'connecting' | 'connected' | 'disconnected';

const WS_URL = 'ws://localhost:8050/ws';
const RECONNECT_BASE_MS = 1500;

export function useWebSocket() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      retryRef.current = 0;
    };

    ws.onmessage = (evt) => {
      try {
        setData(JSON.parse(evt.data));
      } catch {  }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      const delay = Math.min(RECONNECT_BASE_MS * 2 ** retryRef.current, 30000);
      retryRef.current++;
      timerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      timerRef.current && clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { data, status };
}