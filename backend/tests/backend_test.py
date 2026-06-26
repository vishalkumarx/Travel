"""LuxeVoyage backend API tests - covers destinations, packages, auth, AI, bookings, wishlist, contact, newsletter."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://page-maker-823.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
TS = int(time.time())
TEST_EMAIL = f"qatest+{TS}@luxe.com"
TEST_PASSWORD = "TestPass123!"
TEST_NAME = "QA Tester"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth(session):
    """Signup once, return token + user."""
    r = session.post(f"{API}/auth/signup", json={
        "name": TEST_NAME, "email": TEST_EMAIL, "password": TEST_PASSWORD,
    }, timeout=15)
    if r.status_code == 400:
        # already registered (parallel worker race) → login
        r = session.post(f"{API}/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD,
        }, timeout=15)
    assert r.status_code == 200, f"auth failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    return data


# ===== Destinations =====
class TestDestinations:
    def test_list_destinations(self, session):
        r = session.get(f"{API}/destinations", timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 8, f"expected >=8 destinations, got {len(items)}"
        d = items[0]
        for k in ["id", "name", "country", "image", "price_from", "rating"]:
            assert k in d, f"missing key {k}"

    def test_get_destination_by_id(self, session):
        r = session.get(f"{API}/destinations/dest-bali", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "Bali"

    def test_destination_not_found(self, session):
        r = session.get(f"{API}/destinations/nope", timeout=15)
        assert r.status_code == 404


# ===== Packages =====
class TestPackages:
    def test_list_packages(self, session):
        r = session.get(f"{API}/packages", timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 6
        assert "_id" not in items[0]

    def test_filter_honeymoon(self, session):
        r = session.get(f"{API}/packages", params={"category": "Honeymoon"}, timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert all(p["category"] == "Honeymoon" for p in items)
        assert len(items) >= 1

    def test_get_package_with_itinerary(self, session):
        r = session.get(f"{API}/packages/pkg-bali-7d", timeout=15)
        assert r.status_code == 200
        p = r.json()
        assert "itinerary" in p and isinstance(p["itinerary"], list) and len(p["itinerary"]) == 7


# ===== Auth =====
class TestAuth:
    def test_signup_and_token(self, auth):
        assert auth["user"]["email"] == TEST_EMAIL
        assert len(auth["token"]) > 20

    def test_duplicate_signup(self, session):
        r = session.post(f"{API}/auth/signup", json={
            "name": TEST_NAME, "email": TEST_EMAIL, "password": TEST_PASSWORD,
        }, timeout=15)
        assert r.status_code == 400

    def test_login_ok(self, session):
        r = session.post(f"{API}/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD,
        }, timeout=15)
        assert r.status_code == 200
        assert "token" in r.json()

    def test_login_wrong(self, session):
        r = session.post(f"{API}/auth/login", json={
            "email": TEST_EMAIL, "password": "wrong"
        }, timeout=15)
        assert r.status_code == 401

    def test_me_with_token(self, session, auth):
        r = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {auth['token']}"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == TEST_EMAIL

    def test_me_no_token(self, session):
        r = session.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401


# ===== Bookings =====
class TestBookings:
    def test_create_booking_and_list(self, session, auth):
        token = auth["token"]
        r = session.post(f"{API}/bookings", json={
            "package_id": "pkg-bali-7d",
            "traveler_name": "QA Test",
            "email": TEST_EMAIL,
            "phone": "+1-555-0100",
            "travel_date": "2026-06-15",
            "guests": 2,
            "special_requests": "Window seat",
        }, headers={"Authorization": f"Bearer {token}"}, timeout=15)
        assert r.status_code == 200, r.text
        b = r.json()
        # 1890 * 2 = 3780, 15% off = 567 discount, final = 3213
        assert b["subtotal"] == 3780
        assert abs(b["discount"] - 567) < 0.01
        assert abs(b["total"] - 3213) < 0.01
        assert b["ref"].startswith("LV-")

        r2 = session.get(f"{API}/bookings/me", headers={"Authorization": f"Bearer {token}"}, timeout=15)
        assert r2.status_code == 200
        bookings = r2.json()
        assert any(x["id"] == b["id"] for x in bookings)


# ===== Wishlist =====
class TestWishlist:
    def test_wishlist_flow(self, session, auth):
        hdr = {"Authorization": f"Bearer {auth['token']}"}
        # Add
        r = session.post(f"{API}/wishlist", json={"package_id": "pkg-santorini-5d"}, headers=hdr, timeout=15)
        assert r.status_code == 200 and r.json()["ok"] is True
        # List
        r2 = session.get(f"{API}/wishlist/me", headers=hdr, timeout=15)
        assert r2.status_code == 200
        ids = [p["id"] for p in r2.json()]
        assert "pkg-santorini-5d" in ids
        # Delete
        r3 = session.delete(f"{API}/wishlist/pkg-santorini-5d", headers=hdr, timeout=15)
        assert r3.status_code == 200
        r4 = session.get(f"{API}/wishlist/me", headers=hdr, timeout=15)
        assert "pkg-santorini-5d" not in [p["id"] for p in r4.json()]


# ===== Contact + Newsletter =====
class TestMisc:
    def test_contact(self, session):
        r = session.post(f"{API}/contact", json={
            "name": "QA", "email": TEST_EMAIL, "subject": "Hi", "message": "Test",
        }, timeout=15)
        assert r.status_code == 200 and r.json()["ok"] is True

    def test_newsletter(self, session):
        r = session.post(f"{API}/newsletter", json={"email": TEST_EMAIL}, timeout=15)
        assert r.status_code == 200 and r.json()["ok"] is True

    def test_stats(self, session):
        r = session.get(f"{API}/stats", timeout=15)
        assert r.status_code == 200
        assert "happy_travelers" in r.json()


# ===== AI Trip Planner (slow) =====
class TestAI:
    def test_plan_trip_bali(self, session):
        r = session.post(f"{API}/ai/plan-trip", json={
            "destination": "Bali",
            "days": 3,
            "budget": "Premium",
            "travel_type": "Honeymoon",
            "interests": ["Food & Wine"],
            "hotel_category": "5-star",
        }, timeout=90)
        assert r.status_code == 200, f"AI failed: {r.status_code} {r.text[:500]}"
        data = r.json()
        itin = data["itinerary"]
        assert "summary" in itin
        assert "days" in itin and len(itin["days"]) == 3
        for d in itin["days"]:
            assert "morning" in d and "afternoon" in d and "evening" in d
        assert "hotel_recommendation" in itin
        assert "packing_tips" in itin
