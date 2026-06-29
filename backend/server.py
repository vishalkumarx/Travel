import os
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict

import requests
from fastapi import (
    FastAPI, APIRouter, HTTPException, Depends, Header, Query, Request,
    Response, UploadFile, File, WebSocket, WebSocketDisconnect,
)
from fastapi.responses import Response as FastAPIResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ----------------------------- Object Storage -----------------------------
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "campusrent"
storage_key = None

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp",
}


def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ----------------------------- Models -----------------------------
class Location(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    picture: Optional[str] = None
    location: Optional[Location] = None
    notification_prefs: Optional[Dict[str, bool]] = None


class ItemCreate(BaseModel):
    title: str
    description: str = ""
    price_per_day: float
    category: str
    location: Location = Field(default_factory=Location)
    images: List[str] = []


class RequestCreate(BaseModel):
    item_id: str
    start_date: str
    end_date: str
    total_price: float


class StatusUpdate(BaseModel):
    status: str  # accepted | rejected | cancelled
    custom_price: Optional[float] = None
    cancel_reason: Optional[str] = None


class ReviewCreate(BaseModel):
    reviewee_id: str
    rating: int
    comment: str = ""


class MessageCreate(BaseModel):
    text: str


class ConversationCreate(BaseModel):
    other_user_id: str
    item_id: Optional[str] = None


# ----------------------------- Auth -----------------------------
async def get_current_user(request: Request, authorization: str = Header(None)):
    token = request.cookies.get("session_token")
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_user_from_token(token: str):
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user


@api_router.post("/auth/session")
async def auth_session(response: Response, x_session_id: str = Header(None)):
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Missing session id")
    resp = requests.get(
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        headers={"X-Session-ID": x_session_id}, timeout=30,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = resp.json()
    email = data["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name"), "picture": data.get("picture")}},
        )
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": data.get("name"),
            "picture": data.get("picture"),
            "bio": "",
            "location": {"city": None, "state": None, "lat": None, "lng": None},
            "notification_prefs": {"requests": True, "messages": True, "promos": False},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})

    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {"$set": {"user_id": user_id, "session_token": session_token,
                  "expires_at": expires_at.isoformat(),
                  "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60,
    )
    return user


@api_router.get("/auth/me")
async def auth_me(user=Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def logout(response: Response, request: Request, authorization: str = Header(None)):
    token = request.cookies.get("session_token")
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


@api_router.put("/auth/profile")
async def update_profile(payload: ProfileUpdate, user=Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if update:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update})
    return await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})


# ----------------------------- Upload -----------------------------
@api_router.post("/upload")
async def upload(file: UploadFile = File(...), user=Depends(get_current_user)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    ct = MIME_TYPES.get(ext, file.content_type or "application/octet-stream")
    result = put_object(path, data, ct)
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": ct,
        "size": result.get("size"),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"path": result["path"]}


@api_router.get("/files/{path:path}")
async def download_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    data, content_type = get_object(path)
    return FastAPIResponse(content=data, media_type=record.get("content_type", content_type))


# ----------------------------- Items -----------------------------
async def enrich_item(item, user):
    owner = await db.users.find_one({"user_id": item["owner_id"]}, {"_id": 0})
    item["owner"] = {
        "user_id": owner["user_id"], "name": owner.get("name"),
        "picture": owner.get("picture"),
    } if owner else None
    item["liked"] = user["user_id"] in item.get("liked_by", []) if user else False
    item["likes_count"] = len(item.get("liked_by", []))
    return item


@api_router.get("/items")
async def list_items(category: Optional[str] = None, q: Optional[str] = None,
                     sort: str = "newest", request: Request = None):
    query = {}
    if category and category != "all":
        query["category"] = category
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
    cursor = db.items.find(query, {"_id": 0})
    items = await cursor.to_list(1000)
    user = None
    try:
        user = await get_current_user(request)
    except Exception:
        pass
    if sort == "price_low":
        items.sort(key=lambda x: x.get("price_per_day", 0))
    elif sort == "price_high":
        items.sort(key=lambda x: x.get("price_per_day", 0), reverse=True)
    else:
        items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    out = [await enrich_item(i, user) for i in items]
    return out


@api_router.get("/favorites")
async def favorites(user=Depends(get_current_user)):
    cursor = db.items.find({"liked_by": user["user_id"]}, {"_id": 0})
    items = await cursor.to_list(1000)
    return [await enrich_item(i, user) for i in items]


@api_router.get("/my-listings")
async def my_listings(user=Depends(get_current_user)):
    cursor = db.items.find({"owner_id": user["user_id"]}, {"_id": 0})
    items = await cursor.to_list(1000)
    return [await enrich_item(i, user) for i in items]


