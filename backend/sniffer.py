

import threading
import queue
from scapy.all import AsyncSniffer, IP, IPv6, TCP, UDP, ICMP, ARP, DNS, Raw
from scapy.layers.http import HTTP

packet_queue: queue.Queue = queue.Queue(maxsize=2000)
_sniffer: AsyncSniffer | None = None
_lock = threading.Lock()


captured_packets = []
_max_store = 5000
_packets_lock = threading.Lock()

def _process_packet(pkt):
    
    global captured_packets
    try:
        packet_queue.put_nowait(pkt)
    except queue.Full:
        pass
        
    with _packets_lock:
        if len(captured_packets) < _max_store:
            captured_packets.append(pkt)


def start_sniffing(iface: str):
    global _sniffer, captured_packets
    with _packets_lock:
        captured_packets = []
    with _lock:
        if _sniffer and _sniffer.running:
            return

        _sniffer = AsyncSniffer(
            iface=iface,
            prn=_process_packet,
            store=False,
        )
        _sniffer.start()


def stop_sniffing():
    global _sniffer
    with _lock:
        if _sniffer and _sniffer.running:
            _sniffer.stop()
            _sniffer = None


def is_running() -> bool:
    with _lock:
        return _sniffer is not None and _sniffer.running


def get_interfaces() -> list[str]:
    
    from scapy.arch.windows import get_windows_if_list
    try:
        ifaces = get_windows_if_list()
        return [i.get("name", i.get("description", "unknown")) for i in ifaces]
    except Exception:
        from scapy.interfaces import get_if_list
        return get_if_list()