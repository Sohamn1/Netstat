

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Topic {
  id: string;
  title: string;
  category: string;
  content: React.ReactNode;
}

export default function Wiki() {
  const [activeTopic, setActiveTopic] = useState('sniffing');

  const topics: Topic[] = [
    {
      id: 'sniffing',
      title: 'packet sniffing',
      category: 'basics',
      content: (
        <div>
          <h3>what is packet sniffing?</h3>
          <p>packet sniffing is the process of intercepting and logging raw traffic passing over a digital network. every piece of data transmitted over the internet is chopped up into small blocks called <strong>packets</strong>.</p>
          <p>under normal operations, a network interface card (NIC) only listens to frames addressed directly to its physical MAC address or broadcast addresses. to sniff all traffic, tools like Wireshark and NetSight put the NIC into <strong>promiscuous mode</strong>, disabling this hardware filter so the card reads all frames arriving on the wire.</p>
          
          <div className="divider" />
          
          <h4>monitor mode vs. promiscuous mode</h4>
          <p>while promiscuous mode allows capturing all traffic on a local ethernet segment (or associated Wi-Fi network), it requires the card to remain connected to the access point. <strong>monitor mode</strong> goes a step further, allowing a wireless card to capture raw packets from the air without associating with any network at all. this is used for sniffing 802.11 management frames (beacons, association requests).</p>
          
          <div className="divider" />
          
          <h4>raw sockets & capture wrappers</h4>
          <p>packet capture is handled at the kernel level. applications open a raw socket (e.g. <code>socket(AF_PACKET, SOCK_RAW)</code> in Linux) to receive packet buffers before the OS network stack parses or strips their headers. NetSight uses <strong>Scapy</strong> (which wraps <strong>Npcap</strong> on Windows or <strong>libpcap</strong> on Unix) to access these buffers directly.</p>
          
          <div className="divider" />
          
          <h4>packet encapsulation structure</h4>
          <p>data travels through the stack by getting wrapped in layer envelopes (encapsulation):</p>
          <pre style={{
            background: 'var(--bg-deep)',
            padding: '0.6rem',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            lineHeight: '1.4'
          }}>
{`+-----------------------------------------------------------+
| Frame Header (Ethernet: MAC Src/Dst, EthType)             |  <- Layer 2
+-----------------------------------------------------------+
| Packet Header (IPv4/IPv6: IPs, TTL, Protocol)             |  <- Layer 3
+-----------------------------------------------------------+
| Segment Header (TCP/UDP: Ports, Flags, Seq)               |  <- Layer 4
+-----------------------------------------------------------+
| Application Data (HTTP, DNS Payload, TLS Raw bytes)       |  <- Layer 7
+-----------------------------------------------------------+`}
          </pre>
        </div>
      ),
    },
    {
      id: 'ipv4',
      title: 'ipv4 header',
      category: 'layer 3',
      content: (
        <div>
          <h3>internet protocol version 4 (ipv4)</h3>
          <p>IPv4 is the primary protocol of the network layer. it is responsible for routing packets across network boundaries using 32-bit logical addresses.</p>
          
          <div className="divider" />
          
          <h4>ipv4 header layout</h4>
          <p>an IPv4 header is typically 20 bytes long. here is its detailed layout:</p>
          <pre style={{
            background: 'var(--bg-deep)',
            padding: '0.6rem',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            lineHeight: '1.3'
          }}>
{` 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|Version|  IHL  |Type of Service|          Total Length         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Identification        |Flags|      Fragment Offset    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Time to Live |    Protocol   |        Header Checksum        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Source IP Address                       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Destination IP Address                     |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+`}
          </pre>
          
          <div className="divider" />
          
          <h4>key fields explained:</h4>
          <ul>
            <li><strong>IHL (Internet Header Length):</strong> tells the receiver where the header ends and payload starts (usually 5, representing 20 bytes).</li>
            <li><strong>Time to Live (TTL):</strong> an 8-bit counter decremented by 1 at each router hop. when it hits 0, the packet is discarded, preventing endless routing loops.</li>
            <li><strong>Protocol:</strong> identifies the Layer 4 protocol inside (e.g. 6 = TCP, 17 = UDP, 1 = ICMP).</li>
            <li><strong>Fragmentation Fields:</strong> <em>Identification</em>, <em>Flags</em>, and <em>Fragment Offset</em> are used when a packet is too large for the physical link (MTU) and must be broken down and reassembled by the receiver.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'tcp',
      title: 'tcp protocol',
      category: 'layer 4',
      content: (
        <div>
          <h3>transmission control protocol (tcp)</h3>
          <p>TCP provides a connection-oriented, reliable, and byte-stream service. it guarantees packet delivery, ordering, and integrity.</p>
          
          <div className="divider" />
          
          <h4>tcp header layout</h4>
          <pre style={{
            background: 'var(--bg-deep)',
            padding: '0.6rem',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            lineHeight: '1.3'
          }}>
{` 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |        Destination Port       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Sequence Number                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Acknowledgment Number                     |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Data |           |U|A|P|R|S|F|                               |
| Offset| Reserved  |R|C|S|S|Y|I|            Window             |
|       |           |G|K|H|T|N|N|                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|    Checksum                   |         Urgent Pointer        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+`}
          </pre>
          
          <div className="divider" />
          
          <h4>the tcp 3-way handshake</h4>
          <p>TCP connections are initialized via a structured handshake sequence:</p>
          <pre style={{
            background: 'var(--bg-deep)',
            padding: '0.6rem',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            lineHeight: '1.4'
          }}>
{`Client                                                   Server
  |                                                        |
  |  1. SYN (seq=x)                                        |
  |------------------------------------------------------->|
  |                                                        |
  |                                 2. SYN-ACK (seq=y, ack=x+1)
  |<-------------------------------------------------------|
  |                                                        |
  |  3. ACK (seq=x+1, ack=y+1)                             |
  |------------------------------------------------------->|
  v                                                        v
[CONNECTED]                                           [CONNECTED]`}
          </pre>
          
          <div className="divider" />
          
          <h4>tcp flag functions & connection states:</h4>
          <ul>
            <li><strong>SYN:</strong> initiates a connection; synchronizes sequence numbers.</li>
            <li><strong>ACK:</strong> indicates that the acknowledgment field contains valid confirmation.</li>
            <li><strong>FIN:</strong> client has no more data; requests session termination.</li>
            <li><strong>RST:</strong> aborts the connection instantly; indicates port closed or reset condition.</li>
            <li><strong>Window Size:</strong> used for flow control. represents the number of bytes the sender is willing to receive without acknowledgment.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'udp',
      title: 'udp protocol',
      category: 'layer 4',
      content: (
        <div>
          <h3>user datagram protocol (udp)</h3>
          <p>UDP is a simple, transaction-oriented, connectionless protocol. it does not maintain session state, track sequences, or perform flow control.</p>
          
          <div className="divider" />
          
          <h4>udp header layout</h4>
          <p>a UDP header is extremely compact, containing only 4 fields (8 bytes total):</p>
          <pre style={{
            background: 'var(--bg-deep)',
            padding: '0.6rem',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            lineHeight: '1.3'
          }}>
{` 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |        Destination Port       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|            Length             |            Checksum           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+`}
          </pre>
          
          <div className="divider" />
          
          <h4>comparison: tcp vs. udp</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem', margin: '0.5rem 0' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.3rem' }}>property</th>
                <th>tcp</th>
                <th>udp</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}><td style={{ padding: '0.3rem' }}>reliability</td><td className="text-green">guaranteed delivery</td><td className="text-red">best-effort (no delivery check)</td></tr>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}><td style={{ padding: '0.3rem' }}>handshake</td><td className="text-bright">3-way handshake</td><td className="text-bright">none</td></tr>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}><td style={{ padding: '0.3rem' }}>speed</td><td className="text-bright">slower (control overhead)</td><td className="text-green">fastest (low overhead)</td></tr>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}><td style={{ padding: '0.3rem' }}>packets</td><td className="text-bright">data streams</td><td className="text-bright">independent datagrams</td></tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'dns',
      title: 'dns queries',
      category: 'layer 7',
      content: (
        <div>
          <h3>domain name system (dns)</h3>
          <p>DNS maps readable domain names (like <code>github.com</code>) to network-addressable IP addresses. it runs over UDP on port 53.</p>
          
          <div className="divider" />
          
          <h4>dns message structure</h4>
          <p>DNS queries and responses share the same message format:</p>
          <pre style={{
            background: 'var(--bg-deep)',
            padding: '0.6rem',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            lineHeight: '1.4'
          }}>
{`+-----------------------------------------------------------+
| Header (Transaction ID, Flags, Query/Answer counts)       |
+-----------------------------------------------------------+
| Question Block (Requested Domain: google.com, Type: A)     |
+-----------------------------------------------------------+
| Answer Block (IP mappings, TTL, Record Type)               |
+-----------------------------------------------------------+
| Authority Block (Name Server records)                     |
+-----------------------------------------------------------+
| Additional Block (Extra Address records)                  |
+-----------------------------------------------------------+`}
          </pre>
          
          <div className="divider" />
          
          <h4>dns records types</h4>
          <ul>
            <li><strong>A Record:</strong> maps a hostname to a 32-bit IPv4 address (e.g. <code>192.0.2.1</code>).</li>
            <li><strong>AAAA Record:</strong> maps a hostname to a 128-bit IPv6 address.</li>
            <li><strong>CNAME:</strong> maps an alias name to the canonical domain name.</li>
            <li><strong>MX:</strong> mail exchange records designating the server handling email for the domain.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'arp',
      title: 'arp protocol',
      category: 'layer 3',
      content: (
        <div>
          <h3>address resolution protocol (arp)</h3>
          <p>ARP is a link-layer binding protocol used to map an IPv4 address to its physical hardware MAC address on a local area network (LAN).</p>
          
          <div className="divider" />
          
          <h4>arp resolution sequence</h4>
          <p>when a host wants to send data to local IP <code>192.168.0.1</code> but does not have the MAC address in its local cache, it broadcasts an <strong>ARP Request</strong>:</p>
          <pre style={{
            background: 'var(--bg-deep)',
            padding: '0.6rem',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            lineHeight: '1.4'
          }}>
{`1. ARP Request (Broadcast: FF:FF:FF:FF:FF:FF)
   "who has 192.168.0.1? tell 192.168.0.102"
   
2. ARP Reply (Unicast to 192.168.0.102)
   "192.168.0.1 is at 00:0c:29:42:12:13"`}
          </pre>
          
          <div className="divider" />
          
          <h4>arp spoofing / cache poisoning</h4>
          <p>because ARP has no session states or verification, a computer can send an unsolicited (Gratuitous) ARP reply to the router, claiming <code>"192.168.0.102 is at [hacker's MAC]"</code>. the router will silently update its lookup cache. the hacker can now perform a <strong>Man-in-the-Middle (MitM)</strong> attack, receiving all inbound and outbound traffic.</p>
        </div>
      ),
    },
    {
      id: 'ids',
      title: 'threats & port scans',
      category: 'security',
      content: (
        <div>
          <h3>intrusion detection systems (ids)</h3>
          <p>passive packet sniffers can act as light signature-based intrusion detection layers. NetSight parses packet headers to spot security violations.</p>
          
          <div className="divider" />
          
          <h4>1. syn stealth scans (half-open scanning)</h4>
          <p>nmap and port scanners find open ports by initiating a connection but never completing it. they send a <code>SYN</code>, receive a <code>SYN-ACK</code> from the open port, but immediately reply with a <code>RST</code> (Reset) instead of an <code>ACK</code>.</p>
          <p>this avoids establishing a socket connection and leaves the connection "half-open", bypassing old application logging systems. NetSight tracks when a single IP queries <strong>&ge; 15</strong> (greater than or equal to 15) different destination ports within a rolling 5-second window, signaling an active port scan.</p>
          
          <div className="divider" />
          
          <h4>2. backdoor ports mapping</h4>
          <p>certain ports are designated standard flags because they are bound by common malware families and exploit modules:</p>
          <ul>
            <li><strong>Port 4444:</strong> default listener port for <strong>Metasploit</strong> reverse shells.</li>
            <li><strong>Port 1337:</strong> standard port bound by custom backdoor listeners.</li>
            <li><strong>Port 31337:</strong> signature port bound by the <strong>Back Orifice</strong> Trojan.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'guide',
      title: 'netsight guide',
      category: 'user guide',
      content: (
        <div>
          <h3>netsight user interface guide</h3>
          <p>welcome to NetSight. this platform acts as an educational dashboard to analyze live network data feeds captured directly from your local hardware interfaces.</p>
          
          <div className="divider" />
          
          <h4>1. live dashboard widgets</h4>
          <ul>
            <li><strong>traffic timeline (60s):</strong> displays active network throughput. the yellow area tracks data rate in bytes per second, while the blue line records packet frequency in packets per second.</li>
            <li><strong>protocol breakdown:</strong> an animated pie chart summarizing packet totals parsed per standard Layer 4 and Layer 7 protocol.</li>
            <li><strong>top talkers:</strong> lists the top bandwidth-consuming local and external IP addresses active on your network card.</li>
            <li><strong>dns domain tracker:</strong> displays active hostname resolutions captured from UDP port 53 packets. it aggregates duplicate lookups to list the most active external domains.</li>
            <li><strong>threat feed:</strong> monitors security violations in real-time, highlighting active port scan signatures or connections targeting exploit backdoor listener ports.</li>
            <li><strong>live packet feed:</strong> a scrolling log of network packets. hover to pause scroll, click any packet to inspect its layers and payload hexdump.</li>
          </ul>

          <div className="divider" />

          <h4>2. quick filters & pcap export</h4>
          <ul>
            <li><strong>global protocol filters:</strong> select buttons like <code>tcp</code>, <code>dns</code>, or <code>threats</code> in the top navigation bar to isolate all panels on the dashboard to just those packets.</li>
            <li><strong>pcap export:</strong> once you stop a live capture session, click <code>export pcap</code> to download a Wireshark-compatible packet trace file containing your captured frame sequences.</li>
          </ul>
        </div>
      ),
    },
  ];

  const currentTopic = topics.find(t => t.id === activeTopic) || topics[0];

  return (
    <div style={{ display: 'flex', gap: '1.2rem', height: 'calc(100vh - 200px)' }} className="fade-in-up">
      {}
      <div style={{
        flex: 3.5,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        overflowY: 'auto',
        height: '100%',
      }}>
        {topics.map(t => {
          const isActive = t.id === activeTopic;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTopic(t.id)}
              style={{
                textAlign: 'left',
                padding: '0.65rem 0.8rem',
                background: isActive ? 'var(--accent-yellow)' : 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: isActive ? 'var(--text-on-yellow)' : 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontWeight: isActive ? 700 : 400,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{t.title.toLowerCase()}</span>
              <span style={{
                fontSize: '0.55rem',
                color: isActive ? 'var(--text-on-yellow)' : 'var(--text-muted)',
                opacity: isActive ? 0.8 : 0.6,
                textTransform: 'lowercase',
              }}>
                {t.category}
              </span>
            </button>
          );
        })}
      </div>

      {}
      <div className="card" style={{
        flex: 8.5,
        background: 'var(--bg-card)',
        padding: '1.5rem 1.8rem',
        overflowY: 'auto',
        height: '100%',
        lineHeight: '1.6',
        fontSize: '0.75rem',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTopic.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem',
            }}
          >
            {currentTopic.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}