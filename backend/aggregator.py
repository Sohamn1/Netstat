

import time
import threading
from collections import defaultdict, deque
from parser import parse_packet
import sniffer
import psutil

WINDOW_SEC = 60
FEED_SIZE = 80
TIMELINE_POINTS = 60
PORT_SCAN_THRESHOLD = 15

_lock = threading.Lock()

_timeline: deque = deque(maxlen=TIMELINE_POINTS)
_current_second_bytes = 0
_current_second_packets = 0
_last_tick = time.time()

_protocol_counts: dict[str, int] = defaultdict(int)

_talker_bytes: dict[str, int] = defaultdict(int)

_recent_packets: deque = deque(maxlen=FEED_SIZE)

_alerts: deque = deque(maxlen=30)

_port_scan_tracker: dict[str, list] = defaultdict(list)

_total_packets = 0
_total_bytes = 0
_session_start = time.time()

_geo_cache: dict[str, dict] = {}

_unique_ips: set = set()

_port_pid_map: dict[int, int] = {}
_pid_bytes_accumulated: dict[int, int] = defaultdict(int)
_pid_network_speed: dict[int, float] = defaultdict(float)
_process_lock = threading.Lock()
_last_process_tick = time.time()
_tick_count = 0

def update_port_pid_map():
    
    try:
        new_map = {}
        for conn in psutil.net_connections(kind='inet'):
            if conn.laddr and conn.pid:
                new_map[conn.laddr.port] = conn.pid
        global _port_pid_map
        _port_pid_map = new_map
    except Exception:
        pass

def process_loop():
    
    global _current_second_bytes, _current_second_packets, _last_tick
    global _total_packets, _total_bytes

    while True:
        try:
            pkt = sniffer.packet_queue.get(timeout=1.0)
        except Exception:
            _tick()
            continue

        parsed = parse_packet(pkt)
        if not parsed:
            continue

        with _lock:
            _total_packets += 1
            _total_bytes += parsed["length"]
            _current_second_bytes += parsed["length"]
            _current_second_packets += 1

            _protocol_counts[parsed["protocol"]] += 1

            if parsed["src_ip"]:
                _talker_bytes[parsed["src_ip"]] += parsed["length"]
                _unique_ips.add(parsed["src_ip"])
            if parsed["dst_ip"]:
                _unique_ips.add(parsed["dst_ip"])

            _recent_packets.appendleft(parsed)

            _check_alerts(parsed)

        sport = parsed.get("src_port")
        dport = parsed.get("dst_port")
        associated_pids = set()
        
        if sport and sport in _port_pid_map:
            associated_pids.add(_port_pid_map[sport])
        if dport and dport in _port_pid_map:
            associated_pids.add(_port_pid_map[dport])

        if associated_pids:
            with _process_lock:
                for pid in associated_pids:
                    _pid_bytes_accumulated[pid] += parsed["length"]

        _tick()


def _tick():
    
    global _current_second_bytes, _current_second_packets, _last_tick
    global _last_process_tick, _tick_count
    
    now = time.time()
    if now - _last_tick >= 1.0:
        with _lock:
            _timeline.append({
                "t": time.strftime("%H:%M:%S"),
                "bps": _current_second_bytes,
                "pps": _current_second_packets,
            })
            _current_second_bytes = 0
            _current_second_packets = 0
            
            dt = now - _last_process_tick
            if dt > 0:
                with _process_lock:
                    for pid, bytes_count in _pid_bytes_accumulated.items():
                        _pid_network_speed[pid] = bytes_count / dt
                    _pid_bytes_accumulated.clear()
            _last_process_tick = now
            
        _last_tick = now
        
        _tick_count += 1
        if _tick_count % 2 == 0:
            threading.Thread(target=update_port_pid_map, daemon=True).start()


def _check_alerts(parsed: dict):
    
    src = parsed.get("src_ip")
    dst_port = parsed.get("dst_port")
    now = time.time()

    if src and dst_port:
        _port_scan_tracker[src] = [
            e for e in _port_scan_tracker[src] if now - e["t"] < 5
        ]
        _port_scan_tracker[src].append({"t": now, "port": dst_port})

        unique_ports = len(set(e["port"] for e in _port_scan_tracker[src]))
        if unique_ports >= PORT_SCAN_THRESHOLD:
            _push_alert("PORT SCAN", f"{src} scanned {unique_ports} ports in 5s", "critical")
            _port_scan_tracker[src] = []

    if parsed.get("suspicious"):
        _push_alert(
            "SUSPICIOUS PORT",
            f"{src}:{parsed.get('src_port')} → {parsed.get('dst_ip')}:{dst_port}",
            "warning",
        )


