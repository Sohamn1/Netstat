# NetSight

NetSight is an interactive network packet sniffer and system process monitor. It features real-time traffic visualization, threat detection, DNS tracking, and live network topology mapping.

## Features

- Live traffic timeline graphs.
- Detailed packet tree analysis (Frame, Ethernet II, IPv4, TCP/UDP headers and hex payload).
- Port and network service traffic analyzer.
- DNS domain resolution tracker.
- System process resource monitor (PID, CPU, Memory, and Network usage per process).
- Dynamic network topology map.

## Setup and Run

### Prerequisites

Install Npcap driver (on Windows) and python dependencies:
```cmd
pip install -r backend/requirements.txt
```

### Run Backend (Administrator Mode)
```cmd
cd backend
python main.py
```

### Run Frontend
```cmd
cd frontend
npm install
npm run dev
```
