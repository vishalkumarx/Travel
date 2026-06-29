"""Campus Rent backend API tests.
Uses session-based auth via Bearer header. Two seeded sessions:
- qa_session_main (user_qa_main)
- qa_session_alt  (user_qa_alt)
Seed owners: user_seed_0/1/2 with 4 seed items.
"""
import io
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://campus-marketplace-43.preview.emergentagent.com"
API = f"{BASE_URL}/api"

MAIN_TOKEN = "qa_session_main"
ALT_TOKEN = "qa_session_alt"
MAIN_UID = "user_qa_main"
ALT_UID = "user_qa_alt"


def h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def seed_item_id():
    r = requests.get(f"{API}/items", timeout=30)
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 1
    # pick an item owned by a seed user (not by qa users)
    for it in items:
        if it["owner_id"].startswith("user_seed_"):
            return it["id"]
    return items[0]["id"]


# --------- Auth ---------
class TestAuth:
    def test_me_no_auth_returns_401(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401

    def test_me_with_bearer(self):
        r = requests.get(f"{API}/auth/me", headers=h(MAIN_TOKEN), timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["user_id"] == MAIN_UID
        assert data["email"] == "qa.main@campus.edu"

    def test_me_with_cookie(self):
        r = requests.get(f"{API}/auth/me", cookies={"session_token": MAIN_TOKEN}, timeout=30)
        assert r.status_code == 200
        assert r.json()["user_id"] == MAIN_UID

    def test_me_invalid_token(self):
        r = requests.get(f"{API}/auth/me", headers=h("bogus"), timeout=30)
        assert r.status_code == 401

    def test_profile_update(self):
        payload = {"bio": "Updated by QA " + str(uuid.uuid4())[:6]}
        r = requests.put(f"{API}/auth/profile", json=payload, headers=h(MAIN_TOKEN), timeout=30)
        assert r.status_code == 200
        assert r.json()["bio"] == payload["bio"]
        # persistence
        r2 = requests.get(f"{API}/auth/me", headers=h(MAIN_TOKEN), timeout=30)
        assert r2.json()["bio"] == payload["bio"]


# --------- Items ---------
class TestItems:
    def test_list_items_public(self):
        r = requests.get(f"{API}/items", timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 4
        assert "owner" in items[0]
        assert "liked" in items[0]

    def test_list_items_category_filter(self):
        r = requests.get(f"{API}/items?category=electronics", timeout=30)
        assert r.status_code == 200
        for it in r.json():
            assert it["category"] == "electronics"

    def test_list_items_search(self):
        r = requests.get(f"{API}/items?q=scooter", timeout=30)
        assert r.status_code == 200
        titles = [i["title"].lower() for i in r.json()]
        assert any("scooter" in t for t in titles)

    def test_list_items_sort_price_low(self):
        r = requests.get(f"{API}/items?sort=price_low", timeout=30)
        assert r.status_code == 200
        prices = [i["price_per_day"] for i in r.json()]
        assert prices == sorted(prices)

    def test_get_item_detail(self, seed_item_id):
        r = requests.get(f"{API}/items/{seed_item_id}", headers=h(MAIN_TOKEN), timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == seed_item_id
        assert "owner" in data and data["owner"] is not None
        assert "liked" in data

    def test_get_item_404(self):
        r = requests.get(f"{API}/items/nonexistent", timeout=30)
        assert r.status_code == 404

    def test_create_item_requires_auth(self):
        r = requests.post(f"{API}/items", json={"title": "x", "price_per_day": 1, "category": "other"}, timeout=30)
        assert r.status_code == 401

    def test_create_update_delete_item(self):
        payload = {
            "title": f"TEST_Item_{uuid.uuid4().hex[:6]}",
            "description": "test item",
            "price_per_day": 12.5,
            "category": "other",
            "location": {"city": "Berkeley", "state": "CA", "lat": 37.87, "lng": -122.26},
            "images": [],
        }
        r = requests.post(f"{API}/items", json=payload, headers=h(MAIN_TOKEN), timeout=30)
        assert r.status_code == 200, r.text
        item = r.json()
        item_id = item["id"]
        assert item["owner_id"] == MAIN_UID
        assert item["title"] == payload["title"]

        # GET back
        r2 = requests.get(f"{API}/items/{item_id}", timeout=30)
        assert r2.status_code == 200
        assert r2.json()["title"] == payload["title"]

        # update
        payload2 = {**payload, "title": payload["title"] + "_upd", "price_per_day": 20.0}
        r3 = requests.put(f"{API}/items/{item_id}", json=payload2, headers=h(MAIN_TOKEN), timeout=30)
        assert r3.status_code == 200
        assert r3.json()["title"].endswith("_upd")
        assert r3.json()["price_per_day"] == 20.0

        # update by non-owner forbidden
        r4 = requests.put(f"{API}/items/{item_id}", json=payload2, headers=h(ALT_TOKEN), timeout=30)
        assert r4.status_code == 403

        # delete by non-owner
        r5 = requests.delete(f"{API}/items/{item_id}", headers=h(ALT_TOKEN), timeout=30)
        assert r5.status_code == 403

        # delete by owner
        r6 = requests.delete(f"{API}/items/{item_id}", headers=h(MAIN_TOKEN), timeout=30)
        assert r6.status_code == 200

        # gone
        r7 = requests.get(f"{API}/items/{item_id}", timeout=30)
        assert r7.status_code == 404

    def test_like_toggle(self, seed_item_id):
        # like
        r = requests.post(f"{API}/items/{seed_item_id}/like", headers=h(MAIN_TOKEN), timeout=30)
        assert r.status_code == 200
        first = r.json()["liked"]
        # toggle
        r2 = requests.post(f"{API}/items/{seed_item_id}/like", headers=h(MAIN_TOKEN), timeout=30)
        assert r2.status_code == 200
        assert r2.json()["liked"] != first

    def test_favorites_and_my_listings(self, seed_item_id):
        # ensure liked
        r0 = requests.post(f"{API}/items/{seed_item_id}/like", headers=h(MAIN_TOKEN), timeout=30)
        assert r0.status_code == 200
        liked_now = r0.json()["liked"]
        if not liked_now:
            r0b = requests.post(f"{API}/items/{seed_item_id}/like", headers=h(MAIN_TOKEN), timeout=30)
            assert r0b.json()["liked"] is True

        r = requests.get(f"{API}/favorites", headers=h(MAIN_TOKEN), timeout=30)
        assert r.status_code == 200
        assert any(i["id"] == seed_item_id for i in r.json())

        r2 = requests.get(f"{API}/my-listings", headers=h(MAIN_TOKEN), timeout=30)
        assert r2.status_code == 200
        # might be empty - fine
        assert isinstance(r2.json(), list)


# --------- Upload ---------
class TestUpload:
    def test_upload_requires_auth(self):
        r = requests.post(f"{API}/upload", files={"file": ("a.png", b"x", "image/png")}, timeout=30)
        assert r.status_code == 401

    def test_upload_and_get_file(self):
        # 1x1 PNG
        png = bytes.fromhex(
            "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
            "890000000d49444154789c63600100000005000100627fe6d20000000049454e44ae426082"
        )
        files = {"file": ("pixel.png", png, "image/png")}
        r = requests.post(f"{API}/upload",
                          headers={"Authorization": f"Bearer {MAIN_TOKEN}"},
                          files=files, timeout=60)
        assert r.status_code == 200, r.text
        path = r.json()["path"]
        assert path
        r2 = requests.get(f"{API}/files/{path}", timeout=60)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")


# --------- Requests / Bookings ---------
class TestRequests:
    def test_cannot_request_own_item(self):
        # create item owned by main
        payload = {"title": f"TEST_ownitem_{uuid.uuid4().hex[:6]}", "price_per_day": 5, "category": "other",
                   "location": {}, "images": []}
        r = requests.post(f"{API}/items", json=payload, headers=h(MAIN_TOKEN), timeout=30)
        item_id = r.json()["id"]
        req_payload = {"item_id": item_id, "start_date": "2026-02-01", "end_date": "2026-02-03", "total_price": 10}
        r2 = requests.post(f"{API}/requests", json=req_payload, headers=h(MAIN_TOKEN), timeout=30)
        assert r2.status_code == 400
        requests.delete(f"{API}/items/{item_id}", headers=h(MAIN_TOKEN), timeout=30)

    def test_full_booking_flow_accept(self, seed_item_id):
        # alt user requests a seed-owned item -> not allowed since alt isn't owner; but we test alt requesting seed item
        # Actually request must go to seed owner. We will instead make main create an item and alt request it.
        payload = {"title": f"TEST_book_{uuid.uuid4().hex[:6]}", "price_per_day": 7, "category": "other",
                   "location": {}, "images": []}
        r = requests.post(f"{API}/items", json=payload, headers=h(MAIN_TOKEN), timeout=30)
        item_id = r.json()["id"]

        req_payload = {"item_id": item_id, "start_date": "2026-02-01", "end_date": "2026-02-03", "total_price": 21}
        r2 = requests.post(f"{API}/requests", json=req_payload, headers=h(ALT_TOKEN), timeout=30)
        assert r2.status_code == 200, r2.text
        req_id = r2.json()["id"]
        assert r2.json()["status"] == "pending"

        # incoming for main
        r3 = requests.get(f"{API}/requests?type=incoming", headers=h(MAIN_TOKEN), timeout=30)
        assert r3.status_code == 200
        assert any(rq["id"] == req_id for rq in r3.json())

        # mine for alt
        r4 = requests.get(f"{API}/requests?type=mine", headers=h(ALT_TOKEN), timeout=30)
        assert any(rq["id"] == req_id for rq in r4.json())

        # alt cannot accept (not owner)
        r5 = requests.put(f"{API}/requests/{req_id}/status", json={"status": "accepted"}, headers=h(ALT_TOKEN), timeout=30)
        assert r5.status_code == 403

        # owner accepts with custom_price
        r6 = requests.put(f"{API}/requests/{req_id}/status",
                          json={"status": "accepted", "custom_price": 25.0},
                          headers=h(MAIN_TOKEN), timeout=30)
        assert r6.status_code == 200
        assert r6.json()["status"] == "accepted"
        assert r6.json()["total_price"] == 25.0

        # item rented
        r7 = requests.get(f"{API}/items/{item_id}", timeout=30)
        assert r7.json()["status"] == "rented"

        # cancel - frees item + adds system message
        r8 = requests.put(f"{API}/requests/{req_id}/status",
                          json={"status": "cancelled", "cancel_reason": "QA test"},
                          headers=h(MAIN_TOKEN), timeout=30)
        assert r8.status_code == 200
        r9 = requests.get(f"{API}/items/{item_id}", timeout=30)
        assert r9.json()["status"] == "available"

        # cleanup
        requests.delete(f"{API}/items/{item_id}", headers=h(MAIN_TOKEN), timeout=30)

    def test_reject_flow(self):
        payload = {"title": f"TEST_rej_{uuid.uuid4().hex[:6]}", "price_per_day": 4, "category": "other",
                   "location": {}, "images": []}
        r = requests.post(f"{API}/items", json=payload, headers=h(MAIN_TOKEN), timeout=30)
        item_id = r.json()["id"]
        r2 = requests.post(f"{API}/requests",
                          json={"item_id": item_id, "start_date": "2026-02-01", "end_date": "2026-02-02", "total_price": 4},
                          headers=h(ALT_TOKEN), timeout=30)
        req_id = r2.json()["id"]
        r3 = requests.put(f"{API}/requests/{req_id}/status", json={"status": "rejected"},
                          headers=h(MAIN_TOKEN), timeout=30)
        assert r3.status_code == 200
        assert r3.json()["status"] == "rejected"
        requests.delete(f"{API}/items/{item_id}", headers=h(MAIN_TOKEN), timeout=30)


# --------- Chat ---------
class TestChat:
    def test_create_conversation_and_send_messages(self):
        r = requests.post(f"{API}/conversations",
                          json={"other_user_id": ALT_UID},
                          headers=h(MAIN_TOKEN), timeout=30)
        assert r.status_code == 200
        conv_id = r.json()["id"]
        # idempotent
        r2 = requests.post(f"{API}/conversations",
                           json={"other_user_id": MAIN_UID},
                           headers=h(ALT_TOKEN), timeout=30)
        assert r2.json()["id"] == conv_id

        # send a message
        r3 = requests.post(f"{API}/messages/{conv_id}",
                           json={"text": "Hello QA"},
                           headers=h(MAIN_TOKEN), timeout=30)
        assert r3.status_code == 200

        # list conversations for alt has unread
        r4 = requests.get(f"{API}/conversations", headers=h(ALT_TOKEN), timeout=30)
        assert any(c["id"] == conv_id and c["unread_count"] >= 1 for c in r4.json())

        # get messages marks read
        r5 = requests.get(f"{API}/messages/{conv_id}", headers=h(ALT_TOKEN), timeout=30)
        assert r5.status_code == 200
        msgs = r5.json()["messages"]
        assert any(m["text"] == "Hello QA" for m in msgs)

        # unread cleared
        r6 = requests.get(f"{API}/conversations", headers=h(ALT_TOKEN), timeout=30)
        for c in r6.json():
            if c["id"] == conv_id:
                assert c["unread_count"] == 0


# --------- Reviews / Public profile ---------
class TestReviews:
    def test_cannot_review_self(self):
        r = requests.post(f"{API}/reviews",
                          json={"reviewee_id": MAIN_UID, "rating": 5, "comment": "x"},
                          headers=h(MAIN_TOKEN), timeout=30)
        assert r.status_code == 400

    def test_create_review_and_public_profile(self):
        r = requests.post(f"{API}/reviews",
                          json={"reviewee_id": "user_seed_0", "rating": 5, "comment": "TEST_review " + uuid.uuid4().hex[:6]},
                          headers=h(MAIN_TOKEN), timeout=30)
        assert r.status_code == 200

        r2 = requests.get(f"{API}/users/user_seed_0", timeout=30)
        assert r2.status_code == 200
        data = r2.json()
        assert data["profile"]["user_id"] == "user_seed_0"
        assert isinstance(data["listings"], list)
        assert isinstance(data["reviews"], list)
        assert data["review_count"] >= 1
        assert data["avg_rating"] > 0
