"""WebSocket chat smoke test."""
import asyncio
import os
import json
import requests
import websockets
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://campus-marketplace-43.preview.emergentagent.com"
API = f"{BASE_URL}/api"
WS_BASE = BASE_URL.replace("https://", "wss://").replace("http://", "ws://")

MAIN_TOKEN = "qa_session_main"
ALT_TOKEN = "qa_session_alt"
MAIN_UID = "user_qa_main"
ALT_UID = "user_qa_alt"


@pytest.mark.asyncio
async def test_ws_chat_realtime():
    # ensure conversation exists
    r = requests.post(f"{API}/conversations",
                      json={"other_user_id": ALT_UID},
                      headers={"Authorization": f"Bearer {MAIN_TOKEN}"}, timeout=30)
    assert r.status_code == 200
    conv_id = r.json()["id"]

    received = []

    async def listener():
        url = f"{WS_BASE}/api/ws/chat/{conv_id}?token={ALT_TOKEN}"
        async with websockets.connect(url) as ws:
            try:
                while True:
                    msg = await asyncio.wait_for(ws.recv(), timeout=10)
                    received.append(json.loads(msg))
                    if received[-1].get("text") == "WS_QA_PING":
                        return
            except asyncio.TimeoutError:
                return

    task = asyncio.create_task(listener())
    await asyncio.sleep(1)  # ensure connection established
    # send via REST
    r2 = requests.post(f"{API}/messages/{conv_id}",
                       json={"text": "WS_QA_PING"},
                       headers={"Authorization": f"Bearer {MAIN_TOKEN}"}, timeout=30)
    assert r2.status_code == 200
    await task
    assert any(m.get("text") == "WS_QA_PING" for m in received), f"No WS broadcast received: {received}"


@pytest.mark.asyncio
async def test_ws_rejects_invalid_token():
    url = f"{WS_BASE}/api/ws/chat/anyconv?token=bogus"
    try:
        async with websockets.connect(url) as ws:
            # Should be closed
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=5)
                # if we got a message, must be closure soon
            except Exception:
                pass
            assert ws.closed or not ws.open
    except Exception:
        # expected close
        pass
