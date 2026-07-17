

import time
from scapy.all import Ether, IP, IPv6, TCP, UDP, ICMP, ARP, DNS, Raw
from scapy.packet import Packet

PORT_MAP = {
    20: "FTP-DATA", 21: "FTP", 22: "SSH", 23: "TELNET",
    25: "SMTP", 53: "DNS", 67: "DHCP", 68: "DHCP",
    80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS",
    465: "SMTPS", 587: "SMTP", 993: "IMAPS", 995: "POP3S",
    1433: "MSSQL", 1337: "⚠ BACKDOOR", 3306: "MYSQL",
    3389: "RDP", 4444: "⚠ METASPLOIT", 5432: "POSTGRES",
    5900: "VNC", 6379: "REDIS", 8080: "HTTP-ALT",
    8443: "HTTPS-ALT", 27017: "MONGODB",
}

SUSPICIOUS_PORTS = {1337, 4444, 31337, 6667, 6666, 12345, 54321}


from scapy.utils import hexdump
import threading

_frame_counter = 0
_counter_lock = threading.Lock()

def parse_packet(pkt: Packet) -> dict | None:
    global _frame_counter
    res = _parse_core(pkt)
    if res:
        with _counter_lock:
            _frame_counter += 1
            res["frame_number"] = _frame_counter
        try:
            res["hexdump"] = hexdump(pkt[:512], dump=True)
        except Exception:
            res["hexdump"] = ""
        try:
            res["layers"] = [layer.__name__ for layer in pkt.layers()]
        except Exception:
            res["layers"] = []
    return res

def _parse_core(pkt: Packet) -> dict | None:
    
    result = {
        "timestamp": time.strftime("%H:%M:%S"),
        "timestamp_ms": int(time.time() * 1000),
        "protocol": "OTHER",
        "src_ip": None,
        "dst_ip": None,
        "src_port": None,
        "dst_port": None,
        "length": len(pkt),
        "flags": None,
        "ttl": None,
        "app_protocol": None,
        "suspicious": False,
        "info": None,
        "dns_query": None,
        "dns_qtype": None,
        "dns_resolved_ips": None,
        "src_mac": None,
        "dst_mac": None,
        "ip_id": None,
        "tcp_window": None,
        "tcp_seq": None,
    }

    if Ether in pkt:
        result["src_mac"] = pkt[Ether].src
        result["dst_mac"] = pkt[Ether].dst

    if ARP in pkt:
        arp = pkt[ARP]
        result["protocol"] = "ARP"
        result["src_ip"] = arp.psrc
        result["dst_ip"] = arp.pdst
        result["info"] = f"who has {arp.pdst}? tell {arp.psrc}" if arp.op == 1 else f"{arp.psrc} is at {arp.hwsrc}"
        return result

    if IP in pkt:
        ip_layer = pkt[IP]
        result["src_ip"] = ip_layer.src
        result["dst_ip"] = ip_layer.dst
        result["ttl"] = ip_layer.ttl
        result["ip_id"] = ip_layer.id
        result["protocol"] = "IP"
        result["info"] = f"ipv4 packet, len={ip_layer.len}"

        if ICMP in pkt:
            icmp = pkt[ICMP]
            result["protocol"] = "ICMP"
            result["info"] = f"icmp type={icmp.type} code={icmp.code}"

        elif TCP in pkt:
            tcp = pkt[TCP]
            result["protocol"] = "TCP"
            result["src_port"] = tcp.sport
            result["dst_port"] = tcp.dport
            result["flags"] = _tcp_flags(tcp.flags)
            result["tcp_window"] = tcp.window
            result["tcp_seq"] = tcp.seq
            result["info"] = f"{tcp.sport} → {tcp.dport} [{result['flags']}] seq={tcp.seq} ack={tcp.ack}"
            for port in [tcp.dport, tcp.sport]:
                if port in PORT_MAP:
                    result["app_protocol"] = PORT_MAP[port]
                    result["protocol"] = PORT_MAP[port].replace("⚠ ", "")
                    break
            if tcp.dport in SUSPICIOUS_PORTS or tcp.sport in SUSPICIOUS_PORTS:
                result["suspicious"] = True

        elif UDP in pkt:
            udp = pkt[UDP]
            result["protocol"] = "UDP"
            result["src_port"] = udp.sport
            result["dst_port"] = udp.dport
            result["info"] = f"{udp.sport} → {udp.dport} len={udp.len}"
            is_dns = (DNS in pkt) or (udp.dport == 53) or (udp.sport == 53)
            if is_dns:
                dns = pkt[DNS] if DNS in pkt else None
                if dns is None and Raw in pkt:
                    try:
                        from scapy.layers.dns import DNS as ScapyDNS
                        dns = ScapyDNS(pkt[Raw].load)
                    except Exception:
                        pass
                
                result["protocol"] = "DNS"
                result["app_protocol"] = "DNS"
                
                qtype_map = {1: "A", 28: "AAAA", 15: "MX", 5: "CNAME", 12: "PTR", 16: "TXT", 6: "SOA"}
                qtype_name = "A"
                
                if dns and dns.qd:
                    try:
                        qname = dns.qd.qname.decode('utf-8', errors='ignore')
                        if qname.endswith('.'):
                            qname = qname[:-1]
                        result["dns_query"] = qname
                        qtype_name = qtype_map.get(dns.qd.qtype, f"TYPE-{dns.qd.qtype}")
                        result["dns_qtype"] = qtype_name
                        result["info"] = f"standard query {qtype_name} {qname}"
                    except Exception:
                        result["info"] = "dns query"
                        
                if dns and dns.an:
                    try:
                        resolved = []
                        for i in range(dns.ancount):
                            rr = dns.an[i]
                            if rr.type == 1:
                                resolved.append(rr.rdata)
                        if resolved:
                            result["dns_resolved_ips"] = resolved
                            result["info"] += f" -> {', '.join(resolved)}"
                    except Exception:
                        pass
            else:
                for port in [udp.dport, udp.sport]:
                    if port in PORT_MAP:
                        result["app_protocol"] = PORT_MAP[port]
                        result["protocol"] = PORT_MAP[port]
                        break

        return result

    if IPv6 in pkt:
        ipv6 = pkt[IPv6]
        result["src_ip"] = ipv6.src
        result["dst_ip"] = ipv6.dst
        result["protocol"] = "IPv6"
        result["info"] = f"ipv6 packet, len={ipv6.plen}"
        return result

    return None


def _tcp_flags(flags) -> str:
    flag_map = {
        "F": "FIN", "S": "SYN", "R": "RST",
        "P": "PSH", "A": "ACK", "U": "URG",
    }
    active = []
    flags_str = str(flags)
    for char, name in flag_map.items():
        if char in flags_str:
            active.append(name)
    return "+".join(active) if active else str(flags)