def _push_alert(title: str, detail: str, level: str):
    
    recent_titles = [a["title"] for a in list(_alerts)[:5]]
    if title in recent_titles:
        return
    _alerts.appendleft({
        "title": title,
        "detail": detail,
        "level": level,
        "time": time.strftime("%H:%M:%S"),
    })


def get_process_list() -> list[dict]:
    targets = {"chrome.exe", "code.exe", "vscode.exe", "discord.exe", "steam.exe", "firefox.exe"}
    
    stats = {}
    for t in targets:
        display_name = "VSCode.exe" if t in ("code.exe", "vscode.exe") else ("Steam.exe" if t == "steam.exe" else ("Firefox.exe" if t == "firefox.exe" else ("Discord.exe" if t == "discord.exe" else "chrome.exe")))
        stats[t] = {
            "pid": "—",
            "name": display_name,
            "cpu": 0.0,
            "memory": 0,
            "network": 0.0,
            "running": False
        }
        
    try:
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
            try:
                name = proc.info['name']
                if not name:
                    continue
                name_lower = name.lower()
                
                is_target = name_lower in targets
                pid = proc.info['pid']
                net_speed = 0.0
                
                with _process_lock:
                    if pid in _pid_network_speed:
                        net_speed = _pid_network_speed[pid]
                        
                should_include = is_target or (net_speed > 10.0)
                
                if should_include:
                    key = name_lower if is_target else name_lower
                    cpu = proc.info['cpu_percent'] or 0.0
                    mem = proc.info['memory_info'].rss if proc.info['memory_info'] else 0
                    
                    if is_target:
                        entry = stats[name_lower]
                        if not entry["running"]:
                            entry["pid"] = pid
                            entry["running"] = True
                        entry["cpu"] += cpu
                        entry["memory"] += mem
                        entry["network"] += net_speed
                    else:
                        if key not in stats:
                            stats[key] = {
                                "pid": pid,
                                "name": name,
                                "cpu": 0.0,
                                "memory": 0,
                                "network": 0.0,
                                "running": True
                            }
                        stats[key]["cpu"] += cpu
                        stats[key]["memory"] += mem
                        stats[key]["network"] += net_speed
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
    except Exception:
        pass
        
    result_list = []
    for t in ["chrome.exe", "code.exe", "discord.exe", "steam.exe", "firefox.exe"]:
        result_list.append(stats[t])
        
    others = []
    for k, v in stats.items():
        if k not in ["chrome.exe", "code.exe", "discord.exe", "steam.exe", "firefox.exe"] and v["running"]:
            others.append(v)
    others.sort(key=lambda x: x["network"], reverse=True)
    
    result_list.extend(others)
    return result_list


def get_snapshot() -> dict:
    
    with _lock:
        uptime = int(time.time() - _session_start)
        top_talkers = sorted(
            [{"ip": k, "bytes": v} for k, v in _talker_bytes.items()],
            key=lambda x: x["bytes"],
            reverse=True,
        )[:10]

        last_bps = _timeline[-1]["bps"] if _timeline else 0
        last_pps = _timeline[-1]["pps"] if _timeline else 0

        return {
            "uptime": uptime,
            "total_packets": _total_packets,
            "total_bytes": _total_bytes,
            "packets_per_sec": last_pps,
            "bytes_per_sec": last_bps,
            "unique_ips": len(_unique_ips),
            "protocol_counts": dict(_protocol_counts),
            "top_talkers": top_talkers,
            "timeline": list(_timeline),
            "recent_packets": list(_recent_packets)[:50],
            "alerts": list(_alerts)[:20],
            "processes": get_process_list(),
        }


def reset():
    global _total_packets, _total_bytes, _session_start, _last_process_tick
    with _lock:
        _protocol_counts.clear()
        _talker_bytes.clear()
        _recent_packets.clear()
        _alerts.clear()
        _timeline.clear()
        _port_scan_tracker.clear()
        _unique_ips.clear()
        _total_packets = 0
        _total_bytes = 0
        _session_start = time.time()
    with _process_lock:
        _pid_bytes_accumulated.clear()
        _pid_network_speed.clear()
    _last_process_tick = time.time()