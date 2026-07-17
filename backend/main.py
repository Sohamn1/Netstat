

import asyncio
import json
import sys
import threading
import time
from contextlib import asynccontextmanager

import requests
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

import aggregator
import sniffer

def is_private_ip(ip: str) -> bool:
    if not ip:
        return True
    if ip.startswith(("127.", "192.168.", "10.", "::1", "fe80:")):
        return True
    if ip.startswith("172."):
        parts = ip.split(".")
        if len(parts) >= 2:
            try:
                second_octet = int(parts[1])
                return 16 <= second_octet <= 31
            except ValueError:
                pass
    return False


_geo_cache: dict[str, dict] = {}
_geo_lock = threading.Lock()

def lookup_geo(ip: str) -> dict:
    if is_private_ip(ip):
        return {}
    with _geo_lock:
        if ip in _geo_cache:
            return _geo_cache[ip]
        _geo_cache[ip] = {}
    try:
        r = requests.get(
            f"http://ip-api.com/json/{ip}?fields=country,countryCode,city,lat,lon,isp",
            timeout=2,
        )
        if r.status_code == 200:
            data = r.json()
            if data.get("status") == "success":
                with _geo_lock:
                    _geo_cache[ip] = data
                return data
    except Exception:
        pass
    return {}


class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        async with self._lock:
            self.active.append(ws)

    async def disconnect(self, ws: WebSocket):
        async with self._lock:
            if ws in self.active:
                self.active.remove(ws)

    async def broadcast(self, data: dict):
        msg = json.dumps(data)
        dead = []
        async with self._lock:
            targets = list(self.active)
        for ws in targets:
            try:
                await ws.send_text(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)


manager = ConnectionManager()


def _aggregator_thread():
    aggregator.process_loop()


async def _broadcast_loop():
    
    while True:
        await asyncio.sleep(0.5)
        if not sniffer.is_running():
            continue
        try:
            snapshot = aggregator.get_snapshot()
            for pkt in snapshot["recent_packets"][:10]:
                src_ip = pkt.get("src_ip")
                if src_ip and not pkt.get("geo"):
                    with _geo_lock:
                        cached = _geo_cache.get(src_ip)
                    if cached is not None:
                        pkt["geo"] = cached
                    elif is_private_ip(src_ip):
                        pkt["geo"] = {}
                    else:
                        pkt["geo"] = await asyncio.to_thread(lookup_geo, src_ip)
            await manager.broadcast(snapshot)
        except Exception as e:
            print(f"[broadcast error] {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    t = threading.Thread(target=_aggregator_thread, daemon=True)
    t.start()
    asyncio.create_task(_broadcast_loop())
    yield


app = FastAPI(title="NetSight API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/interfaces")
def get_interfaces():
    return {"interfaces": sniffer.get_interfaces()}


@app.post("/start")
def start_capture(iface: str):
    aggregator.reset()
    sniffer.start_sniffing(iface)
    return {"status": "started", "iface": iface}


@app.post("/stop")
def stop_capture():
    sniffer.stop_sniffing()
    return {"status": "stopped"}


@app.get("/status")
def get_status():
    return {
        "running": sniffer.is_running(),
        "snapshot": aggregator.get_snapshot() if sniffer.is_running() else None,
    }


@app.get("/download/pcap")
def download_pcap(background_tasks: BackgroundTasks):
    from fastapi.responses import FileResponse
    import tempfile
    import os
    from scapy.all import wrpcap
    
    with sniffer._packets_lock:
        pkts = list(sniffer.captured_packets)
        
    fd, path = tempfile.mkstemp(suffix=".pcap")
    try:
        os.close(fd)
        wrpcap(path, pkts)
        background_tasks.add_task(os.remove, path)
        return FileResponse(
            path,
            media_type="application/octet-stream",
            filename="netsight_capture.pcap"
        )
    except Exception as e:
        try:
            os.remove(path)
        except Exception:
            pass
        return {"error": str(e)}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    print("=" * 55)
    print("  NetSight Backend — must run as Administrator")
    print("  API:       http://localhost:8050")
    print("  WebSocket: ws://localhost:8050/ws")
    print("=" * 55)
    uvicorn.run(app, host="0.0.0.0", port=8050, log_level="warning")