@api_router.post("/items")
async def create_item(payload: ItemCreate, user=Depends(get_current_user)):
    item = {
        "id": str(uuid.uuid4()),
        "owner_id": user["user_id"],
        "title": payload.title,
        "description": payload.description,
        "price_per_day": payload.price_per_day,
        "category": payload.category,
        "location": payload.location.model_dump(),
        "images": payload.images,
        "status": "available",
        "liked_by": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.items.insert_one(item)
    item.pop("_id", None)
    return await enrich_item(item, user)


@api_router.get("/items/{item_id}")
async def get_item(item_id: str, request: Request):
    item = await db.items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    user = None
    try:
        user = await get_current_user(request)
    except Exception:
        pass
    return await enrich_item(item, user)


@api_router.put("/items/{item_id}")
async def update_item(item_id: str, payload: ItemCreate, user=Depends(get_current_user)):
    item = await db.items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item["owner_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your item")
    update = payload.model_dump()
    update["location"] = payload.location.model_dump()
    await db.items.update_one({"id": item_id}, {"$set": update})
    item = await db.items.find_one({"id": item_id}, {"_id": 0})
    return await enrich_item(item, user)


@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str, user=Depends(get_current_user)):
    item = await db.items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item["owner_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your item")
    await db.items.delete_one({"id": item_id})
    return {"ok": True}


@api_router.post("/items/{item_id}/like")
async def toggle_like(item_id: str, user=Depends(get_current_user)):
    item = await db.items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    liked_by = item.get("liked_by", [])
    if user["user_id"] in liked_by:
        await db.items.update_one({"id": item_id}, {"$pull": {"liked_by": user["user_id"]}})
        liked = False
    else:
        await db.items.update_one({"id": item_id}, {"$addToSet": {"liked_by": user["user_id"]}})
        liked = True
    return {"liked": liked}


# ----------------------------- Requests / Bookings -----------------------------
async def enrich_request(req):
    item = await db.items.find_one({"id": req["item_id"]}, {"_id": 0})
    requester = await db.users.find_one({"user_id": req["requester_id"]}, {"_id": 0})
    owner = await db.users.find_one({"user_id": req["owner_id"]}, {"_id": 0})
    req["item"] = item
    req["requester"] = {"user_id": requester["user_id"], "name": requester.get("name"),
                        "picture": requester.get("picture")} if requester else None
    req["owner"] = {"user_id": owner["user_id"], "name": owner.get("name"),
                   "picture": owner.get("picture")} if owner else None
    return req


@api_router.get("/requests")
async def list_requests(type: str = "incoming", user=Depends(get_current_user)):
    if type == "incoming":
        query = {"owner_id": user["user_id"]}
    else:
        query = {"requester_id": user["user_id"]}
    cursor = db.requests.find(query, {"_id": 0})
    reqs = await cursor.to_list(1000)
    reqs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [await enrich_request(r) for r in reqs]


