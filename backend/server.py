from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import json
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt as pyjwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ['JWT_ALGORITHM']
JWT_EXPIRE_MINUTES = int(os.environ['JWT_EXPIRE_MINUTES'])
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

app = FastAPI(title="LuxeVoyage Travel API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ============= MODELS =============
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    created_at: str


class TripPlanRequest(BaseModel):
    destination: str
    days: int = Field(ge=1, le=30)
    budget: str
    travel_type: str
    interests: List[str] = []
    hotel_category: str


class BookingCreate(BaseModel):
    package_id: str
    traveler_name: str
    email: str
    phone: str
    travel_date: str
    guests: int = 1
    special_requests: Optional[str] = ""


class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


class NewsletterSub(BaseModel):
    email: EmailStr


class WishlistItem(BaseModel):
    package_id: str


# ============= AUTH HELPERS =============
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        uid = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": uid}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_optional_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not creds:
        return None
    try:
        payload = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        uid = payload.get("sub")
        user = await db.users.find_one({"id": uid}, {"_id": 0, "password": 0})
        return user
    except Exception:
        return None


# ============= SEED DATA =============
DESTINATIONS_SEED = [
    {"id": "dest-santorini", "name": "Santorini", "country": "Greece", "region": "Europe",
     "image": "https://images.pexels.com/photos/161342/greece-santorini-architecture-island-161342.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1200",
     "price_from": 1890, "rating": 4.9, "weather": "Sunny 26°C", "best_season": "Apr–Oct",
     "tagline": "Whitewashed cliffs above the Aegean", "tags": ["Luxury", "Honeymoon", "Beach"]},
    {"id": "dest-bali", "name": "Bali", "country": "Indonesia", "region": "Asia",
     "image": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
     "price_from": 1290, "rating": 4.8, "weather": "Tropical 29°C", "best_season": "May–Sep",
     "tagline": "Temples, terraces & turquoise tides", "tags": ["Adventure", "Honeymoon", "Wellness"]},
    {"id": "dest-maldives", "name": "Maldives", "country": "Maldives", "region": "Asia",
     "image": "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80",
     "price_from": 3490, "rating": 5.0, "weather": "Tropical 28°C", "best_season": "Nov–Apr",
     "tagline": "Overwater villas in turquoise lagoons", "tags": ["Luxury", "Honeymoon", "Beach"]},
    {"id": "dest-swiss", "name": "Swiss Alps", "country": "Switzerland", "region": "Europe",
     "image": "https://images.unsplash.com/photo-1520681504224-093d46124820?auto=format&fit=crop&w=1200&q=80",
     "price_from": 2790, "rating": 4.9, "weather": "Alpine 4°C", "best_season": "Dec–Mar",
     "tagline": "Snow-dusted peaks & wooden chalets", "tags": ["Adventure", "Luxury", "Family"]},
    {"id": "dest-kyoto", "name": "Kyoto", "country": "Japan", "region": "Asia",
     "image": "https://images.pexels.com/photos/26946364/pexels-photo-26946364.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1200",
     "price_from": 2190, "rating": 4.9, "weather": "Mild 18°C", "best_season": "Mar–May",
     "tagline": "Cherry blossoms & golden temples", "tags": ["Culture", "Luxury", "Solo"]},
    {"id": "dest-dubai", "name": "Dubai", "country": "UAE", "region": "Middle East",
     "image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
     "price_from": 1590, "rating": 4.7, "weather": "Sunny 32°C", "best_season": "Nov–Mar",
     "tagline": "Skyline glitter & desert horizons", "tags": ["Luxury", "Family", "Shopping"]},
    {"id": "dest-iceland", "name": "Iceland", "country": "Iceland", "region": "Europe",
     "image": "https://images.unsplash.com/photo-1531168556467-80aace0d0144?auto=format&fit=crop&w=1200&q=80",
     "price_from": 2490, "rating": 4.8, "weather": "Cool 7°C", "best_season": "Sep–Mar",
     "tagline": "Aurora-lit fjords & black sand beaches", "tags": ["Adventure", "Solo", "Nature"]},
    {"id": "dest-paris", "name": "Paris", "country": "France", "region": "Europe",
     "image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
     "price_from": 1390, "rating": 4.8, "weather": "Mild 17°C", "best_season": "Apr–Oct",
     "tagline": "Cafés, couture & timeless romance", "tags": ["Honeymoon", "Culture", "Luxury"]},
]

PACKAGES_SEED = [
    {
        "id": "pkg-bali-7d", "title": "Bali Soul Retreat", "destination_id": "dest-bali",
        "destination": "Bali, Indonesia", "image": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1604999333679-b86d54738315?auto=format&fit=crop&w=1200&q=80",
        ],
        "duration": "7 Days / 6 Nights", "price": 1890, "discount": 15, "rating": 4.9, "reviews": 287,
        "category": "Honeymoon", "availability": "Available", "highlights": ["Ubud rice terraces", "Private villa", "Sunset dinner cruise", "Spa rituals"],
        "included": ["4-star villa", "Daily breakfast", "Airport transfers", "Local guide"],
        "excluded": ["International flights", "Personal expenses", "Travel insurance"],
        "itinerary": [
            {"day": 1, "title": "Arrival in Denpasar", "desc": "Welcome flower garland, transfer to private villa, evening yoga session."},
            {"day": 2, "title": "Ubud & Rice Terraces", "desc": "Tegallalang walk, monkey forest, Balinese cooking class."},
            {"day": 3, "title": "Temple & Volcano", "desc": "Tirta Empul purification, Mount Batur sunrise trek."},
            {"day": 4, "title": "Beach Day in Seminyak", "desc": "Beach club, sunset cocktails, fine dining."},
            {"day": 5, "title": "Nusa Penida Island", "desc": "Speedboat to Nusa Penida, Kelingking cliff & Crystal Bay."},
            {"day": 6, "title": "Spa & Leisure", "desc": "Traditional spa, shopping in Seminyak, candlelight dinner."},
            {"day": 7, "title": "Departure", "desc": "Breakfast, transfer to airport with farewell gift."},
        ],
    },
    {
        "id": "pkg-santorini-5d", "title": "Santorini Cliffside Escape", "destination_id": "dest-santorini",
        "destination": "Santorini, Greece", "image": "https://images.pexels.com/photos/161342/greece-santorini-architecture-island-161342.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1200",
        "gallery": ["https://images.pexels.com/photos/161342/greece-santorini-architecture-island-161342.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1200"],
        "duration": "5 Days / 4 Nights", "price": 2390, "discount": 10, "rating": 4.9, "reviews": 412,
        "category": "Luxury", "availability": "Limited", "highlights": ["Caldera view suite", "Private catamaran", "Oia sunset", "Volcano hike"],
        "included": ["5-star cave suite", "Daily breakfast", "Private transfers", "Sunset cruise"],
        "excluded": ["Flights", "Lunch & dinner", "Tips"],
        "itinerary": [
            {"day": 1, "title": "Arrival in Oia", "desc": "Champagne welcome at caldera-view suite."},
            {"day": 2, "title": "Catamaran Cruise", "desc": "Hot springs, Red Beach, sunset on deck."},
            {"day": 3, "title": "Volcano & Thira", "desc": "Nea Kameni hike, wine tasting in Pyrgos."},
            {"day": 4, "title": "Akrotiri & Spa", "desc": "Ancient ruins tour, Aegean spa ritual."},
            {"day": 5, "title": "Departure", "desc": "Private transfer to Santorini airport."},
        ],
    },
    {
        "id": "pkg-maldives-6d", "title": "Maldives Overwater Bliss", "destination_id": "dest-maldives",
        "destination": "Maldives", "image": "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80",
        "gallery": ["https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80"],
        "duration": "6 Days / 5 Nights", "price": 3490, "discount": 20, "rating": 5.0, "reviews": 198,
        "category": "Honeymoon", "availability": "Available", "highlights": ["Overwater villa", "Private snorkel", "Dolphin cruise", "Underwater dinner"],
        "included": ["Overwater villa", "All-inclusive meals", "Seaplane transfers", "Snorkel gear"],
        "excluded": ["Flights", "Spa", "Excursions"],
        "itinerary": [
            {"day": 1, "title": "Seaplane Arrival", "desc": "Scenic seaplane to private resort island."},
            {"day": 2, "title": "Reef Snorkel", "desc": "Private guide, manta ray sighting."},
            {"day": 3, "title": "Sandbank Picnic", "desc": "Champagne lunch on a private sandbank."},
            {"day": 4, "title": "Dolphin Cruise", "desc": "Sunset cruise with wild spinner dolphins."},
            {"day": 5, "title": "Underwater Dinner", "desc": "5-course dinner at world-famous underwater restaurant."},
            {"day": 6, "title": "Departure", "desc": "Seaplane back to Malé."},
        ],
    },
    {
        "id": "pkg-swiss-7d", "title": "Swiss Alps Winter Tale", "destination_id": "dest-swiss",
        "destination": "Zermatt, Switzerland", "image": "https://images.unsplash.com/photo-1520681504224-093d46124820?auto=format&fit=crop&w=1200&q=80",
        "gallery": ["https://images.unsplash.com/photo-1520681504224-093d46124820?auto=format&fit=crop&w=1200&q=80"],
        "duration": "7 Days / 6 Nights", "price": 2790, "discount": 12, "rating": 4.9, "reviews": 156,
        "category": "Adventure", "availability": "Available", "highlights": ["Matterhorn views", "Glacier Express", "Ski pass", "Fondue night"],
        "included": ["Chalet suite", "Breakfast & dinner", "Ski pass", "Train passes"],
        "excluded": ["Flights", "Ski equipment", "Lunches"],
        "itinerary": [
            {"day": 1, "title": "Arrival in Zürich", "desc": "Scenic train to Zermatt, chalet check-in."},
            {"day": 2, "title": "Matterhorn Day", "desc": "Gornergrat railway, panoramic views."},
            {"day": 3, "title": "Skiing", "desc": "Full-day skiing with private instructor."},
            {"day": 4, "title": "Glacier Express", "desc": "Scenic train ride to St. Moritz."},
            {"day": 5, "title": "Snowshoeing", "desc": "Guided alpine snowshoe trek."},
            {"day": 6, "title": "Fondue & Spa", "desc": "Traditional fondue dinner, thermal spa."},
            {"day": 7, "title": "Departure", "desc": "Train to Zürich, flight home."},
        ],
    },
    {
        "id": "pkg-kyoto-6d", "title": "Kyoto Cherry Blossom Journey", "destination_id": "dest-kyoto",
        "destination": "Kyoto, Japan", "image": "https://images.pexels.com/photos/26946364/pexels-photo-26946364.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1200",
        "gallery": ["https://images.pexels.com/photos/26946364/pexels-photo-26946364.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1200"],
        "duration": "6 Days / 5 Nights", "price": 2190, "discount": 8, "rating": 4.9, "reviews": 234,
        "category": "Culture", "availability": "Available", "highlights": ["Geisha district", "Bamboo forest", "Tea ceremony", "Mt. Fuji day"],
        "included": ["Ryokan stay", "Breakfast", "Bullet train", "Cultural guide"],
        "excluded": ["Flights", "Dinners", "Personal expenses"],
        "itinerary": [
            {"day": 1, "title": "Arrival in Kyoto", "desc": "Ryokan check-in, evening kaiseki dinner."},
            {"day": 2, "title": "Arashiyama", "desc": "Bamboo grove, monkey park, Tenryū-ji temple."},
            {"day": 3, "title": "Gion Geisha", "desc": "Tea ceremony, evening walk through Gion."},
            {"day": 4, "title": "Fushimi Inari", "desc": "Thousand torii gates, sake tasting."},
            {"day": 5, "title": "Mt. Fuji Day Trip", "desc": "Bullet train to Hakone, Fuji views."},
            {"day": 6, "title": "Departure", "desc": "Transfer to Kansai airport."},
        ],
    },
    {
        "id": "pkg-dubai-5d", "title": "Dubai Skyline Luxury", "destination_id": "dest-dubai",
        "destination": "Dubai, UAE", "image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
        "gallery": ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80"],
        "duration": "5 Days / 4 Nights", "price": 1590, "discount": 18, "rating": 4.7, "reviews": 320,
        "category": "Luxury", "availability": "Available", "highlights": ["Burj Khalifa", "Desert safari", "Marina yacht", "Gold souk"],
        "included": ["5-star hotel", "Breakfast", "Desert safari", "City tour"],
        "excluded": ["Flights", "Lunches & dinners", "Visa"],
        "itinerary": [
            {"day": 1, "title": "Arrival", "desc": "Hotel check-in, Dubai Mall & fountain show."},
            {"day": 2, "title": "Burj Khalifa", "desc": "At-the-Top experience, sunset views."},
            {"day": 3, "title": "Desert Safari", "desc": "Dune bashing, BBQ dinner under stars."},
            {"day": 4, "title": "Marina Yacht", "desc": "Private yacht cruise, Palm Jumeirah."},
            {"day": 5, "title": "Departure", "desc": "Gold souk shopping, transfer to DXB."},
        ],
    },
]


