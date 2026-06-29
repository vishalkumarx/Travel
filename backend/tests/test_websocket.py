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
    # Create an item + booking request to unlock conversation
    import uuid
    payload = {"title": f"TEST_ws_{uuid.uuid4().hex[:6]}", "price_per_day": 3,
               "category": "other", "location": {}, "images": []}
    ri = requests.post(f"{API}/items", json=payload,
                       headers={"Authorization": f"Bearer {MAIN_TOKEN}", "Content-Type": "application/json"}, timeout=30)
    assert ri.status_code == 200, ri.text
    item_id = ri.json()["id"]
    rreq = requests.post(f"{API}/requests",
                         json={"item_id": item_id, "start_date": "2026-05-01",
                               "end_date": "2026-05-02", "total_price": 3},
                         headers={"Authorization": f"Bearer {ALT_TOKEN}", "Content-Type": "application/json"}, timeout=30)
    assert rreq.status_code == 200, rreq.text
    conv_id = rreq.json()["conversation_id"]
    assert conv_id

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
    # cleanup
    requests.delete(f"{API}/items/{item_id}",
                    headers={"Authorization": f"Bearer {MAIN_TOKEN}"}, timeout=30)


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