@api_router.post("/requests")
async def create_request(payload: RequestCreate, user=Depends(get_current_user)):
    item = await db.items.find_one({"id": payload.item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item["owner_id"] == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot request your own item")
    req = {
        "id": str(uuid.uuid4()),
        "item_id": payload.item_id,
        "requester_id": user["user_id"],
        "owner_id": item["owner_id"],
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "total_price": payload.total_price,
        "status": "pending",
        "custom_price": None,
        "cancel_reason": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.requests.insert_one(req)
    req.pop("_id", None)
    return await enrich_request(req)


@api_router.put("/requests/{req_id}/status")
async def update_request_status(req_id: str, payload: StatusUpdate, user=Depends(get_current_user)):
    req = await db.requests.find_one({"id": req_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    update = {"status": payload.status}
    if payload.status == "accepted":
        if req["owner_id"] != user["user_id"]:
            raise HTTPException(status_code=403, detail="Only owner can accept")
        if payload.custom_price is not None:
            update["custom_price"] = payload.custom_price
            update["total_price"] = payload.custom_price
        await db.items.update_one({"id": req["item_id"]}, {"$set": {"status": "rented", "rented_by": req["requester_id"]}})
    elif payload.status == "rejected":
        if req["owner_id"] != user["user_id"]:
            raise HTTPException(status_code=403, detail="Only owner can reject")
    elif payload.status == "cancelled":
        if user["user_id"] not in (req["owner_id"], req["requester_id"]):
            raise HTTPException(status_code=403, detail="Not part of this booking")
        update["cancel_reason"] = payload.cancel_reason
        await db.items.update_one({"id": req["item_id"]}, {"$set": {"status": "available"}, "$unset": {"rented_by": ""}})
        # inject system message
        conv = await get_or_create_conversation(req["requester_id"], req["owner_id"], req["item_id"])
        item = await db.items.find_one({"id": req["item_id"]}, {"_id": 0})
        canceller = "Owner" if user["user_id"] == req["owner_id"] else "Requester"
        await add_message(conv["id"], "system",
                          f"Booking for '{item['title'] if item else 'item'}' was cancelled by {canceller}. Reason: {payload.cancel_reason or 'N/A'}",
                          is_system=True)
    await db.requests.update_one({"id": req_id}, {"$set": update})
    req = await db.requests.find_one({"id": req_id}, {"_id": 0})
    return await enrich_request(req)


# ----------------------------- Chat -----------------------------
async def get_or_create_conversation(user_a: str, user_b: str, item_id: Optional[str] = None):
    participants = sorted([user_a, user_b])
    conv = await db.conversations.find_one({"participants": participants}, {"_id": 0})
    if conv:
        return conv
    conv = {
        "id": str(uuid.uuid4()),
        "participants": participants,
        "item_id": item_id,
        "last_message": None,
        "last_message_at": datetime.now(timezone.utc).isoformat(),
        "unread": {user_a: 0, user_b: 0},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.conversations.insert_one(conv)
    conv.pop("_id", None)
    return conv


async def add_message(conversation_id: str, sender_id: str, text: str, is_system: bool = False):
    msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "sender_id": sender_id,
        "text": text,
        "is_system": is_system,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.messages.insert_one(msg)
    msg.pop("_id", None)
    conv = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    unread = conv.get("unread", {})
    for p in conv["participants"]:
        if p != sender_id:
            unread[p] = unread.get(p, 0) + 1
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {"last_message": text, "last_message_at": msg["timestamp"], "unread": unread}},
    )
    await manager.broadcast(conversation_id, msg)
    return msg


@api_router.post("/conversations")
async def create_conversation(payload: ConversationCreate, user=Depends(get_current_user)):
    conv = await get_or_create_conversation(user["user_id"], payload.other_user_id, payload.item_id)
    return conv


async def enrich_conversation(conv, user):
    others = [p for p in conv["participants"] if p != user["user_id"]]
    other_id = others[0] if others else user["user_id"]
    other = await db.users.find_one({"user_id": other_id}, {"_id": 0})
    conv["other_user"] = {"user_id": other["user_id"], "name": other.get("name"),
                         "picture": other.get("picture")} if other else None
    conv["unread_count"] = conv.get("unread", {}).get(user["user_id"], 0)
    return conv


@api_router.get("/conversations")
async def list_conversations(user=Depends(get_current_user)):
    cursor = db.conversations.find({"participants": user["user_id"]}, {"_id": 0})
    convs = await cursor.to_list(1000)
    convs.sort(key=lambda x: x.get("last_message_at", ""), reverse=True)
    return [await enrich_conversation(c, user) for c in convs]


@api_router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: str, user=Depends(get_current_user)):
    conv = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conv or user["user_id"] not in conv["participants"]:
        raise HTTPException(status_code=404, detail="Conversation not found")
    cursor = db.messages.find({"conversation_id": conversation_id}, {"_id": 0})
    msgs = await cursor.to_list(2000)
    msgs.sort(key=lambda x: x.get("timestamp", ""))
    # mark read
    unread = conv.get("unread", {})
    unread[user["user_id"]] = 0
    await db.conversations.update_one({"id": conversation_id}, {"$set": {"unread": unread}})
    other = await enrich_conversation(conv, user)
    return {"messages": msgs, "conversation": other}


@api_router.post("/messages/{conversation_id}")
async def post_message(conversation_id: str, payload: MessageCreate, user=Depends(get_current_user)):
    conv = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conv or user["user_id"] not in conv["participants"]:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return await add_message(conversation_id, user["user_id"], payload.text)


class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, conversation_id: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(conversation_id, []).append(ws)

    def disconnect(self, conversation_id: str, ws: WebSocket):
        if conversation_id in self.active and ws in self.active[conversation_id]:
            self.active[conversation_id].remove(ws)

    async def broadcast(self, conversation_id: str, message: dict):
        for ws in list(self.active.get(conversation_id, [])):
            try:
                await ws.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


@app.websocket("/api/ws/chat/{conversation_id}")
async def ws_chat(websocket: WebSocket, conversation_id: str, token: str = Query(None)):
    if not token:
        token = websocket.cookies.get("session_token")
    user = await get_user_from_token(token) if token else None
    if not user:
        await websocket.close(code=1008)
        return
    await manager.connect(conversation_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            text = data.get("text", "").strip()
            if text:
                await add_message(conversation_id, user["user_id"], text)
    except WebSocketDisconnect:
        manager.disconnect(conversation_id, websocket)
    except Exception:
        manager.disconnect(conversation_id, websocket)


# ----------------------------- Reviews / Public profile -----------------------------
@api_router.post("/reviews")
async def create_review(payload: ReviewCreate, user=Depends(get_current_user)):
    if payload.reviewee_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot review yourself")
    review = {
        "id": str(uuid.uuid4()),
        "reviewee_id": payload.reviewee_id,
        "reviewer_id": user["user_id"],
        "reviewer_name": user.get("name"),
        "reviewer_picture": user.get("picture"),
        "rating": payload.rating,
        "comment": payload.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(review)
    review.pop("_id", None)
    return review


@api_router.get("/users/{user_id}")
async def public_profile(user_id: str, request: Request):
    profile = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    viewer = None
    try:
        viewer = await get_current_user(request)
    except Exception:
        pass
    items = await db.items.find({"owner_id": user_id}, {"_id": 0}).to_list(1000)
    items = [await enrich_item(i, viewer) for i in items]
    reviews = await db.reviews.find({"reviewee_id": user_id}, {"_id": 0}).to_list(1000)
    reviews.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    avg = round(sum(r["rating"] for r in reviews) / len(reviews), 1) if reviews else 0
    return {"profile": profile, "listings": items, "reviews": reviews,
            "avg_rating": avg, "review_count": len(reviews)}


@api_router.get("/")
async def root():
    return {"message": "Campus Rent API"}


# ----------------------------- Seed -----------------------------
SEED_AVATARS = [
    "https://images.unsplash.com/photo-1624918479892-3e5df2910410?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwzfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0fGVufDB8fHx8MTc4MjcwMDI0Nnww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1544168190-79c17527004f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwyfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0fGVufDB8fHx8MTc4MjcwMDI0Nnww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1618355776464-8666794d2520?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0fGVufDB8fHx8MTc4MjcwMDI0Nnww&ixlib=rb-4.1.0&q=85",
]
SEED_ITEMS = [
    ("Xiaomi Electric Scooter Pro 2", "mobility", 15, "https://images.unsplash.com/photo-1654748646458-056253a82853?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwyfHxlbGVjdHJpYyUyMHNjb290ZXIlMjBjaXR5fGVufDB8fHx8MTc4MjcwMDI0NXww&ixlib=rb-4.1.0&q=85", "Zip across campus fast. Long battery, barely used. Helmet included."),
    ("Sony WH-1000XM4 Headphones", "electronics", 8, "https://images.unsplash.com/photo-1546435770-a3e426bf472b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxoZWFkcGhvbmVzJTIwZGVza3xlbnwwfHx8fDE3ODI3MDAyNDV8MA&ixlib=rb-4.1.0&q=85", "Noise cancelling king. Perfect for finals week focus sessions."),
    ("Sony A7III Mirrorless Camera", "electronics", 30, "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxtaXJyb3JsZXNzJTIwY2FtZXJhfGVufDB8fHx8MTc4MjcwMDI2M3ww&ixlib=rb-4.1.0&q=85", "Full-frame beast for your film project. Comes with 28-70mm lens."),
    ("Intro to Economics 10th Ed.", "textbooks", 3, "https://images.unsplash.com/photo-1516979187457-637abb4f9353?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwzfHx0ZXh0Ym9va3MlMjBzdGFjayUyMGRlc2t8ZW58MHx8fHwxNzgyNzAwMjYzfDA&ixlib=rb-4.1.0&q=85", "Mankiw classic. No highlights, like new. Save $200 vs buying."),
]


@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    # seed demo data
    count = await db.items.count_documents({})
    if count == 0:
        names = [("Maya Chen", "maya@campus.edu"), ("Jordan Lee", "jordan@campus.edu"), ("Sam Rivera", "sam@campus.edu")]
        owner_ids = []
        for i, (nm, em) in enumerate(names):
            uid = f"user_seed_{i}"
            await db.users.update_one({"user_id": uid}, {"$set": {
                "user_id": uid, "email": em, "name": nm, "picture": SEED_AVATARS[i % len(SEED_AVATARS)],
                "bio": "Campus student renting out gear I'm not using.",
                "location": {"city": "Berkeley", "state": "CA", "lat": 37.8719, "lng": -122.2585},
                "notification_prefs": {"requests": True, "messages": True, "promos": False},
                "created_at": datetime.now(timezone.utc).isoformat(),
            }}, upsert=True)
            owner_ids.append(uid)
        for idx, (title, cat, price, img, desc) in enumerate(SEED_ITEMS):
            await db.items.insert_one({
                "id": str(uuid.uuid4()),
                "owner_id": owner_ids[idx % len(owner_ids)],
                "title": title, "description": desc, "price_per_day": price,
                "category": cat,
                "location": {"city": "Berkeley", "state": "CA", "lat": 37.8719 + idx * 0.01, "lng": -122.2585},
                "images": [img], "status": "available", "liked_by": [],
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        logger.info("Seeded demo data")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