async def seed_data():
    if await db.destinations.count_documents({}) == 0:
        await db.destinations.insert_many([{**d} for d in DESTINATIONS_SEED])
        logger.info(f"Seeded {len(DESTINATIONS_SEED)} destinations")
    if await db.packages.count_documents({}) == 0:
        await db.packages.insert_many([{**p} for p in PACKAGES_SEED])
        logger.info(f"Seeded {len(PACKAGES_SEED)} packages")


# ============= ROUTES =============
@api_router.get("/")
async def root():
    return {"message": "LuxeVoyage API", "version": "1.0"}


# Auth
@api_router.post("/auth/signup")
async def signup(data: UserSignup):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email.lower(),
        "password": hash_password(data.password),
        "created_at": now_iso(),
        "avatar": None,
        "rewards_points": 250,
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    return {
        "token": token,
        "user": {"id": user_id, "name": data.name, "email": data.email.lower(), "rewards_points": 250},
    }


@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"],
                 "rewards_points": user.get("rewards_points", 0)},
    }


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# Destinations
@api_router.get("/destinations")
async def get_destinations(region: Optional[str] = None):
    q = {}
    if region:
        q["region"] = region
    items = await db.destinations.find(q, {"_id": 0}).to_list(100)
    return items


@api_router.get("/destinations/{dest_id}")
async def get_destination(dest_id: str):
    item = await db.destinations.find_one({"id": dest_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Destination not found")
    return item


# Packages
@api_router.get("/packages")
async def get_packages(category: Optional[str] = None, destination_id: Optional[str] = None):
    q = {}
    if category and category.lower() != "all":
        q["category"] = category
    if destination_id:
        q["destination_id"] = destination_id
    items = await db.packages.find(q, {"_id": 0}).to_list(100)
    return items


@api_router.get("/packages/{pkg_id}")
async def get_package(pkg_id: str):
    item = await db.packages.find_one({"id": pkg_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Package not found")
    return item


# AI Trip Planner
@api_router.post("/ai/plan-trip")
async def plan_trip(req: TripPlanRequest):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception as e:
        raise HTTPException(500, f"AI library unavailable: {e}")

    interests_str = ", ".join(req.interests) if req.interests else "general sightseeing"
    prompt = f"""Create a luxury day-by-day travel itinerary as JSON. STRICT JSON only, no markdown, no code fences.

Destination: {req.destination}
Days: {req.days}
Budget: {req.budget}
Travel Type: {req.travel_type}
Interests: {interests_str}
Hotel Category: {req.hotel_category}

Schema:
{{
  "destination": str,
  "summary": "2-sentence luxurious tagline",
  "estimated_cost_usd": int,
  "best_time_to_visit": str,
  "hotel_recommendation": {{"name": str, "category": str, "why": str}},
  "days": [
    {{
      "day": int,
      "title": "Catchy day title",
      "morning": str,
      "afternoon": str,
      "evening": str,
      "dining": "Recommended restaurant or cuisine"
    }}
  ],
  "packing_tips": [str, str, str],
  "insider_tip": str
}}

Make it cinematic, evocative, and specific to {req.destination}. Days array must have exactly {req.days} entries.
"""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"trip-{uuid.uuid4()}",
        system_message="You are an elite luxury travel concierge. Always reply with valid JSON only.",
    ).with_model("anthropic", "claude-sonnet-4-6")

    try:
        response = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.error(f"LLM error: {e}")
        raise HTTPException(500, f"AI generation failed: {str(e)}")

    text = response.strip() if isinstance(response, str) else str(response).strip()
    # Strip code fences if present
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip("` \n")
    try:
        itinerary = json.loads(text)
    except Exception as e:
        logger.error(f"JSON parse error: {e} | raw: {text[:500]}")
        raise HTTPException(500, "AI returned invalid JSON. Please retry.")

    # Save to DB
    record = {
        "id": str(uuid.uuid4()),
        "request": req.model_dump(),
        "itinerary": itinerary,
        "created_at": now_iso(),
    }
    await db.itineraries.insert_one(record)
    record.pop("_id", None)
    return record


# Bookings
@api_router.post("/bookings")
async def create_booking(data: BookingCreate, user=Depends(get_optional_user)):
    pkg = await db.packages.find_one({"id": data.package_id}, {"_id": 0})
    if not pkg:
        raise HTTPException(404, "Package not found")
    total = pkg["price"] * data.guests
    discount_amt = total * (pkg.get("discount", 0) / 100)
    final = total - discount_amt
    booking = {
        "id": str(uuid.uuid4()),
        "ref": f"LV-{uuid.uuid4().hex[:8].upper()}",
        "user_id": user["id"] if user else None,
        "package_id": data.package_id,
        "package_title": pkg["title"],
        "package_image": pkg.get("image"),
        "traveler_name": data.traveler_name,
        "email": data.email,
        "phone": data.phone,
        "travel_date": data.travel_date,
        "guests": data.guests,
        "special_requests": data.special_requests,
        "subtotal": total,
        "discount": discount_amt,
        "total": final,
        "status": "confirmed",
        "created_at": now_iso(),
    }
    await db.bookings.insert_one(booking)
    booking.pop("_id", None)
    return booking


@api_router.get("/bookings/me")
async def my_bookings(user=Depends(get_current_user)):
    items = await db.bookings.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    return items


# Wishlist
@api_router.post("/wishlist")
async def add_wishlist(item: WishlistItem, user=Depends(get_current_user)):
    await db.wishlist.update_one(
        {"user_id": user["id"], "package_id": item.package_id},
        {"$set": {"user_id": user["id"], "package_id": item.package_id, "created_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


@api_router.delete("/wishlist/{package_id}")
async def remove_wishlist(package_id: str, user=Depends(get_current_user)):
    await db.wishlist.delete_one({"user_id": user["id"], "package_id": package_id})
    return {"ok": True}


@api_router.get("/wishlist/me")
async def my_wishlist(user=Depends(get_current_user)):
    items = await db.wishlist.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    pkg_ids = [i["package_id"] for i in items]
    pkgs = await db.packages.find({"id": {"$in": pkg_ids}}, {"_id": 0}).to_list(200)
    return pkgs


# Contact & Newsletter
@api_router.post("/contact")
async def contact_form(msg: ContactMessage):
    doc = {**msg.model_dump(), "id": str(uuid.uuid4()), "created_at": now_iso()}
    await db.contacts.insert_one(doc)
    doc.pop("_id", None)
    return {"ok": True, "message": "Thanks! We'll be in touch within 24 hours."}


@api_router.post("/newsletter")
async def newsletter(sub: NewsletterSub):
    await db.newsletter.update_one(
        {"email": sub.email.lower()},
        {"$set": {"email": sub.email.lower(), "subscribed_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


# Stats (for animated counters)
@api_router.get("/stats")
async def stats():
    return {
        "happy_travelers": 28450,
        "destinations": 142,
        "tours_completed": 9870,
        "years_experience": 17,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    await seed_data()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
